"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      let transaction = await queryInterface.sequelize.transaction();

      const regioes = [
        { nome: "ALTO URUGUAI CATARINENSE" },
        { nome: "ALTO VALE DO ITAJAÍ" },
        { nome: "CENTRO-NORTE" },
        { nome: "CENTRO-OESTE" },
        { nome: "EXTREMO OESTE " },
        { nome: "FOZ DO RIO ITAJAÍ" },
        { nome: "LITORAL SUL" },
        { nome: "NORTE-NORDESTE" },
        { nome: "OESTE" },
        { nome: "PLANALTO NORTE" },
        { nome: "SERRA CATARINENSE" },
        { nome: "SUDESTE" },
        { nome: "SUL" },
        { nome: "VALE DO ITAJAÍ" },
        { nome: "VALE DO ITAJAÍ MIRIM" },
        { nome: "VALE DO ITAPOCU" },
      ];

      await queryInterface.bulkInsert("regioes", regioes, { transaction });

      await queryInterface.sequelize.query(
        `
        UPDATE unidades
        SET regiao_id = regioes.id
        FROM regioes
        WHERE unidades.regional = regioes.nome;
      `,
        { transaction },
      );

      await transaction.commit();
    } catch (e) {
      throw e
      await transaction.rollback();
    }
  },

  async down(queryInterface, Sequelize) {
    let transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Desvincular as regiões (setar a chave estrangeira como nula novamente)
      await queryInterface.sequelize.query(
        `
          UPDATE unidades
          SET regiao_id = NULL;
        `,
        { transaction },
      );

      // 2. Remover as regiões que foram inseridas no up
      const nomesRegioes = [
        "ALTO URUGUAI CATARINENSE",
        "ALTO VALE DO ITAJAÍ",
        "CENTRO-NORTE",
        "CENTRO-OESTE",
        "EXTREMO OESTE ",
        "FOZ DO RIO ITAJAÍ",
        "LITORAL SUL",
        "NORTE-NORDESTE",
        "OESTE",
        "PLANALTO NORTE",
        "SERRA CATARINENSE",
        "SUDESTE",
        "SUL",
        "VALE DO ITAJAÍ",
        "VALE DO ITAJAÍ MIRIM",
        "VALE DO ITAPOCU",
      ];

      await queryInterface.bulkDelete(
        "regioes",
        {
          nome: {
            [Sequelize.Op.in]: nomesRegioes,
          },
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
