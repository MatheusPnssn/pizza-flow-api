require('dotenv').config();

module.exports = {
development: {
username: process.env.DB_USER || "root",
password: process.env.DB_PASS || null,
database: "pizza_flow_db",
host: "127.0.0.1",
dialect: "mysql"
},
production: {
username: process.env.DB_USER,
password: process.env.DB_PASS,
database: process.env.DB_NAME,
host: process.env.DB_HOST,
port: process.env.DB_PORT || 4000,
dialect: "mysql",
dialectOptions: {
ssl: {
rejectUnauthorized: true
}
}
}
};