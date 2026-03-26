const Controller = require('./Controller').default;
const { Orders, OrderProducts, sequelize } = require('../models');

class OrderController extends Controller {
    // UC12: Criar pedido (Acesso: Cliente logado) [cite: 29]
    static async createOrder(req, res) {
        let validate = await Controller.validate({
            address: 'required|min:5'
        }, req.body);

        if (validate.status != 200) {
            return res.status(validate.status).json(validate);
        }

        // Usamos Transaction pois envolve duas tabelas (Orders e OrderProducts) [cite: 3, 4]
        const t = await sequelize.transaction();

        try {
            const { address, items } = req.body; // items deve ser um array de produtos

            // 1. Criar o registro na tabela Orders [cite: 3]
            const order = await Orders.create({
                userId: req.userId, // ID do token via authMiddleware
                address,
                status: 'Pendente',
                total_price: items.reduce((acc, item) => acc + (item.priceAtTime * item.quantity), 0)
            }, { transaction: t });

            // 2. Criar os vínculos na tabela OrderProducts [cite: 4]
            const orderItems = items.map(item => ({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                priceAtTime: item.priceAtTime
            }));

            await OrderProducts.bulkCreate(orderItems, { transaction: t });

            await t.commit();
            return res.status(201).json(order);

        } catch (error) {
            await t.rollback();
            console.error(error);
            return res.status(500).json({ error: 'Erro ao processar pedido' });
        }
    }

    // UC03: Visualizar pedidos (Acesso: Admin) [cite: 37]
    static async getAllOrders(req, res) {
        try {
            const { status } = req.query; // Pega o ?status= na URL
            const where = {};

            if (status && status !== 'Todos') {
                where.status = status;
            }

            const orders = await Orders.findAll({
                where,
                include: [{ model: User, as: 'user', attributes: ['name'] }],
                order: [['createdAt', 'DESC']]
            });
            return res.status(200).json(orders);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar pedidos' });
        }
    }

    static async getDashboard(req, res) {
        try {
            // 1. Soma do faturamento total (total_price)
            const totalRevenue = await Orders.sum('total_price');

            // 2. Contagem total de pedidos
            const totalOrders = await Orders.count();

            // 3. Contagem total de clientes (onde type é 'customer')
            const totalCustomers = await User.count({ where: { type: 'customer' } });

            // 4. Últimos 5 pedidos para exibir na lista do Dashboard
            const recentOrders = await Orders.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
                include: [{ model: User, as: 'user', attributes: ['name'] }]
            });

            return res.status(200).json({
                revenue: totalRevenue || 0,
                ordersCount: totalOrders,
                customersCount: totalCustomers,
                recentOrders: recentOrders
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro ao carregar dados do dashboard' });
        }
    }

    // UC04: Editar status do pedido
    static async updateStatus(req, res) {
        let validate = await Controller.validate({
            status: 'required'
        }, req.body);

        if (validate.status != 200) {
            return res.status(validate.status).json(validate);
        }

        try {
            const { id } = req.params;
            const { status } = req.body;

            const order = await Orders.findByPk(id);

            if (!order) {
                return res.status(404).json({ error: 'Pedido não encontrado' });
            }

            // Atualiza apenas o campo status
            await order.update({ status });

            return res.status(200).json({
                message: `Status do pedido #${id} atualizado para ${status}`,
                order
            });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
        }
    }
}

module.exports = OrderController;