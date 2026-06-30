'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('unidades','entidade',{
      type:Sequelize.DataTypes.STRING,
      allowNull:true,
    })
    await queryInterface.bulkUpdate('unidades',
      {entidade:'SENAI'},
      {entidade:null}
    );
    await queryInterface.changeColumn('unidades','entidade',{
      type:Sequelize.DataTypes.STRING,
      allowNull:false
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropColumn('unidades','entidade');
  }
};
