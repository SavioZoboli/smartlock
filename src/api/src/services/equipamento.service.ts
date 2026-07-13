import { Op, Sequelize } from "sequelize";
import { EquipamentoAttributes } from "../models/equipamento.model";
import {
  Equipamento,
  SmartLock,
  Unidade,
  Usuario,
} from "../models/index.model";

class EquipamentoService {
  async bulkCreate(equipamentos: EquipamentoAttributes[]): Promise<number> {
    try {
      let createdEquipamentos = await Equipamento.bulkCreate(equipamentos);
      return createdEquipamentos.length;
    } catch (e) {
      throw e;
    }
  }

  async listAll(): Promise<Equipamento[]> {
    try {
      let equipametos = await Equipamento.findAll({
        where: { ativo: true },
        attributes: [
          "id",
          "patrimonio",
          ["status_atual", "status"],
          "tipo",
          [Sequelize.col("smartlockBase.apelido"), "smartlock"],
          [Sequelize.col("smartlockBase.unidade.nome"), "unidade"],
          [Sequelize.col("usuarioAtual.nome"), "usuario"],
        ],
        include: [
          {
            model: SmartLock,
            as: "smartlockBase",
            attributes: [],
            include: [
              {
                model: Unidade,
                as: "unidade",
                attributes: [],
              },
            ],
          },
          {
            model: Usuario,
            as: "usuarioAtual",
            attributes: [],
          },
        ],
        raw: true,
      });
      return equipametos;
    } catch (e) {
      throw e;
    }
  }

  async getById(id: number): Promise<Equipamento> {
    try {
      let equipamento = await Equipamento.findByPk(id, {
        attributes: [
          "id",
          "patrimonio",
          "tag",
          "tipo",
          ["smartlock_base_id", "smartlock_id"],
        ],
      });
      if (!equipamento) {
        throw new Error("ERR_NOT_FOUND");
      }
      return equipamento;
    } catch (e) {
      throw e;
    }
  }

  async update(
    id: number,
    tag: string,
    patrimonio: string,
    tipo: string,
    smartlock_id: number,
  ): Promise<void> {
    try {
      let equipamento = await Equipamento.findByPk(id);
      if (!equipamento) {
        throw new Error("ERR_NOT_FOUND");
      }
      equipamento.tag = tag;
      equipamento.patrimonio = patrimonio;
      equipamento.tipo = tipo;
      equipamento.smartlock_base_id = smartlock_id;
      await equipamento.save();
      return;
    } catch (e) {
      throw e;
    }
  }

  async relocate(
    smartlock_destino_id: number,
    equipamentos: number[],
  ): Promise<number> {
    try {
      let smartlock_destino = await SmartLock.findByPk(smartlock_destino_id);
      if (!smartlock_destino) {
        throw new Error("SMARTLOCK_NOT_FOUND");
      }
      const [affected_rows] = await Equipamento.update(
        { smartlock_base_id: smartlock_destino.id },
        { where: { id: { [Op.in]: equipamentos } } },
      );
      return affected_rows;
    } catch (e) {
      throw e;
    }
  }

  async deactivate(id: number): Promise<number> {
    try {
      const [affected_rows] = await Equipamento.update(
        { ativo: false },
        { where: { id } },
      );
      return affected_rows;
    } catch (e) {
      throw e;
    }
  }

  async listBySmartlock(smartlock_id: number) {
    try {
      let equipamentos = await Equipamento.findAll({
        where: { smartlock_base_id: smartlock_id, ativo: true },
      });
      return equipamentos;
    } catch (e) {
      throw e;
    }
  }

  async getEmprestadosUsuario(usuario_id: number) {
    try {
      let equipamentos = await Equipamento.findAll({
        attributes: [
          "patrimonio",
          "tipo",
          [Sequelize.col("smartlockBase.apelido"), "smartlock"],
        ],
        where:{usuario_atual_id:usuario_id},
        include:[{
          model:SmartLock,
          as:'smartlockBase',
          attributes:[]
        }]
      });
      return equipamentos;
    } catch (e) {
      throw e;
    }
  }
}

export default new EquipamentoService();
