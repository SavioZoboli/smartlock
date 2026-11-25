'use strict';

/**
 * Cria a tabela log_acess_eqp_cred: auditoria de cada revelação de senha
 * de credencial de equipamento (quem viu, qual equipamento, quando).
 *
 * As constraints são criadas com os nomes definidos no MER:
 *   pk_log_cred, fk_log_eqp_eqp_cred, log_eqp_cred_usuario
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'log_acess_eqp_cred',
        {
          id: {
            type: Sequelize.DataTypes.BIGINT,
            autoIncrement: true,
            allowNull: false,
          },
          equipamento_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false,
          },
          usuario_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false,
          },
          // DATE no dialeto postgres = "TIMESTAMP WITH TIME ZONE" (timestamptz)
          timestamp: {
            type: Sequelize.DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('log_acess_eqp_cred', {
        fields: ['id'],
        type: 'primary key',
        name: 'pk_log_cred',
        transaction,
      });

      // Logs de auditoria não devem sumir em cascata: RESTRICT impede apagar
      // fisicamente um equipamento/usuário que já teve credencial acessada.
      await queryInterface.addConstraint('log_acess_eqp_cred', {
        fields: ['equipamento_id'],
        type: 'foreign key',
        name: 'fk_log_eqp_eqp_cred',
        references: { table: 'equipamentos', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        transaction,
      });

      await queryInterface.addConstraint('log_acess_eqp_cred', {
        fields: ['usuario_id'],
        type: 'foreign key',
        name: 'log_eqp_cred_usuario',
        references: { table: 'usuarios', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('log_acess_eqp_cred');
  },
};

