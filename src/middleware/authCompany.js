const { User } = require('../models');

const authCompanyMiddleware = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.userId);

        if (user && user.type === 'admin') {
            return next();
        }

        return res.status(403).json({ 
            error: 'Acesso negado. Rota exclusiva para administradores.' 
        });
    } catch (error) {
        return res.status(500).json({ error: 'Erro na verificação de permissão' });
    }
};

module.exports = authCompanyMiddleware;