import { Request, Response } from "express";
import regiaoService from "../services/regiao.service";

class RegiaoController{

    async listAll(req:Request,res:Response){
        try{
            let regionais = await regiaoService.listAll()
            return res.status(200).json(regionais)
        }catch(e){
            return res.status(500).json({message:"Erro interno do Servidor"})
        }
    }

}

export default new RegiaoController();