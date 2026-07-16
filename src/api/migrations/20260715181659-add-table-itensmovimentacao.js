'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('itensMovimentacao',{
      movimentacao_id:{
              type:Sequelize.DataTypes.INTEGER,
              allowNull:false,
              references:{
                  model:"movimentacoes",
                  key:"id"
              }
          },
          equipamento_id:{
              type:Sequelize.DataTypes.INTEGER,
              allowNull:false,
              references:{
                  model:"equipamentos",
                  key:"id"
              }
          }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('itensMovimentacao')
  }
};
