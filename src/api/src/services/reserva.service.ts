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

  async getById(id: number) {
    let reserva = await Reserva.findOne({
      where: { id },
      attributes: [
        "id",
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
  ) {
    let transaction = await sequelize.transaction();
    try {
      let reserva = await Reserva.findByPk(reserva_id, { transaction });
      if (!reserva) {
        throw new Error("ERR_RESERVA_NOT_FOUND");
      }
      reserva.reserva_inicio = dt_inicio;
      reserva.reserva_fim = dt_fim;
      reserva.motivo = motivo;

      let antiga_reserva = await ItensReserva.findAll({
        where: {
          reserva_id: reserva.id,
        },
        transaction,
      });
      for (let eqp of antiga_reserva) {
        let indexEquipamento = equipamentos.indexOf(eqp.equipamento_id);
        if (indexEquipamento != -1) {
          // Já está cadastrado, ignora
          equipamentos.splice(indexEquipamento, 1);
        } else {
          //Não achou na lista atualizada, remove o vínculo
          await eqp.destroy({ transaction });
        }
      }
      if (equipamentos.length > 0) {
        //Passou por todos os que já estão cadastrados e ainda tem equipamentos na lista
        //cria o vínculo
        let creation_equipamentos = equipamentos.map((e) => {
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

  async delete(reserva_id:number):Promise<void>{
    let transaction = await sequelize.transaction()
    try{
      let itens = await ItensReserva.findAll({where:{reserva_id},transaction})
      for(let item of itens){
        await item.destroy({transaction})
      }
      let reserva = await Reserva.findByPk(reserva_id)
      if(!reserva){
        throw new Error("ERR_RESERVA_NOT_FOUND")
      }
      reserva.destroy()
      await transaction.commit()
    }catch(e){
      await transaction.rollback()
      throw e
    }
  }
}

export default new ReservaService();
