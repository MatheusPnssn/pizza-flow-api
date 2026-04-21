'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Orders extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Um pedido pertence a um usuário
      Orders.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      // Um pedido tem vários produtos associados a ele
      Orders.hasMany(models.OrderProducts, { foreignKey: 'orderId', as: 'items' });
    }
  }
  Orders.init({
    userId: DataTypes.INTEGER,
    address: DataTypes.STRING,
    total_price: DataTypes.FLOAT,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Orders',
  });
  return Orders;
};