"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("unidades", "regional");
    await queryInterface.changeColumn("unidades", "regiao_id", {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "regioes",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    try {
      let transaction = await queryInterface.sequelize.transaction();
      await queryInterface.changeColumn(
        "unidades",
        "regiao_id",
        {
          type: Sequelize.DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: "regioes",
            key: "id",
          },
        },
        { transaction },
      );
      await queryInterface.addColumn(
        "unidades",
        "regional",
        {
          type: Sequelize.DataTypes.STRING(45),
          allowNull: false,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE unidades
        SET regiao = regioes.nome
        FROM regioes
        WHERE unidades.regiao_id = regioes.id;
      `,
        { transaction },
      );
      await transaction.commit();
    } catch (e) {
      throw e;
      await transaction.rollback();
    }
  },
};
