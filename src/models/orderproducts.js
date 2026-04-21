'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderProducts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Este item de carrinho pertence a um pedido
      OrderProducts.belongsTo(models.Orders, { foreignKey: 'orderId', as: 'order' });
      // Este item de carrinho é referente a um produto específico
      OrderProducts.belongsTo(models.Products, { foreignKey: 'productId', as: 'product' });
    }
  }
  OrderProducts.init({
    orderId: DataTypes.INTEGER,
    productId: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    priceAtTime: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'OrderProducts',
  });
  return OrderProducts;
};