'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('unidades','regional',{
      type:Sequelize.DataTypes.STRING({length:60}),
      allowNull:false
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('unidades','regional',{
      type:Sequelize.DataTypes.STRING({length:24}),
      allowNull:false
    })
  }
};
