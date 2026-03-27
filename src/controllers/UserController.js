const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Controller = require('./Controller').default;
const { User, TokenBlacklist } = require('../models');

class UserController extends Controller{
    static async createUser(req, res){
        let validate = await Controller.validate({
            name: 'required|min:2',
            email: 'required|min:2|unique:users',
            password: 'required|min:2'
        }, req.body)

        if (validate.status != 200) {
            return res.status(validate.status).json(validate);
        }

        try {
            const { name, email, password } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const user = await User.create({
                name,
                email,
                type: 'customer',
                password: hashedPassword
            });

            const token = jwt.sign(
                { id: user.id, name: user.name }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1d' }
            );

            const userResponse = user.toJSON();
            delete userResponse.password;

            return res.status(201).json({
                user: userResponse,
                token: token
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao criar conta' });
        }
    }

    static async login(req, res) {
        let validate = await Controller.validate({
            email: 'required',
            password: 'required'
        }, req.body);

        if (validate.status != 200) {
            return res.status(validate.status).json(validate);
        }

        try {
            const { email, password } = req.body;

            // 1. Busca o usuário pelo e-mail
            const user = await User.findOne({ where: { email } });

            if (!user) {
                return res.status(401).json({ error: 'E-mail ou senha incorretos' });
            }

            // 2. Compara a senha digitada com o hash do banco
            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'E-mail ou senha incorretos' });
            }

            // 3. Gera o token (válido por 1 dia)
            const token = jwt.sign(
                { id: user.id, name: user.name, type: user.type }, 
                process.env.JWT_SECRET, 
                { expiresIn: '1d' }
            );

            // 4. Responde com os dados e o token
            const userResponse = user.toJSON();
            delete userResponse.password;

            return res.status(200).json({
                user: userResponse,
                token: token
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao realizar login' });
        }
    }

    static async getProfile(req, res){
        try {
            const user = await User.findByPk(req.userId, {
                attributes: { exclude: ['password'] } 
            });

            if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

            return res.status(200).json(user);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar perfil' });
        }
    }

    static async updateProfile(req, res) {
        try {
            const user = await User.findByPk(req.userId);

            if (!user) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }

            const { name, phone, image } = req.body;

            await user.update({
                name: name ?? user.name,
                phone: phone ?? user.phone,
                image: image ?? user.image
            });

            const userResponse = user.toJSON();
            delete userResponse.password;

            return res.status(200).json(userResponse);

        } catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar perfil' });
        }
    }

    static async getUsers(req, res){
        try {
            const users = await User.findAll();
            return res.status(200).json(users);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar usuários' });
        }
    }

    static async logout(req, res) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            await TokenBlacklist.create({ token });
            return res.status(200).json({ message: 'Logout realizado. Token invalidadado.' });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao processar logout' });
        }
    }
}

module.exports = UserController;