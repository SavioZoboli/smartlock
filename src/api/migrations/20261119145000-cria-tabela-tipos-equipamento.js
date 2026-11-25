'use strict';

/**
 * Cria a tabela tipos_equipamento com as constraints definidas no MER:
 *   pk_tipo_equipamento, uq_nome
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'tipos_equipamento',
        {
          id: {
            type: Sequelize.DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
          },
          nome: {
            type: Sequelize.DataTypes.STRING(30),
            allowNull: false,
          },
          descricao: {
            type: Sequelize.DataTypes.STRING(100),
            allowNull: true,
          },
          has_patrimonio: {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
          },
          has_credencial: {
            type: Sequelize.DataTypes.BOOLEAN,
            allowNull: false,
          },
          icone: {
            type: Sequelize.DataTypes.STRING(20),
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('tipos_equipamento', {
        fields: ['id'],
        type: 'primary key',
        name: 'pk_tipo_equipamento',
        transaction,
      });

      await queryInterface.addConstraint('tipos_equipamento', {
        fields: ['nome'],
        type: 'unique',
        name: 'uq_nome',
        transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tipos_equipamento');
  },
};
