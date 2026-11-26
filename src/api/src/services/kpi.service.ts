import { Op } from "sequelize";
import Equipamento from "../models/equipamento.model";
import Movimentacao from "../models/movimentacao.model";

class KpiService{
    async countEquipamentosComigo(usuario_id:number){
        try{
            let contagem = await Equipamento.count({where:{usuario_atual_id:usuario_id}});
            return contagem;
        }catch(e){
            throw e
        }
    }

    async countEmprestimosUltimoMes(usuario_id:number){
        try{
            const hoje = new Date();
            const trintaDiasAtras = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
            let contagem = await Movimentacao.count({
                where:{
                    usuario_id,
                    tipo_movimento: { [Op.like]: "emprestimo%" },
                    timestamp:{[Op.between]:[trintaDiasAtras,hoje]}
                }
            })
            return contagem;
        }catch(e){
            throw e;
        }
    }
}

export default new KpiService();