'use strict';

/**
 * Migra equipamentos.tipo (texto) para equipamentos.tipo_id (FK -> tipos_equipamento.id),
 * popula tipos_equipamento com os tipos atuais e torna equipamentos.patrimonio anulável
 * para suportar tipos com has_patrimonio = false.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'equipamentos',
        'tipo_id',
        {
          type: Sequelize.DataTypes.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        INSERT INTO tipos_equipamento (nome, descricao, has_patrimonio, has_credencial, icone)
        VALUES
          ('Notebook', 'Notebook', true, true, 'laptop_chromebook'),
          ('Óculos de Realidade Virtual', 'Óculos de Realidade Virtual', true, false, 'head_mounted_device'),
          ('Kit Educacional', 'Kit Educacional', true, false, 'smart_toy'),
          ('Tablet', 'Tablet', true, true, 'tablet')
        ON CONFLICT (nome) DO NOTHING;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        INSERT INTO tipos_equipamento (nome, descricao, has_patrimonio, has_credencial, icone)
        SELECT DISTINCT LEFT(TRIM(e.tipo), 30), LEFT(TRIM(e.tipo), 100), true, false, NULL
        FROM equipamentos e
        WHERE e.tipo IS NOT NULL AND TRIM(e.tipo) <> ''
        ON CONFLICT (nome) DO NOTHING;
        `,
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE equipamentos
        SET tipo_id = te.id
        FROM tipos_equipamento te
        WHERE LEFT(TRIM(equipamentos.tipo), 30) = te.nome;
        `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'equipamentos',
        'tipo_id',
        {
          type: Sequelize.DataTypes.BIGINT,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.addConstraint('equipamentos', {
        fields: ['tipo_id'],
        type: 'foreign key',
        name: 'fk_tipo_equipamento',
        references: {
          table: 'tipos_equipamento',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        transaction,
      });

      await queryInterface.changeColumn(
        'equipamentos',
        'patrimonio',
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.removeColumn('equipamentos', 'tipo', { transaction });

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn(
        'equipamentos',
        'tipo',
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
        UPDATE equipamentos
        SET tipo = te.nome
        FROM tipos_equipamento te
        WHERE equipamentos.tipo_id = te.id;
        `,
        { transaction },
      );

      await queryInterface.changeColumn(
        'equipamentos',
        'tipo',
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await queryInterface.removeConstraint('equipamentos', 'fk_tipo_equipamento', {
        transaction,
      });

      await queryInterface.removeColumn('equipamentos', 'tipo_id', { transaction });

      await queryInterface.changeColumn(
        'equipamentos',
        'patrimonio',
        {
          type: Sequelize.DataTypes.STRING,
          allowNull: false,
        },
        { transaction },
      );

      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  },
};
