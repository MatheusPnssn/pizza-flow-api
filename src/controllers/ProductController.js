const Controller = require('./Controller').default;
const { Products } = require('../models');
const fs = require('fs');
const path = require('path');
class ProductController extends Controller {
    // UC11: Visualizar cardápio/produtos (Acesso: Cliente e Admin)
    static async getAll(req, res) {
        try {
            const { type } = req.query; // Pega o ?type= na URL
            const where = {};
            
            if (type) {
                where.type = type; // Filtra no banco se o type for enviado
            }

            const products = await Products.findAll({ where });
            return res.status(200).json(products);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar produtos' });
        }
    }

    // UC02: Criar produtos (Acesso: Admin via authCompanyMiddleware)
    static async createProduct(req, res) {
        let validate = await Controller.validate({
            name: 'required|min:2',
            price: 'required',
            type: 'required'
        }, req.body);

        if (validate.status !== 200) {
            // Se falhar a validação, mas enviou imagem, apaga a imagem que o multer salvou
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(validate.status).json(validate);
        }

        try {
            const { name, description, price, type } = req.body;

            // Pega o caminho da imagem salva pelo Multer (se houver)
            let image = req.body.image; // fallback para URL em texto (caso ainda mande link)
            if (req.file) {
                // Salva o caminho relativo para o banco de dados
                image = `/uploads/${req.file.filename}`;
            }

            const product = await Products.create({
                name,
                description,
                price,
                type,
                image
            });

            return res.status(201).json(product);
        } catch (error) {
            console.error(error);
            if (req.file) fs.unlinkSync(req.file.path); // Apaga em caso de erro no DB
            return res.status(500).json({ error: 'Erro ao criar produto' });
        }
    }

    // UC02: Editar produto (Acesso: Admin)
    static async updateProduct(req, res) {
        let validate = await Controller.validate({
            name: 'required|min:2',
            price: 'required',
            type: 'required'
        }, req.body);

        if (validate.status != 200) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(validate.status).json(validate);
        }

        try {
            const { id } = req.params;
            const product = await Products.findByPk(id);

            if (!product) {
                if (req.file) fs.unlinkSync(req.file.path);
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            let image = product.image; // Mantém a imagem atual por padrão

            // Se uma NOVA imagem foi enviada
            if (req.file) {
                image = `/uploads/${req.file.filename}`;

                // Apaga a imagem ANTIGA do servidor (se existir e for um arquivo local)
                if (product.image && product.image.startsWith('/uploads/')) {
                    const oldImagePath = path.join(__dirname, '..', 'public', product.image);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }
            } else if (req.body.image && typeof req.body.image === 'string') {
                image = req.body.image;
            }

            await product.update({ ...req.body, image });

            return res.status(200).json({
                message: "Produto atualizado com sucesso",
                product
            });
        } catch (error) {
            console.error(error);
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(500).json({ error: 'Erro ao atualizar produto' });
        }
    }

    // UC02: Remover produto (Acesso: Admin)
    static async deleteProduct(req, res) {
        try {
            const { id } = req.params;
            const product = await Products.findByPk(id);

            if (!product) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            // Apaga a imagem associada do servidor antes de deletar do banco
            if (product.image && product.image.startsWith('/uploads/')) {
                const imagePath = path.join(__dirname, '..', 'public', product.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }

            await product.destroy();

            return res.status(200).json({ message: 'Produto removido com sucesso' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao remover produto' });
        }
    }
}

module.exports = ProductController;