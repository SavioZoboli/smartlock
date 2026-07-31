"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("smartlocks", "unidade_id", {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "unidades", // Nome da tabela de Unidades no banco
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("smartlocks", "unidade_id", {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "unidades", // Nome da tabela de Unidades no banco
        key: "id",
      },
    });
  },
};
