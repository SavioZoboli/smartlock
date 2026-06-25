"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("smartlocks", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      mac_address: {
        type: Sequelize.DataTypes.STRING,
        unique: true,
        allowNull: false,
      },
      apelido: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      unidade_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "unidades",
          key: "id",
        },
      },
      is_online: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      has_equipamentos: {
        type: Sequelize.DataTypes.BOOLEAN,
        allowNull: false,
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

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("smartlocks");
  },
};
