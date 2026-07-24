import { Sequelize } from "sequelize";
import sequelize from "../config/database";
import {
  Equipamento,
  ItensReserva,
  Reserva,
  SmartLock,
  Unidade,
  Usuario,
} from "../models/index.model";

class ReservaService {
  async create(
    usuario_id: number,
    smartlock_id: number,
    dt_reserva: Date,
    dt_devolucao: Date,
    equipamentos: number[],
  ) {
    let transaction = await sequelize.transaction();
    try {
      let reserva = await Reserva.create(
        {
          usuario_id,
          reserva_inicio: dt_reserva,
          reserva_fim: dt_devolucao,
          situacao: "PENDENTE",
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

  async listDoUsario(usuario_id: number) {
    try {
      let reservas = await Reserva.findAll({
        attributes: [
          "id",
          "reserva_inicio",
          "reserva_fim",
          "situacao",
          "motivo",
          [Sequelize.col("usuario.nome"), "responsavel"],
          [Sequelize.col("smartlock_origem.apelido"), "smartlock"],
          [Sequelize.col("smartlock_origem.unidade.nome"), "unidade"],
          [Sequelize.col("smartlock_origem.unidade.regional"), "regional"],
        ],
        include: [
          { model: Usuario, as: "usuario", attributes: [] },
          {
            model: SmartLock,
            as: "smartlock_origem",
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
}

export default new ReservaService();
