import { Request, Response } from "express";
import reservaService from "../services/reserva.service";

class ReservaController{

    async create(req:Request,res:Response){

        if(!req.user){
            return res.status(401).json({message:"Não autenticado"})
        }

        let {smartlock_id,dt_reserva,dt_devolucao,equipamentos} = req.body
        const usuario_id = req.user.id

        if(!smartlock_id||!dt_reserva||!dt_devolucao||!equipamentos){
            return res.status(400).json({message:"Dados obrigatórios faltando"})
        }
        if(equipamentos.length==0){
            return res.status(400).json({message:"É necessário pelo menos um equipamento selecionado"})
        }

        dt_reserva = new Date(dt_reserva)
        dt_devolucao = new Date(dt_devolucao)
        let agora = new Date()

        if(dt_reserva>dt_devolucao){
            return res.status(400).json({message:"Data da reserva não pode ser superior à data de devolução"})
        }

        if(dt_reserva < agora || dt_devolucao < agora){
            return res.status(400).json({message:"A reserva precisa ser para um momento futuro"})
        }

        try{
            let reserva = await reservaService.create(usuario_id,smartlock_id,dt_reserva,dt_devolucao,equipamentos)
            return res.status(201).json(reserva)
        }catch(e){
            console.log(e)
            return res.status(500).json({message:"Erro interno do servidor"})
        }

    }

    async reservasDoUsuario(req:Request,res:Response){
        if(!req.user){
            return res.status(401).json({message:"Não autenticado"})
        }
        try{
            let relatorio = await reservaService.listDoUsario(req.user.id)
            return res.status(200).json(relatorio)
        }catch(e){
            console.log(e)
            return res.status(500).json({message:"Erro interno do servidor"})
        }
    }

}

export default new ReservaController();