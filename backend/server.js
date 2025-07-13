// Lade Umgebungsvariablen aus der .env-Datei am Anfang
require('dotenv').config(); 

const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3001; // Wähle einen Port, der nicht von deinem Frontend belegt ist (z.B. 3001, wenn Frontend auf 3000 läuft)

// WICHTIG: Hole deinen API-Key aus den Umgebungsvariablen
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

// POST-Route für die Karriereberatung
app.post('/career-suggestion', async (req, res) => {
    try {
        const formData = req.body; // Die gesammelten Daten vom Frontend

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

// Server starten
app.listen(port, () => {
    console.log(`Backend-Server läuft auf http://localhost:${port}`);
});