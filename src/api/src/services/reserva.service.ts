import { Op, Sequelize, Transaction } from "sequelize";
import sequelize from "../config/database";
import {
  Equipamento,
  ItensReserva,
  Regiao,
  Reserva,
  SmartLock,
  TipoEquipamento,
  Unidade,
  Usuario,
} from "../models/index.model";

const TOLERANCIA_RESERVA_MS = 30 * 60 * 1000; // 30 min (mesma regra da listagem)

class ReservaService {
  private async validarConflitosReserva(
    equipamentoIds: number[],
    inicio: Date,
    fim: Date,
    transaction: Transaction,
    ignorarReservaId?: number,
  ): Promise<void> {
    const idsUnicos = Array.from(new Set(equipamentoIds));
    if (idsUnicos.length === 0) return;

    // Lock pessimista nos equipamentos alvo para evitar double-booking concorrente
    await Equipamento.findAll({
      where: { id: { [Op.in]: idsUnicos } },
      attributes: ["id"],
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    const inicioComTolerancia = new Date(inicio.getTime() - TOLERANCIA_RESERVA_MS);
    const fimComTolerancia = new Date(fim.getTime() + TOLERANCIA_RESERVA_MS);

    const whereReserva: any = {
      situacao: { [Op.notIn]: ["CANCELADA", "FINALIZADA", "FINALIZADO"] },
      reserva_inicio: { [Op.lte]: fimComTolerancia },
      reserva_fim: { [Op.gte]: inicioComTolerancia },
    };
    if (ignorarReservaId) {
      whereReserva.id = { [Op.ne]: ignorarReservaId };
    }

    const conflitos = await Reserva.findAll({
      where: whereReserva,
      attributes: ["id"],
      include: [
        {
          model: Equipamento,
          as: "equipamentos",
          attributes: ["id"],
          through: { attributes: [] },
          where: { id: { [Op.in]: idsUnicos } },
          required: true,
        },
      ],
      transaction,
    });

    if (conflitos.length > 0) {
      throw new Error("ERR_EQUIPAMENTO_RESERVADO");
    }
  }

  async create(
    usuario_id: number,
    smartlock_id: number,
    dt_reserva: Date,
    dt_devolucao: Date,
    equipamentos: number[],
  ) {
    let transaction = await sequelize.transaction();
    try {
      await this.validarConflitosReserva(
        equipamentos,
        dt_reserva,
        dt_devolucao,
        transaction,
      );

      let reserva = await Reserva.create(
        {
          usuario_id,
          reserva_inicio: dt_reserva,
          reserva_fim: dt_devolucao,
          smartlock_id,
        },
        { transaction },
      );
      let eqp_criacao: { equipamento_id: number; reserva_id: number }[] =
        equipamentos.map((e) => {
          return { equipamento_id: e, reserva_id: reserva.id };
        });
      await ItensReserva.bulkCreate(eqp_criacao, { transaction });
      await transaction.commit();
      return reserva;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  private async atualizarReservasAtrasadas(): Promise<void> {
    await Reserva.update(
      { situacao: "ATRASADO" },
      {
        where: {
          situacao: { [Op.in]: ["AGENDADO", "PENDENTE"] },
          reserva_fim: { [Op.lt]: new Date() },
        },
      },
    );
  }

  async listDoUsario(usuario_id: number) {
    try {
      await this.atualizarReservasAtrasadas();
      let reservas = await Reserva.findAll({
        attributes: [
          "id",
          "reserva_inicio",
          "reserva_fim",
          "situacao",
          "motivo",
          [Sequelize.col("usuario.nome"), "responsavel"],
          [Sequelize.col("smartlock_origem.apelido"), "smartlock"],
          [Sequelize.col("smartlock_origem->unidade.nome"), "unidade"],
          [Sequelize.col("smartlock_origem->unidade->regional.nome"), "regional"],
        ],
        include: [
          {
            model: Usuario,
            as: "usuario",
            required: true,
            attributes: [],
            where: { id: usuario_id },
          },
          {
            model: SmartLock,
            as: "smartlock_origem",
            attributes: [],
            include: [
              {
                model: Unidade,
                as: "unidade",
                attributes: [],
                include: [
                  {
                    model: Regiao,
                    as: "regional",
                    attributes: [],
                  },
                ],
              },
            ],
          },
          {
            model: Equipamento,
            as: "equipamentos",
            through: { attributes: [] },
            attributes: ["id", "apelido", "patrimonio"],
          },
        ],
      });
      return reservas;
    } catch (e) {
      throw e;
    }
  }

  async relatorioReservas(filtros: {
    unidade_id?: number;
    smartlock_id?: number;
    usuario_id?: number;
    inicio?: Date;
    fim?: Date;
  }) {
    const { unidade_id, smartlock_id, usuario_id, inicio, fim } = filtros;

    if (!unidade_id && !usuario_id) {
      throw new Error("ERR_FILTRO_OBRIGATORIO");
    }

    await this.atualizarReservasAtrasadas();

    const whereReserva: any = {};
    if (usuario_id) {
      whereReserva.usuario_id = usuario_id;
    }
    if (smartlock_id) {
      whereReserva.smartlock_id = smartlock_id;
    }
    if (inicio && fim) {
      whereReserva[Op.and] = [
        { reserva_inicio: { [Op.lte]: fim } },
        {
          [Op.or]: [
            { reserva_fim: { [Op.gte]: inicio } },
            { reserva_fim: null },
          ],
        },
      ];
    } else if (inicio) {
      whereReserva[Op.or] = [
        { reserva_fim: { [Op.gte]: inicio } },
        { reserva_fim: null },
      ];
    } else if (fim) {
      whereReserva.reserva_inicio = { [Op.lte]: fim };
    }

    const whereSmartlock: any = {};
    if (unidade_id) {
      whereSmartlock.unidade_id = unidade_id;
    }
    if (smartlock_id) {
      whereSmartlock.id = smartlock_id;
    }

    const temFiltroSmartlock = Object.keys(whereSmartlock).length > 0;

    try {
      const reservas = await Reserva.findAll({
        where: whereReserva,
        attributes: [
          "id",
          "reserva_inicio",
          "reserva_fim",
          "situacao",
          "motivo",
          "usuario_id",
          "smartlock_id",
          [Sequelize.col("usuario.nome"), "responsavel"],
          [Sequelize.col("usuario.email"), "usuario_email"],
          [Sequelize.col("usuario.avatar"), "usuario_avatar"],
          [Sequelize.col("smartlock_origem.apelido"), "smartlock"],
          [Sequelize.col("smartlock_origem.unidade_id"), "unidade_id"],
          [Sequelize.col("smartlock_origem->unidade.nome"), "unidade"],
          [Sequelize.col("smartlock_origem->unidade->regional.nome"), "regional"],
        ],
        include: [
          {
            model: Usuario,
            as: "usuario",
            required: !!usuario_id,
            attributes: [],
          },
          {
            model: SmartLock,
            as: "smartlock_origem",
            attributes: [],
            required: temFiltroSmartlock,
            where: temFiltroSmartlock ? whereSmartlock : undefined,
            include: [
              {
                model: Unidade,
                as: "unidade",
                attributes: [],
                required: false,
                include: [
                  {
                    model: Regiao,
                    as: "regional",
                    attributes: [],
                    required: false,
                  },
                ],
              },
            ],
          },
          {
            model: Equipamento,
            as: "equipamentos",
            through: { attributes: [] },
            attributes: ["id", "apelido", "patrimonio", "tipo_id"],
            include: [
              {
                model: TipoEquipamento,
                as: "tipoEquipamento",
                attributes: ["id", "nome", "icone"],
              },
            ],
          },
        ],
        order: [["reserva_inicio", "ASC"]],
      });
      return reservas;
    } catch (e) {
      throw e;
    }
  }

  async getById(id: number) {
    let reserva = await Reserva.findOne({
      where: { id },
      attributes: [
        "id",
        "usuario_id",
        ["reserva_inicio", "data_hora_emprestimo"],
        ["reserva_fim", "data_hora_devolucao_prevista"],
        "situacao",
        "motivo",
        "smartlock_id",
        [Sequelize.col("smartlock_origem.unidade_id"), "unidade_id"],
      ],
      include: [
        {
          model: SmartLock,
          as: "smartlock_origem",
          attributes: [],
        },
        {
          model: Equipamento,
          as: "equipamentos",
          through: { attributes: [] },
          attributes: ["id", "apelido", "patrimonio"],
        },
      ],
    });

    if (!reserva) {
      throw new Error("Reserva não encontrada");
    }

    return reserva;
  }

  async update(
    reserva_id: number,
    dt_inicio: Date,
    dt_fim: Date,
    equipamentos: number[],
    motivo: string,
    usuario_id: number,
    is_admin: boolean,
  ) {
    let transaction = await sequelize.transaction();
    try {
      let reserva = await Reserva.findByPk(reserva_id, { transaction });
      if (!reserva) {
        throw new Error("ERR_RESERVA_NOT_FOUND");
      }
      if (!is_admin && reserva.usuario_id !== usuario_id) {
        throw new Error("ERR_SEM_PERMISSAO_RESERVA");
      }

      const equipamentosParaSalvar = [...equipamentos];
      await this.validarConflitosReserva(
        equipamentosParaSalvar,
        dt_inicio,
        dt_fim,
        transaction,
        reserva.id,
      );

      reserva.reserva_inicio = dt_inicio;
      reserva.reserva_fim = dt_fim;
      reserva.motivo = motivo;
      await reserva.save({ transaction });

      let antiga_reserva = await ItensReserva.findAll({
        where: {
          reserva_id: reserva.id,
        },
        transaction,
      });
      for (let eqp of antiga_reserva) {
        let indexEquipamento = equipamentosParaSalvar.indexOf(eqp.equipamento_id);
        if (indexEquipamento != -1) {
          // Já está cadastrado, ignora
          equipamentosParaSalvar.splice(indexEquipamento, 1);
        } else {
          //Não achou na lista atualizada, remove o vínculo
          await eqp.destroy({ transaction });
        }
      }
      if (equipamentosParaSalvar.length > 0) {
        //Passou por todos os que já estão cadastrados e ainda tem equipamentos na lista
        //cria o vínculo
        let creation_equipamentos = equipamentosParaSalvar.map((e) => {
          return { reserva_id: reserva.id, equipamento_id: e };
        });
        await ItensReserva.bulkCreate(creation_equipamentos, { transaction });
      }
      await transaction.commit();
      return reserva;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async delete(reserva_id: number, usuario_id: number, is_admin: boolean): Promise<void> {
    let transaction = await sequelize.transaction();
    try {
      let reserva = await Reserva.findByPk(reserva_id, { transaction });
      if (!reserva) {
        throw new Error("ERR_RESERVA_NOT_FOUND");
      }
      if (!is_admin && reserva.usuario_id !== usuario_id) {
        throw new Error("ERR_SEM_PERMISSAO_RESERVA");
      }
      await ItensReserva.destroy({
        where: { reserva_id },
        transaction,
      });
      await reserva.destroy({ transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async getReservaVigenteSmartlock(
    usuario_id: number,
    smartlock_id: number,
    dataReferencia: Date = new Date(),
  ) {
    const margemMinutos = 30;
    const margemMs = margemMinutos * 60 * 1000;
    const inicioMin = new Date(dataReferencia.getTime() - margemMs);
    const fimMax = new Date(dataReferencia.getTime() + margemMs);

    const reservaUsuario = await Reserva.findOne({
      where: {
        usuario_id,
        smartlock_id,
        situacao: { [Op.in]: ["AGENDADO", "PENDENTE", "EM USO"] },
        reserva_inicio: { [Op.lte]: fimMax },
        reserva_fim: { [Op.gte]: inicioMin },
      },
      include: [
        {
          model: Equipamento,
          as: "equipamentos",
          through: { attributes: [] },
          attributes: ["id", "apelido", "patrimonio", "tipo_id", "status_atual"],
          include: [
            {
              model: TipoEquipamento,
              as: "tipoEquipamento",
              attributes: ["id", "nome", "icone"],
            },
          ],
        },
      ],
      order: [["reserva_inicio", "ASC"]],
    });

    const reservasOutros = await Reserva.findAll({
      where: {
        smartlock_id,
        usuario_id: { [Op.ne]: usuario_id },
        situacao: { [Op.in]: ["AGENDADO", "PENDENTE", "EM USO"] },
        reserva_inicio: { [Op.lte]: fimMax },
        reserva_fim: { [Op.gte]: inicioMin },
      },
      include: [
        {
          model: Equipamento,
          as: "equipamentos",
          through: { attributes: [] },
          attributes: ["id"],
        },
      ],
    });

    const equipamentosReservadosOutros: number[] = Array.from(
      new Set(
        reservasOutros.flatMap((r: any) =>
          r.equipamentos ? r.equipamentos.map((e: any) => e.id) : [],
        ),
      ),
    );

    return {
      reservaUsuario,
      equipamentosReservadosOutros,
    };
  }
}

export default new ReservaService();
