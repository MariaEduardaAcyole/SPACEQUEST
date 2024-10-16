const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(403).send('Token não fornecido.');
    }

    jwt.verify(token, 'segredo', (err, decoded) => {
        if (err) {
            return res.status(401).send('Token inválido.');
        }
        req.user = decoded;
        next();
    });
}

module.exports = { verificarToken };
