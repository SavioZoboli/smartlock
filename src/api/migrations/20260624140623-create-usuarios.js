'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable("usuarios", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      uid_rfid: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      nome: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      matricula: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      unidade_lotacao_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "unidades",
          key: "id",
        },
      },
      ativo: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('usuarios');
  }
};
