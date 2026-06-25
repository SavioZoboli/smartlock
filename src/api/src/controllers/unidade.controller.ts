import { Request, Response } from "express";
import unidadeService from "../services/unidade.service";

class UnidadeController{

    async create(req:Request,res:Response){
        const b = req.body;
        if(!b.nome||!b.regional){
            return res.status(401).json({message:"Faltam dados obrigatórios"})
        }

        try{
            let unidade_id = await unidadeService.create(b.nome,b.regional)
            return res.status(201).json({codigo:unidade_id})
        }catch(e){
            console.log(e)
            return res.status(500).json({message:"Erro interno do servidor"})
        }
    }

}

export default new UnidadeController()