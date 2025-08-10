//TODO: - npm install bcryptjs jsonwebtoken better-sqlite3
// Backend
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

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

// Middleware
app.use(cors()); // Erlaubt Cross-Origin-Anfragen von deinem Frontend
app.use(express.json()); // Ermöglicht das Parsen von JSON im Request-Body

// --- Frontend-Dateien bereitstellen ---
// Statische Dateien aus dem 'public'-Ordner servieren
app.use(express.static(path.join(__dirname, '..', 'public')));

// Haupt-Route für die index.html, wenn jemand die Basis-URL aufruft
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Backend-Endpunkt für die Passwortprüfung
app.post('/api/login', (req, res) => {
    // ACHTUNG: Captcha hier noch nicht überprüft, da das im Frontend generiert wird.
    // In einer realen Anwendung würde man hier ein Backend-basiertes Captcha-System nutzen.
    const { password } = req.body;
    
    // Das geheime Passwort ist nur hier im Backend bekannt!
    const CORRECT_PASSWORD = process.env.ACCESS_PASSWORD;

    if (!CORRECT_PASSWORD) {
        console.error("FEHLER: ACCESS_PASSWORD ist nicht in den Umgebungsvariablen gesetzt.");
        return res.status(500).json({ success: false, message: 'Serverfehler: Passwort nicht konfiguriert.' });
    }

    if (password === CORRECT_PASSWORD) {
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