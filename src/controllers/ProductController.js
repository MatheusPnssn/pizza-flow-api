const Controller = require('./Controller').default;
const { Products } = require('../models');

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
            type: 'required' // Ex: Pizza, Bebida
        }, req.body);

        if (validate.status != 200) {
            return res.status(validate.status).json(validate);
        }

        try {
            // Campos baseados na migration create-products
            const { name, description, price, type, image } = req.body;
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
            return res.status(500).json({ error: 'Erro ao criar produto' });
        }
    }

    // UC02: Editar produto (Acesso: Admin)
    static async updateProduct(req, res) {
        // Validação básica dos campos obrigatórios para edição
        let validate = await Controller.validate({
            name: 'required|min:2',
            price: 'required',
            type: 'required'
        }, req.body);

        if (validate.status != 200) {
            return res.status(validate.status).json(validate);
        }

        try {
            const { id } = req.params;
            const product = await Products.findByPk(id);

            if (!product) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }

            // Atualiza os dados com o que veio no corpo da requisição
            await product.update(req.body);

            return res.status(200).json({
                message: "Produto atualizado com sucesso",
                product
            });
        } catch (error) {
            console.error(error);
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

            // Remove o registro do banco de dados
            await product.destroy();

            return res.status(200).json({ message: 'Produto removido com sucesso' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao remover produto' });
        }
    }
}

module.exports = ProductController;