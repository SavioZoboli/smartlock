"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. (Garantia) Tenta remover a constraint antiga caso ainda exista
    try {
      await queryInterface.removeConstraint(
        "smartlocks",
        "smartlocks_unidade_id_fkey",
      );
    } catch (error) {
      console.log("Constraint não encontrada, seguindo em frente...");
    }

    // 2. Altera a coluna SEM o bloco 'references'.
    // Assim o Sequelize foca apenas em mudar o tipo e o allowNull.
    await queryInterface.changeColumn("smartlocks", "unidade_id", {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: true,
    });

    // 3. Adiciona a constraint de chave estrangeira separadamente
    await queryInterface.addConstraint("smartlocks", {
      fields: ["unidade_id"],
      type: "foreign key",
      name: "smartlocks_unidade_id_fkey", // Nome explícito para não perdermos o controle
      references: {
        table: "unidades", // Nome exato da tabela no banco
        field: "id",
      },
      onDelete: "SET NULL", // Se a unidade for deletada, o smartlock fica órfão (null)
      onUpdate: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    // Para reverter:
    // 1. Remove a constraint
    await queryInterface.removeConstraint(
      "smartlocks",
      "smartlocks_unidade_id_fkey",
    );

    // 2. Volta a proibir nulo
    await queryInterface.changeColumn("smartlocks", "unidade_id", {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false,
    });

    // 3. Adiciona a constraint de volta
    await queryInterface.addConstraint("smartlocks", {
      fields: ["unidade_id"],
      type: "foreign key",
      name: "smartlocks_unidade_id_fkey",
      references: {
        table: "unidades",
        field: "id",
      },
      onDelete: "NO ACTION",
      onUpdate: "CASCADE",
    });
  },
};
