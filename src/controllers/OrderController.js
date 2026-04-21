const Controller = require('./Controller').default;
const { Orders, OrderProducts, User, sequelize } = require('../models');

class OrderController extends Controller {
    // UC12: Criar pedido (Acesso: Cliente logado)
    static async createOrder(req, res) {
        let validate = await Controller.validate({
            address: 'required|min:5'
        }, req.body);

        if (validate.status != 200) {
            return res.status(validate.status).json(validate);
        }

        const t = await sequelize.transaction();

        try {
            const { address, items } = req.body;

            const order = await Orders.create({
                userId: req.userId,
                address,
                status: 'Pendente',
                total_price: items.reduce((acc, item) => acc + (item.priceAtTime * item.quantity), 0)
            }, { transaction: t });

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

    // UC03: Visualizar pedidos (Acesso: Admin)
    static async getAllOrders(req, res) {
        try {
            const { status } = req.query;
            const where = {};

            if (status && status !== 'Todos') {
                where.status = status;
            }

            const orders = await Orders.findAll({
                where,
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'user', // Deve ser o mesmo 'as' que colocamos no orders.js
                        attributes: ['name']
                    },
                    {
                        model: OrderProducts,
                        as: 'items' // Deve ser o mesmo 'as' que colocamos no orders.js
                    }
                ]
            });

            return res.status(200).json(orders);
        } catch (error) {
            console.error("ERRO DETALHADO NO GET ALL ORDERS:", error);
            return res.status(500).json({ error: 'Erro ao buscar pedidos' });
        }
    }

    static async getDashboard(req, res) {
        try {
            const revenueByDay = await Orders.findAll({
                attributes: [
                    [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
                    [sequelize.fn('SUM', sequelize.col('total_price')), 'total']
                ],
                group: ['date'],
                order: [['date', 'ASC']]
            });
            const totalRevenue = await Orders.sum('total_price');
            const totalOrders = await Orders.count();
            const totalCustomers = await User.count({ where: { type: 'customer' } });

            const recentOrders = await Orders.findAll({
                limit: 5,
                order: [['createdAt', 'DESC']],
                include: [{ model: User, as: 'user', attributes: ['name'] }]
            });

            return res.status(200).json({
                faturamento: totalRevenue || 0,
                pedidos: totalOrders || 0,
                usuarios: totalCustomers || 0,
                faturamentoPorDia: revenueByDay.map(item => ({
                    date: item.get('date'),
                    total: Number(item.get('total'))
                }))
            });
        } catch (error) {
            console.error("ERRO NO DASHBOARD:", error);
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

            await order.update({ status });

            return res.status(200).json({
                message: `Status do pedido #${id} atualizado para ${status}`,
                order
            });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar status do pedido' });
        }
    }

    // UC13: Buscar pedidos do usuário logado (Acesso: Cliente)
    static async getUserOrders(req, res) {
        try {
            const { status } = req.query;
            const where = {userId: req.userId };

            if (status && status !== 'Todos') {
                where.status = status;
            }


            // Buscamos todos os pedidos onde o userId é igual ao id do token
            const orders = await Orders.findAll({
                where,
                order: [['createdAt', 'DESC']], // Mais recentes primeiro
                include: [
                    {
                        model: OrderProducts,
                        as: 'items',
                    }
                ]
            });

            return res.status(200).json(orders);
        } catch (error) {
            console.error("ERRO AO BUSCAR PEDIDOS DO USUÁRIO:", error);
            return res.status(500).json({ error: 'Erro ao buscar seus pedidos' });
        }
    }
}

module.exports = OrderController;