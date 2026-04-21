const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const ProductController = require('../controllers/ProductController');
const OrderController = require('../controllers/OrderController');
const authMiddleware = require('../middleware/auth');
const authCompanyMiddleware = require('../middleware/authCompany');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 2. DEFINIMOS O CAMINHO DA PASTA
const uploadPath = 'public/uploads/';

// 3. TRAVA DE SEGURANÇA: Se a pasta não existir no Render, o Node cria ela
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome único
    }
});
const upload = multer({ storage: storage });

router.use('/uploads', express.static('public/uploads'));

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phone:
 *           type: string
 *         image:
 *           type: string
 *         type:
 *           type: string
 *           enum: [customer, admin]
 *
 *     UserCreate:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         password:
 *           type: string
 *
 *     Produto:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         type:
 *           type: string
 *           example: Pizza
 *         image:
 *           type: string
 *
 *     OrderProduct:
 *       type: object
 *       properties:
 *         productId:
 *           type: integer
 *         quantity:
 *           type: integer
 *         priceAtTime:
 *           type: number
 *
 *     PedidoCreate:
 *       type: object
 *       required: [address, items]
 *       properties:
 *         address:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *
 *     Pedido:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         address:
 *           type: string
 *         total_price:
 *           type: number
 *         status:
 *           type: string
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderProduct'
 *     UserUpdate:
 *       type: object
 *       properties:
 *        name:
 *          type: string
 *        phone:
 *          type: string
 *        image:
 *          type: string 
 *        items:
 *          type: array
 *          items:
 *             $ref: '#/components/schemas/UserUpdate'
 */

// --- ROTAS PÚBLICAS ---

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Criar uma nova conta
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 */
router.post('/register', UserController.createUser);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login no sistema
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */
router.post('/login', UserController.login);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout (invalidar token)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado
 */
router.post('/logout', authMiddleware, UserController.logout);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Listar produtos
 *     tags: [Produtos]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filtrar por tipo
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get('/products', ProductController.getAll);

// --- CLIENTE ---
router.use(authMiddleware);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Perfil do usuário logado
 *     tags: [Cliente / Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 */
router.get('/profile', UserController.getProfile);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Atualizar perfil do usuário logado
 *     tags: [Cliente / Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 */
router.put('/profile', UserController.updateProfile);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Criar pedido
 *     tags: [Cliente]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PedidoCreate'
 *     responses:
 *       201:
 *         description: Pedido criado
 */
router.post('/orders', OrderController.createOrder);

// --- ADMIN ---
router.use(authCompanyMiddleware);

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Métricas do sistema
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do dashboard
 */
router.get('/dashboard', OrderController.getDashboard);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuários
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/users', UserController.getUsers);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Criar produto
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
 *         description: Produto criado
 */
router.post('/products', (req, res, next) => {
    console.log('HEADERS:', req.headers['content-type']);
    next();
}, upload.single('image'), ProductController.createProduct);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Atualizar produto
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
 *         description: Produto atualizado
 */
router.put('/products/:id', upload.single('image'), ProductController.updateProduct);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Remover produto
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Produto removido
 */
router.delete('/products/:id', ProductController.deleteProduct);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Listar pedidos
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
 *         description: Lista de pedidos
 */
router.get('/admin/orders', OrderController.getAllOrders);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   put:
 *     summary: Atualizar status do pedido
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 example: Concluido
 *     responses:
 *       200:
 *         description: Status atualizado
 */
router.put('/admin/orders/:id/status', OrderController.updateStatus);




module.exports = router;