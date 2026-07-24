import { Request, Response } from "express";
import equipamentoService from "../services/equipamento.service";

class EquipamentoController {
  async listAll(req: Request, res: Response) {
    try {
      let equipamentos = await equipamentoService.listAll();
      return res.status(200).json(equipamentos);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async bulkCreate(req: Request, res: Response) {
    let { smartlock_id, equipamentos } = req.body;
    console.log(equipamentos)
    if (!smartlock_id || equipamentos.length == 0) {
      return res.status(400).json({ message: "Requisição com dados faltando" });
    }
    const equipamentosComSmartlock = equipamentos.map((eq: any) => ({
      ...eq,
      smartlock_base_id: smartlock_id,
      status_atual: "DISPONIVEL",
    }));
    try {
      let contagem = await equipamentoService.bulkCreate(
        equipamentosComSmartlock,
      );
      return res.status(201).json({ contagem });
    } catch (e: any) {
      if (e.message === "ERR_DUPLICATE") {
        return res.status(409).json({
          message: `${e.duplicados.length} patrimônio(s) já cadastrado(s): ${e.duplicados.join(", ")}`,
          duplicados: e.duplicados,
        });
      }
      return res.status(500).json({ message: "Erro interno do Servidor" });
    }
  }

  async getById(req: Request, res: Response) {
    let rawId = req.params.id;
    if (!rawId || typeof rawId != "string") {
      return res
        .status(400)
        .json({ message: "Valores obrigatórios não informados" });
    }
    let equipamento_id = Number(rawId);
    if (isNaN(equipamento_id)) {
      return res.status(400).json({ message: "O código precisa se numérico" });
    }
    try {
      let equipamento = await equipamentoService.getById(equipamento_id);
      return res.status(200).json(equipamento);
    } catch (e: any) {
      if (e.message == "ERR_NOT_FOUND") {
        return res.status(404).json({ message: "Equipamento não encontrado" });
      }
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async update(req: Request, res: Response) {
    let { id, smartlock_id, tag, patrimonio, tipo,apelido } = req.body;
    if (!id || !smartlock_id || !tag || !patrimonio || !tipo) {
      return res.status(400).json({ message: "Dados obrigatórios faltando" });
    }
    try {
      await equipamentoService.update(id, tag, patrimonio, tipo, smartlock_id,apelido);
      return res.status(200).json({ message: "Alterado" });
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async redirect(req: Request, res: Response) {
    let { smartlock_destino_id, equipamentos } = req.body;
    if (!smartlock_destino_id || equipamentos.length == 0) {
      return res.status(400).json({ message: "Dados obrigatórios faltando" });
    }
    try {
      let affected_rows = await equipamentoService.relocate(
        smartlock_destino_id,
        equipamentos,
      );
      return res.status(200).json(affected_rows);
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async deactivate(req: Request, res: Response) {
    let rawId = req.params.id;
    if (!rawId || typeof rawId != "string") {
      return res
        .status(400)
        .json({ message: "Valores obrigatórios não informados" });
    }
    let equipamento_id = Number(rawId);
    if (isNaN(equipamento_id)) {
      return res.status(400).json({ message: "O código precisa se numérico" });
    }
    try {
      await equipamentoService.deactivate(equipamento_id);
      res.status(200).json({ message: "Equipamento desativado com sucesso" });
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async listBySmartlock(req: Request, res: Response) {
    let rawId = req.params.smartlock_id;
    if (!rawId || typeof rawId != "string") {
      return res
        .status(400)
        .json({ message: "Valores obrigatórios não informados" });
    }
    let smartlock_id = Number(rawId);
    if (isNaN(smartlock_id)) {
      return res.status(400).json({ message: "O código precisa se numérico" });
    }
    try {
      let equipamentos = await equipamentoService.listBySmartlock(smartlock_id);
      return res.status(200).json(equipamentos);
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async equipamentosComigo(req: Request, res: Response) {
    let usuario_id = req.user?.id;
    if (!usuario_id) {
      return res.status(400).json({ message: "Não consegui te identificar" });
    }

    try {
      let equipamentos =
        await equipamentoService.getEmprestadosUsuario(usuario_id);
      res.status(200).json(equipamentos);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async reportDisponibilidade(req: Request, res: Response) {
    let rawId = req.params.smartlock_id;
    if (!rawId || typeof rawId != "string") {
      return res
        .status(400)
        .json({ message: "Valores obrigatórios não informados" });
    }
    let smartlock_id = Number(rawId);
    if (isNaN(smartlock_id)) {
      return res.status(400).json({ message: "O código precisa se numérico" });
    }
    try {
      let relatorio =
        await equipamentoService.getRelatorioDisponibilidade(smartlock_id);
      return res.status(200).json(relatorio);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do Servidor" });
    }
  }

  async listDisponiveisParaReserva(req:Request,res:Response){
    let {smartlock_id,dataHoraInicio,dataHoraFim} = req.body
    dataHoraInicio = new Date(dataHoraInicio)
    dataHoraFim = new Date(dataHoraFim)
    if(!smartlock_id || !dataHoraInicio || !dataHoraFim){
      return res.status(400).json({"message":"Faltam dados obrigatórios"})
    }
    if(dataHoraInicio.getTime() > dataHoraFim.getTime()){
      return res.status(400).json({"message":"Data de inicio não pode ser superior à data de fim"})
    }
    try{
      let relatorio = await equipamentoService.listDisponibilidadeData(smartlock_id,dataHoraInicio,dataHoraFim)
      return res.status(200).json(relatorio)
    }catch(e){
      console.log(e)
      return res.status(500).json({"message":"Erro interno do servidor"})
    }
  }

}

export default new EquipamentoController();
