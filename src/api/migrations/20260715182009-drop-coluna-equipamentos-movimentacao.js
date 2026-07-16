"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("movimentacoes", "equipamento_id");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("movimentacoes", "equipamento_id", {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "equipamentos",
        key: "id",
      },
    });
  },
};
