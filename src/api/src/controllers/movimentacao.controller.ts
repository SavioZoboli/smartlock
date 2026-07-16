import { raw, Request, Response } from "express";
import movimentacaoService from "../services/movimentacao.service";

class MovimentacaoController {
  async bulkMovimenta(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    let usuario_id = req.user.id;
    let { equipamentos, movimento, smartlock_id } = req.body;
    if (!equipamentos || !movimento || !smartlock_id) {
      return res.status(400).json({ message: "Dados incompletos" });
    }
    try {
      let id_movimento = await movimentacaoService.bulkInsert(
        usuario_id,
        smartlock_id,
        movimento,
        equipamentos,
      );
      return res.status(201).json({ id_movimento });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getMovimentacoesUltimosDiasUsuario(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }
    const usuario_id = req.user.id;
    const raw_day = req.params.dias;
    if (!raw_day || typeof raw_day != "string") {
      return res.status(400).json({ message: "Sem dias a serem contados" });
    }
    const dias = Number(raw_day);
    if (isNaN(dias)) {
      return res.status(400).json({ message: "Dias precisa ser numérico" });
    }
    try {
      let relatorio =
        await movimentacaoService.movimentacoesUltimosDiasDoUsuario(
          usuario_id,
          dias,
        );
      return res.status(200).json(relatorio);
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}

export default new MovimentacaoController();
