const Database = require('better-sqlite3');
const db = new Database('users.db'); // Erstellt oder öffnet die Datenbankdatei

// Tabelle für Benutzer erstellen, falls sie nicht existiert
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`);

console.log('Database initialized and "users" table ensured.');

module.exports = db;