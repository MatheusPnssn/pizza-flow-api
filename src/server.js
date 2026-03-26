require('dotenv').config();
const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const app = express();

const PORT = process.env.PORT || 3000;

// 1. Middlewares de análise (Parsing)
app.use(cors());
app.use(express.json());

// Middleware para capturar erros de JSON malformado
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ error: "JSON inválido ou corpo vazio inesperado" });
    }
    next();
});

// 2. Configuração do Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'PizzaFlow API',
            version: '1.0.0',
            description: 'Documentação da API do sistema de Pizzaria',
        },
        servers: [{ url: `http://localhost:${PORT}` }],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    
    apis: ['./src/routes/*.js', './src/controllers/*.js'], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// 3. Rota do Swagger (DEVE VIR ANTES DO app.use(routes))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 4. Rotas da API
app.use(routes); 

app.listen(PORT, () => {
  console.log(`Swagger disponível em: http://localhost:${PORT}/api-docs`);
});