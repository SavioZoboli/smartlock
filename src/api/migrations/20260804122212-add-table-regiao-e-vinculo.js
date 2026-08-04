'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('regioes',{
      id:{
        type:Sequelize.DataTypes.INTEGER,
        allowNull:false,
        primaryKey:true,
        autoIncrement:true,
      },
      nome:{
        type:Sequelize.DataTypes.STRING(45),
        allowNull:false
      }
    })

    await queryInterface.addColumn('unidades','regiao_id',{
      type:Sequelize.DataTypes.INTEGER,
      allowNull:true,
      references:{
        model:'regioes',
        key:'id'
      }
    })
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('unidades','regiao_id')
    await queryInterface.dropTable('regioes')
  }
};
