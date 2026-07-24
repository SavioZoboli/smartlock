'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('itensReserva',{
      reserva_id:{
              type:Sequelize.DataTypes.INTEGER,
              allowNull:false,
              references:{
                  model:"reservas",
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
    await queryInterface.dropTable('itensReserva')
  }
};
