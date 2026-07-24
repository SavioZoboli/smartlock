'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('reservas','smartlock_id',{
      type:Sequelize.DataTypes.INTEGER,
      allowNull:false,
      references:{
        model:'smartlocks',
        key:'id'
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropColumn('reservas','smartlock_id')
  }
};
