'use strict';

/**
 * Cria a tabela equipamento_credencial (1:1 com equipamentos).
 *
 * A coluna `senha` armazena o payload cifrado com AES-256-GCM
 * (formato "v1:<iv>:<authTag>:<ciphertext>" em base64), NUNCA texto puro.
 * Ver src/utils/crypto.utils.ts.
 *
 * As constraints são criadas com os nomes definidos no MER:
 *   pk_equipamento_credencial, fk_equip_equip_cred, uq_equipamento
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'equipamento_credencial',
        {
          id: {
            type: Sequelize.DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
          },
          equipamento_id: {
            type: Sequelize.DataTypes.INTEGER,
            allowNull: false,
          },
          login: {
            type: Sequelize.DataTypes.STRING(100),
            allowNull: false,
          },
          senha: {
            type: Sequelize.DataTypes.STRING(200),
            allowNull: true,
          },
        },
        { transaction },
      );

      await queryInterface.addConstraint('equipamento_credencial', {
        fields: ['id'],
        type: 'primary key',
        name: 'pk_equipamento_credencial',
        transaction,
      });

      await queryInterface.addConstraint('equipamento_credencial', {
        fields: ['equipamento_id'],
        type: 'foreign key',
        name: 'fk_equip_equip_cred',
        references: { table: 'equipamentos', field: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        transaction,
      });

      await queryInterface.addConstraint('equipamento_credencial', {
        fields: ['equipamento_id'],
        type: 'unique',
        name: 'uq_equipamento',
        transaction,
      });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('equipamento_credencial');
  },
};

