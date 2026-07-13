import { Request, Response } from "express";
import kpiService from "../services/kpi.service";

class KpiController {
  async equipamentosComigo(req: Request, res: Response) {
    let user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ message: "Não sei quem você é" });
    }
    try {
      let contagem = await kpiService.countEquipamentosComigo(user_id);
      res.status(200).json(contagem);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async proximaReserva(req: Request, res: Response) {
    res.status(501).json({ message: "Não implementado" });
  }

  async emprestimosPorMes(req: Request, res: Response) {
    let user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ message: "Não sei quem você é" });
    }
    try {
      let contagem = await kpiService.countEmprestimosUltimoMes(user_id);
      res.status(200).json(contagem);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async equipamentosEmManutencao(req: Request, res: Response) {
    res.status(501).json({ message: "Não implementado" });
  }

  async taxaDisponibilidade(req: Request, res: Response) {
    res.status(501).json({ message: "Não implementado" });
  }

  async equipamentoMaisUsado(req: Request, res: Response) {
    res.status(501).json({ message: "Não implementado" });
  }

  async tempoMedioEmprestimo(req: Request, res: Response) {
    res.status(501).json({ message: "Não implementado" });
  }

  async reservasPendentes(req: Request, res: Response) {
    res.status(501).json({ message: "Não implementado" });
  }

  async ultimaDevolucao(req: Request, res: Response) {
    res.status(501).json({ message: "Não implementado" });
  }
}

export default new KpiController();
