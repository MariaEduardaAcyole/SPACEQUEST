const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const token = req.session.token || req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token não fornecido' });
    }
    console.log('Token JWT armazenado na sessão:', req.session.token);

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Falha na autenticação do token' });
        }
        req.user = decoded;
        next();
    });
}

module.exports = { verificarToken };
