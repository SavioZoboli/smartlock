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
      const patrimonios = equipamentos.map((e) => e.patrimonio);
      const existentes = await Equipamento.findAll({
        where: { patrimonio: { [Op.in]: patrimonios } },
        attributes: ["patrimonio"],
        raw: true,
      });

      if (existentes.length > 0) {
        const erro: any = new Error("ERR_DUPLICATE");
        erro.duplicados = existentes.map((e: any) => e.patrimonio);
        throw erro;
      }

      let created = await Equipamento.bulkCreate(equipamentos);
      return created.length;
    } catch (e: any) {
      if (e.name === "SequelizeUniqueConstraintError") {
        e.duplicados = e.errors?.map((err: any) => err.value) ?? [];
        e.message = "ERR_DUPLICATE";
      }
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
          "apelido",
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
          "apelido",
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
    apelido: string,
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
      equipamento.apelido = apelido;
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
      const equipamentos = await Equipamento.findAll({
        where: {
          usuario_atual_id: usuario_id,
          ativo: true,
        },
        attributes: {
          include: [
            [
              Sequelize.literal(`(
            SELECT m."timestamp"
            FROM movimentacoes m
            INNER JOIN "itensMovimentacao" im ON im.movimentacao_id = m.id
            WHERE im.equipamento_id = "Equipamento"."id"
              AND m.usuario_id = :usuario_id
            ORDER BY m."timestamp" DESC
            LIMIT 1
          )`),
              "data_movimentacao",
            ],
          ],
        },
        include: [
          {
            model: SmartLock,
            as: "smartlockBase",
            attributes: ["id", "apelido"],
            include: [
              {
                model: Unidade,
                as: "unidade",
                attributes: ["nome", "regional"],
              },
            ],
          },
        ],
        replacements: { usuario_id },
        order: [["patrimonio", "ASC"]],
      });

      return equipamentos.map((e: any) => ({
        id: e.id,
        apelido: e.apelido,
        patrimonio: e.patrimonio,
        tipo: e.tipo,
        smartlock: e.smartlockBase.apelido,
        unidade: e.smartlockBase.unidade.nome,
        data_movimentacao: e.get("data_movimentacao"),
      }));
    } catch (e) {
      throw e;
    }
  }

  async getRelatorioDisponibilidade(smartlock_id: number) {
    try {
      let relatorio = await Equipamento.findAll({
        attributes: [
          "id",
          "apelido",
          "tipo",
          "patrimonio",
          [Sequelize.col("usuarioAtual.nome"), "responsavel"],
        ],
        include: [
          {
            model: Usuario,
            as: "usuarioAtual",
            attributes: [],
            required: false,
          },
        ],
        where: { ativo: true, smartlock_base_id: smartlock_id },
        order: [
          ["apelido", "asc"],
          ["patrimonio", "asc"],
        ],
        raw: true,
      });
      relatorio = relatorio.map((l: any) => {
        return { ...l, disponivel: l.responsavel == null };
      });
      return relatorio;
    } catch (e) {
      throw e;
    }
  }
}

export default new EquipamentoService();
