import { Request, Response } from "express";
import unidadeService from "../services/unidade.service";

class UnidadeController {
  async create(req: Request, res: Response) {
    const b = req.body;
    if (!b.nome || !b.regional || !b.entidade) {
      return res.status(401).json({ message: "Faltam dados obrigatórios" });
    }

    try {
      let unidade_id = await unidadeService.create(
        b.nome,
        b.regional,
        b.entidade,
      );
      return res.status(201).json({ codigo: unidade_id });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async listAll(req: Request, res: Response) {
    try {
      let unidades = await unidadeService.listAll();
      res.status(200).json(unidades);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Não foi possível consultar." });
    }
  }

  async getById(req: Request, res: Response) {
    let raw_id = req.params.id;
    if (!raw_id || typeof raw_id != "string") {
      return res
        .status(400)
        .json({ message: "Faltam dados para executar a consulta." });
    }
    let unidade_id = parseInt(raw_id, 10);
    if (isNaN(unidade_id)) {
      return res.status(400).json({ message: "O ID deve ser numérico." });
    }
    try {
      let unidade = await unidadeService.getById(unidade_id);
      return res.status(200).json(unidade);
    } catch (e: any) {
      if (e.message == "UNIDADE_NOT_FOUND") {
        return res.status(404).json({ message: "Unidade não encontrada" });
      }
      return res.status(500).json({ message: "Erro interno do servidor." });
    }
  }

  async update(req:Request,res:Response){
    let b = req.body;
    if(!b.id || !b.nome || !b.regional || !b.entidade){
        return res.status(400).json({"message":"Dados inválidos"})
    }
    try{
        let unidade = await unidadeService.update(b.id,b.nome,b.regional,b.entidade)
        res.status(200).json({message:"Alterado"})
    }catch(e:any){
        if(e.message == "UNIDADE_NOT_FOUND"){
            return res.status(404).json({message:"Unidade não encontrada"})
        }
        return res.status(500).json({message:"Erro interno do servidor"})
    }
  }

  async delete(req:Request,res:Response){
    let raw_id = req.params.id;
    if (!raw_id || typeof raw_id != "string") {
      return res
        .status(400)
        .json({ message: "Faltam dados para executar a exclusão" });
    }
    let unidade_id = parseInt(raw_id, 10);
    if (isNaN(unidade_id)) {
      return res.status(400).json({ message: "O ID deve ser numérico." });
    }
    try{
        await unidadeService.delete(unidade_id)
        res.status(200).json({message:"Excluído"})
    }catch(e:any){
        if(e.message == "UNIDADE_NOT_FOUND"){
            return res.status(404).json({message:"Unidade não encontrada"})
        }
        return res.status(500).json({message:"Erro interno do servidor"})
    }
  }

}

export default new UnidadeController();
