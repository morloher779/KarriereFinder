const jwt = require('jsonwebtoken');

// Geheimschlüssel für JWT (sollte ein komplexer String sein, aus .env laden!)
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: 'Authentifizierungstoken erforderlich' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Token ist ungültig oder abgelaufen
            return res.status(403).json({ message: 'Ungültiges oder abgelaufenes Token' });
        }
        req.user = user; // Füge Benutzerinformationen zum Request hinzu
        next(); // Fortfahren, wenn Authentifizierung erfolgreich
    });
};

module.exports = authenticateToken;