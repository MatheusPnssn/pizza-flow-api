const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const ProductController = require('../controllers/ProductController');
const OrderController = require('../controllers/OrderController');
const authMiddleware = require('../middleware/auth');
const authCompanyMiddleware = require('../middleware/authCompany');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         email:
 *           type: string
 *
 *     Produto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *         image:
 *           type: string
 *
 *     Pedido:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *         total_price:
 *           type: number
 *         status:
 *           type: string
 *           example: Pendente
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *               priceAtTime:
 *                 type: number
 */

// --- ROTAS PÚBLICAS ---

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Criar uma nova conta de usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 */
router.post('/register', UserController.createUser);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Realizar login no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 */
router.post('/login', UserController.login);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Finalizar sessão (Logout)
 *     tags: [Autenticação]
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso (o cliente deve descartar o token).
 */
router.post('/logout', authMiddleware, UserController.logout);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar produtos (cardápio)
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo (ex. Pizza, Bebida)
 *     responses:
 *       200:
 *         description: Lista de produtos.
 */
router.get('/products', ProductController.getAll);

// --- ROTAS CLIENTE (PRECISA DE TOKEN) ---
router.use(authMiddleware);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Visualiza perfil do usuário logado
 *     tags: [Cliente / Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do perfil.
 */
router.get('/profile', UserController.getProfile);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Realiza um novo pedido
 *     tags: [Cliente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pedido'
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso.
 */
router.post('/orders', OrderController.createOrder);

// --- ROTAS ADMIN (PRECISA SER ADMIN) ---
router.use(authCompanyMiddleware);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Resumo de métricas para o administrador
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do dashboard carregados.
 */
router.get('/dashboard', OrderController.getDashboard);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os clientes cadastrados
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários.
 */
router.get('/users', UserController.getUsers);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Cria um novo produto no cardápio
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Produto'
 *     responses:
 *       201:
 *         description: Produto criado.
 */
router.post('/products', ProductController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Atualiza um produto existente
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Produto'
 *     responses:
 *       200:
 *         description: Produto atualizado.
 */
router.put('/products/:id', ProductController.updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Remove um produto do cardápio
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Produto removido.
 */
router.delete('/products/:id', ProductController.deleteProduct);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Lista todos os pedidos realizados
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de pedidos.
 */
router.get('/admin/orders', OrderController.getAllOrders);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   put:
 *     summary: Altera o status de um pedido
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: Concluido
 *     responses:
 *       200:
 *         description: Status atualizado.
 */
router.put('/admin/orders/:id/status', OrderController.updateStatus);

module.exports = router;