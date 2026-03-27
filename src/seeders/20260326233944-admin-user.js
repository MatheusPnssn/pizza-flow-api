'use strict';
const bcrypt = require('bcrypt');
const { User } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Criptografando a senha antes de salvar
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminEmail = 'admin@pizzaflow.com';
    const user = await User.findOne({ where: { email: adminEmail } });
    if (user) {
      return true;
    }

    return queryInterface.bulkInsert('Users', [{
      name: 'Admin Pizza Flow',
      email: adminEmail,
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