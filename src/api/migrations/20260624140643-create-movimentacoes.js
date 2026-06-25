'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("movimentacoes", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      equipamento_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "equipamentos",
          key: "id",
        },
      },
      usuario_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id",
        },
      },
      smartlock_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "smartlocks",
          key: "id",
        },
      },
      tipo_movimento: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Date.now(),
      },
      createdAt: {
        type: Sequelize.Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.Sequelize.DataTypes.DATE,
        allowNull: true,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('movimentacoes');
  }
};
