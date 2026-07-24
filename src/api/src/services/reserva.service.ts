import sequelize from "../config/database"
import {ItensReserva, Reserva} from "../models/index.model"

class ReservaService{

    async create(usuario_id:number,smartlock_id:number,dt_reserva:Date,dt_devolucao:Date,equipamentos:number[]){
        let transaction = await sequelize.transaction()
        try{
            let reserva = await Reserva.create({
                usuario_id,
                reserva_inicio:dt_reserva,
                reserva_fim:dt_devolucao,
                situacao:"PENDENTE",
                smartlock_id
            },{transaction})
            let eqp_criacao:{equipamento_id:number,reserva_id:number}[] = equipamentos.map(e=>{
                return {equipamento_id:e,reserva_id:reserva.id}
            })
            await ItensReserva.bulkCreate(eqp_criacao,{transaction})
            await transaction.commit()
            return reserva;
        }catch(e){
            await transaction.rollback()
            throw e
        }

    }

}

export default new ReservaService()