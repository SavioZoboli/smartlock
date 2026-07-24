"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reservas", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        primaryKey: true,
        unique: true,
        allowNull: false,
        autoIncrement:true
      },
      usuario_id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "usuarios",
          key: "id",
        },
      },
      reserva_inicio: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      reserva_fim: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      situacao: {
        type: Sequelize.DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "PENDENTE",
      },
      motivo: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DataTypes.STRING,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DataTypes.STRING,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reservas')
  },
};
