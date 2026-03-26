const jwt = require('jsonwebtoken');
const { TokenBlacklist } = require('../models'); // Importe o model da Blacklist

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Erro no formato do token' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token malformatado' });
    }

    try {
        // 1. Verificar se o token está na Blacklist (Logout já foi feito)
        const isBlacklisted = await TokenBlacklist.findOne({ where: { token } });

        if (isBlacklisted) {
            return res.status(401).json({ error: 'Sessão encerrada. Por favor, faça login novamente.' });
        }

        // 2. Verificar a validade e expiração do JWT
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Token inválido ou expirado' });
            }

            // 3. Injetar os dados no objeto da requisição
            req.userId = decoded.id;
            req.userType = decoded.type;  

            return next();
        });

    } catch (error) {
        return res.status(500).json({ error: 'Erro interno na validação do token' });
    }
};

module.exports = authMiddleware;