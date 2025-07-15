const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Deine Datenbankverbindung

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key'; // Auch hier aus .env laden!
const JWT_EXPIRES_IN = '1h'; // Token gültig für 1 Stunde

const registerUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // 10 Salt-Runden

        const stmt = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)');
        stmt.run(email, hashedPassword);

        res.status(201).json({ message: 'Registrierung erfolgreich!' });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(409).json({ message: 'E-Mail ist bereits registriert.' });
        }
        console.error('Fehler bei der Registrierung:', error);
        res.status(500).json({ message: 'Serverfehler bei der Registrierung.' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'E-Mail und Passwort sind erforderlich.' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Ungültige Anmeldedaten.' });
        }

        // Generiere JWT
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.status(200).json({ message: 'Anmeldung erfolgreich!', token: token });
    } catch (error) {
        console.error('Fehler beim Login:', error);
        res.status(500).json({ message: 'Serverfehler beim Login.' });
    }
};

module.exports = { registerUser, loginUser };