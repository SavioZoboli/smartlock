'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("equipamentos", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tag: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      patrimonio: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      tipo: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      smartlock_base_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "smartlocks",
          key: "id",
        },
      },
      status_atual: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      usuario_atual_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "usuarios",
          key: "id",
        },
      },
      ativo: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    await queryInterface.dropTable('equipamentos');
  }
};
