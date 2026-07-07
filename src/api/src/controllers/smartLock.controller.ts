import { raw, Request, Response } from "express";
import smartLockService from "../services/smartLock.service";

class SmartLockController {
    async setStatus(req: Request, res: Response) {
    let body = req.body;
    if (!body.mac || !body.status) {
      console.log("[LogSmartLock Controller] MAC ou status indefinidos");
      console.log(`MAC: ${body.mac}`);
      console.log(`Online?: ${body.status}`);
      return res
        .status(400)
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
        return res.status(400).json({message:"Faltam dados obrigatórios"})
    }
    try{
        console.log(body)
        let smartlock_id = await smartLockService.create(body.mac_address,body.apelido,body.unidade_id, body.has_equipamentos)

        res.status(201).json({codigo:smartlock_id})

    }catch(e:any){
        switch (e.message){
        case 'ERR_UNIDADE_NOT_FOUND':
            res.status(404).json({message:"Smartlock não foi encontrado"})
            break;
        default:
            console.log(e)
            res.status(500).json({message:"Erro não tratado do servidor"})
            break;
      }
    }
  }

  async listAll(req:Request,res:Response){
    try{
      let smartlocks = await smartLockService.listAll()
      res.status(200).json(smartlocks)
    }catch(e){
      res.status(500).json({message:"Erro interno do Servidor"})
    }
  }

  async getById(req:Request,res:Response){
    let rawId = req.params.id
    if(!rawId || typeof rawId != 'string'){
      return res.status(400).json({message:"Dados faltando ou no formato inválido"})
    }
    let smartlock_id = Number(rawId)
    if (isNaN(smartlock_id)){
      return res.status(400).json({message:"ID no formato inválido"})
    }
    try{
      let smartlock = await smartLockService.getById(smartlock_id)
      res.status(200).json(smartlock)
    }catch(e){
      return res.status(500).json({message:"Erro interno do servidor"})
    }
  }

  async update(req:Request,res:Response){
    console.log(req.body)
    let {id,apelido,mac_address,unidade_id,has_equipamentos} = req.body
    if(!id || !apelido || !mac_address || !unidade_id || has_equipamentos == undefined){
      return res.status(400).json({message:"Dados faltando"})
    }
    try{
      let smartlock = await smartLockService.update(id,apelido,mac_address,unidade_id,has_equipamentos)
      res.status(200).json({message:"Alterado"})
    }catch(e:any){

      if(e.message == 'ERR_HAS_EQUIPAMENTOS'){
        return res.status(400).json({message:"O Smartlock possui equipamentos vinculados, redirecione-os a outro smartlock"})
      }
      return
    }
  }

  async delete(req:Request,res:Response){
    let raw_id = req.params.id
    if(!raw_id || typeof raw_id != 'string'){
      return res.status(400).json({message:"ID não está disponível ou em formato incorreto"})
    }
    let smartlock_id = Number(raw_id)
    if(isNaN(smartlock_id)){
      return res.status(400).json({message:"ID não é numérico"})
    }
    try{
      await smartLockService.deactivate(smartlock_id)
      return res.status(200).json({message:"Smartlock desativado"})
    }catch(e:any){
      if(e.message == "ERR_EQUIPAMENTOS_VINCULADOS"){
        return res.status(400).json({message:"Smartlock ainda possui equipamentos vinculados"})
      }
      res.status(500).json({message:"Erro interno do Servidor"})
    }
  }

  async listByUnidade(req:Request,res:Response){
    let rawId = req.params.unidade_id
    if(!rawId || typeof rawId != 'string'){
      return res.status(400).json({message:"Dados faltando para a consulta"})
    }
    let unidade_id = Number(rawId)
    if(isNaN(unidade_id)){
      return res.status(400).json({message:"O código da unidade não é numérico"})
    }
    try{
      let smartlocks = await smartLockService.listByUnidade(unidade_id)
      return res.status(200).json(smartlocks)
    }catch(e){
      return res.status(500).json({message:"Erro interno do Servidor"})
    }
  }

}

export default new SmartLockController()