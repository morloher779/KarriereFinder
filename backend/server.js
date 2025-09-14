//TODO: - npm install bcryptjs jsonwebtoken better-sqlite3
//.     - npm install express-session
// Backend
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const Database = require('better-sqlite3');
const db = new Database('database.db'); // Die Datenbankdatei wird im Projektordner erstellt

const app = express();
const port = process.env.PORT || 3001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Überprüfe, ob der API-Key gesetzt ist
if (!GEMINI_API_KEY) {
    console.error("FEHLER: GEMINI_API_KEY ist nicht in den Umgebungsvariablen gesetzt.");
    console.error("Bitte erstelle eine .env-Datei im selben Ordner wie server.js und füge GEMINI_API_KEY='DEIN_KEY_HIER' hinzu.");
    process.exit(1); // Beendet die Anwendung
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD; // Passwort aus .env laden

// Middleware
app.use(cors()); // Erlaubt Cross-Origin-Anfragen von deinem Frontend
app.use(express.json()); // Ermöglicht das Parsen von JSON im Request-Body

app.use(session({
    secret: process.env.JWT_SECRET, // Ein geheimes Passwort für die Session-Verschlüsselung
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true } // Session läuft nach 10 Minuten (600000ms) ab
}));

// --- DB-Tabelle erstellen (einmalig beim Start) ---
try {
    const createTable = db.prepare(`
        CREATE TABLE IF NOT EXISTS logins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT UNIQUE,
            login_count INTEGER DEFAULT 1,
            last_login TEXT
        )
    `);
    createTable.run();
    console.log("Datenbanktabelle 'logins' ist bereit.");
} catch (error) {
    console.error("Fehler beim Erstellen der Datenbanktabelle:", error.message);
}

// --- Hilfsfunktion zum Ermitteln der IP-Adresse ---
const getClientIp = (req) => {
    // Wenn hinter einem Proxy wie Nginx, die "X-Forwarded-For"-Header verwenden
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    // IPv6-Format auf IPv4 mappen (falls nötig)
    if (ip.startsWith('::ffff:')) {
        return ip.substr(7);
    }
    return ip;
};

// --- Neu: Endpunkt zum Tracken der Besuche ---
app.post('/api/track-visit', (req, res) => {
    const ip = getClientIp(req);
    const now = new Date().toISOString();

    try {
        // Prüfe, ob die IP bereits existiert
        const selectStmt = db.prepare('SELECT login_count FROM logins WHERE ip_address = ?');
        const user = selectStmt.get(ip);

        if (user) {
            // Wenn die IP existiert, zähle den Counter hoch
            const updateStmt = db.prepare('UPDATE logins SET login_count = ?, last_login = ? WHERE ip_address = ?');
            updateStmt.run(user.login_count + 1, now, ip);
            console.log(`IP-Adresse ${ip} hat sich erneut angemeldet. Zähler: ${user.login_count + 1}`);
        } else {
            // Wenn die IP neu ist, füge sie in die Datenbank ein
            const insertStmt = db.prepare('INSERT INTO logins (ip_address, last_login) VALUES (?, ?)');
            insertStmt.run(ip, now);
            console.log(`Neue IP-Adresse ${ip} wurde protokolliert.`);
        }
        res.status(200).json({ success: true, message: 'Visit logged successfully' });
    } catch (error) {
        console.error('Fehler beim Protokollieren des Besuchs:', error.message);
        res.status(500).json({ success: false, error: 'Database error' });
    }
});

const checkAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next(); // Benutzer ist authentifiziert, fortfahren
    } else {
        // Nicht authentifizierte Benutzer zurück zur Startseite leiten
        res.redirect('/');
    }
};

// --- Frontend-Dateien bereitstellen ---
app.use('/career-finder.html', checkAuth); // <-- Hier wird die Middleware für die spezifische Seite aufgerufen
app.use(express.static(path.join(__dirname, '..', 'public')));

// Haupt-Route für die index.html, wenn jemand die Basis-URL aufruft
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Backend-Endpunkt für die Passwortprüfung
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD;

    if (password === ACCESS_PASSWORD) {
        req.session.authenticated = true; // NEU: Session-Variable setzen
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Ungültiges Passwort.' });
    }
});

// POST-Route für die Karriereberatung
app.post('/api/career-suggestion', async (req, res) => { // authenticateToken als Middleware hinzufügen
    try {
        const formData = req.body;
        // Erstelle den Prompt für das Gemini-Modell
        const prompt = `
            Gib mir drei Berufsvorschläge, die möglichst auf folgende Interessen, Hobbies und Präferenzen abgestimmt sind.
            Ich möchte nach meinem/meiner ${formData.ausbildung} ein/eine ${formData.workPreference}.
            Das sind meine Interessen und Hobbies:
            Freizeitaktivitäten: ${formData.freizeit}
            Schulfächer: ${formData.interests}
            Darüber könnte ich stundenlang reden: ${formData.environment}
            Gruppenarbeit finde ich: ${formData.rating}
            ${formData.reason ? `Die Person lehnte den vorherigen Vorschlag ab, weil: ${formData.reason}. Bitte gib einen alternativen, begründeten Vorschlag.` : ''}

            Gib nur die Namen der Berufe aus und ein kurze Beschreibung dazu.
        `;

        const model = genAI.getGenerativeModel({ model: "gemma-3n-e4b-it" }); // Wähle das gewünschte Gemini-Modell

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Sende den generierten Text zurück an das Frontend
        res.json({ suggestion: text });

    } catch (error) {
        console.error('Fehler bei der Gemini API-Anfrage:', error);
        // Sende eine Fehlerantwort an das Frontend
        res.status(500).json({ error: 'Fehler beim Abrufen des Berufsvorschlags. Bitte versuchen Sie es später erneut.' });
    }
});

// --- Geschützte Route für das Tool-HTML ---
/*app.get('/career-finder', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'career-finder.html'));
});
 
// Catch-all für 404 (optional, muss zuletzt stehen)
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html')); // Wenn du eine 404.html hast
});*/

// Server starten
app.listen(port, () => {
    console.log(`Server läuft auf http://localhost:${port}`);
    console.log(`Frontend verfügbar unter http://localhost:${port}`);
});
