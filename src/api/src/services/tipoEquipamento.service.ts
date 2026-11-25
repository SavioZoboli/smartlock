import { ForeignKeyConstraintError, Op, Sequelize, UniqueConstraintError } from "sequelize";
import { Equipamento, TipoEquipamento } from "../models/index.model";
import {
  TipoEquipamentoAttributes,
  TipoEquipamentoCreationAttributes,
} from "../models/tipoEquipamento.model";

class TipoEquipamentoService {
  async listAll(): Promise<TipoEquipamento[]> {
    return TipoEquipamento.findAll({
      attributes: {
        include: [
          [
            Sequelize.literal(
              `(SELECT COUNT(*)::int FROM equipamentos e WHERE e.tipo_id = "TipoEquipamento"."id")`,
            ),
            "qtd_equipamentos",
          ],
        ],
      },
      order: [["nome", "ASC"]],
    });
  }

  async getById(id: number): Promise<TipoEquipamento> {
    const tipo = await TipoEquipamento.findByPk(id);
    if (!tipo) {
      throw new Error("ERR_NOT_FOUND");
    }
    return tipo;
  }

  async create(dados: TipoEquipamentoCreationAttributes): Promise<TipoEquipamento> {
    const existente = await TipoEquipamento.findOne({
      where: { nome: dados.nome },
      attributes: ["id"],
    });
    if (existente) {
      throw new Error("ERR_DUPLICATE");
    }

    try {
      return await TipoEquipamento.create(dados);
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        throw new Error("ERR_DUPLICATE");
      }
      throw e;
    }
  }

  async update(
    id: number,
    dados: Omit<TipoEquipamentoAttributes, "id">,
  ): Promise<TipoEquipamento> {
    const tipo = await TipoEquipamento.findByPk(id);
    if (!tipo) {
      throw new Error("ERR_NOT_FOUND");
    }

    const duplicado = await TipoEquipamento.findOne({
      where: {
        nome: dados.nome,
        id: { [Op.ne]: id },
      },
      attributes: ["id"],
    });
    if (duplicado) {
      throw new Error("ERR_DUPLICATE");
    }

    tipo.nome = dados.nome;
    tipo.descricao = dados.descricao ?? null;
    tipo.has_patrimonio = dados.has_patrimonio;
    tipo.has_credencial = dados.has_credencial;
    tipo.icone = dados.icone ?? null;

    try {
      await tipo.save();
      return tipo;
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        throw new Error("ERR_DUPLICATE");
      }
      throw e;
    }
  }

  async delete(id: number): Promise<void> {
    const tipo = await TipoEquipamento.findByPk(id);
    if (!tipo) {
      throw new Error("ERR_NOT_FOUND");
    }

    const qtdVinculados = await Equipamento.count({
      where: { tipo_id: id },
    });
    if (qtdVinculados > 0) {
      throw new Error("ERR_IN_USE");
    }

    try {
      await tipo.destroy();
    } catch (e) {
      if (e instanceof ForeignKeyConstraintError) {
        throw new Error("ERR_IN_USE");
      }
      throw e;
    }
  }
}

export default new TipoEquipamentoService();
