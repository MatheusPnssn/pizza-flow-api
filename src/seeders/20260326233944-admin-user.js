'use strict';
const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Criptografando a senha antes de salvar
    const hashedPassword = await bcrypt.hash('admin123', 10);

    return queryInterface.bulkInsert('Users', [{
      name: 'Admin Pizza Flow',
      email: 'admin@pizzaflow.com',
      password: hashedPassword,
      type: 'admin', // Aqui definimos o cargo
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down (queryInterface, Sequelize) {
    // Comando para reverter o seeder caso necessário
    return queryInterface.bulkDelete('Users', { email: 'admin@pizzaflow.com' }, {});
  }
};