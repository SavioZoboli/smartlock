'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios','role',{
      type:Sequelize.DataTypes.STRING,
      allowNull:true,
      default:"USER"
    })
    await queryInterface.bulkUpdate('usuarios',
      {role:'USER'},
      {role:null}
    )
    await queryInterface.changeColumn('usuarios','role',{
      type:Sequelize.DataTypes.STRING,
      allowNull:false,
      default:"USER"
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropColumn('usuarios','role')
  }
};
