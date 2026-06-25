import { Request, Response } from "express";
import smartLockService from "../services/smartLock.service";

class SmartLockController {
    async setStatus(req: Request, res: Response) {
    let body = req.body;
    if (!body.mac || !body.status) {
      console.log("[LogSmartLock Controller] MAC ou status indefinidos");
      console.log(`MAC: ${body.mac}`);
      console.log(`Online?: ${body.status}`);
      return res
        .status(401)
        .json({ message: "Status ou Mac inválidos, impossível adicionar" });
    }

    try {

      let response = await smartLockService.setStatus(body.mac,body.status);

      res.status(response.code).json({ message: response.message });
    } catch (e:any) {
      switch (e.message){
        case 'ERR_SMARTLOCK_NOT_FOUND':
            res.status(404).json({message:"Smartlock não foi encontrado"})
            break;
        default:
            res.status(500).json({message:"Erro não tratado do servidor"})
            break;
      }
      console.error(e);
    }
  }


  async create(req:Request,res:Response){
    let body = req.body;
    if(!body.mac_address || !body.apelido || !body.unidade_id || !body.has_equipamentos){
        return res.status(401).json({message:"Faltam dados obrigatórios"})
    }
    try{

        let smartlock_id = await smartLockService.create(body.mac_address,body.apelido,body.unidade_id, body.has_equipamentos)

        res.status(201).json({codigo:smartlock_id})

    }catch(e:any){
        switch (e.message){
        case 'ERR_UNIDADE_NOT_FOUND':
            res.status(404).json({message:"Smartlock não foi encontrado"})
            break;
        default:
            res.status(500).json({message:"Erro não tratado do servidor"})
            break;
      }
    }
  }

}

export default new SmartLockController()