'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('reservas','situacao',{
      type:Sequelize.DataTypes.STRING(20),
      allowNull:false,
      defaultValue:"AGENDADO"
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('reservas','situacao',{
      type:Sequelize.DataTypes.STRING(20),
      allowNull:false,
      defaultValue:"PENDENTE"
    })
  }
};
