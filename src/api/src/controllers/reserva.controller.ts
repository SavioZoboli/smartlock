import { Request, Response } from "express";
import reservaService from "../services/reserva.service";

class ReservaController {
  async create(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    let { smartlock_id, dt_reserva, dt_devolucao, equipamentos } = req.body;
    const usuario_id = req.user.id;

    if (!smartlock_id || !dt_reserva || !dt_devolucao || !equipamentos) {
      return res.status(400).json({ message: "Dados obrigatórios faltando" });
    }
    if (equipamentos.length == 0) {
      return res
        .status(400)
        .json({
          message: "É necessário pelo menos um equipamento selecionado",
        });
    }

    dt_reserva = new Date(dt_reserva);
    dt_devolucao = new Date(dt_devolucao);
    let agora = new Date();

    if (dt_reserva > dt_devolucao) {
      return res
        .status(400)
        .json({
          message: "Data da reserva não pode ser superior à data de devolução",
        });
    }

    if (dt_reserva < agora || dt_devolucao < agora) {
      return res
        .status(400)
        .json({ message: "A reserva precisa ser para um momento futuro" });
    }

    try {
      let reserva = await reservaService.create(
        usuario_id,
        smartlock_id,
        dt_reserva,
        dt_devolucao,
        equipamentos,
      );
      return res.status(201).json(reserva);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async reservasDoUsuario(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    try {
      let relatorio = await reservaService.listDoUsario(req.user.id);
      return res.status(200).json(relatorio);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async relatorio(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }

    const rawUnidadeId = req.query.unidade_id;
    const rawSmartlockId = req.query.smartlock_id;
    const rawUsuarioId = req.query.usuario_id;

    const unidade_id = rawUnidadeId ? Number(rawUnidadeId) : undefined;
    const smartlock_id = rawSmartlockId ? Number(rawSmartlockId) : undefined;
    const usuario_id = rawUsuarioId ? Number(rawUsuarioId) : undefined;

    if (!unidade_id && !usuario_id) {
      return res.status(400).json({
        message: "Pelo menos um dos filtros precisa estar preenchido (unidade ou usuário).",
      });
    }

    const inicio = req.query.inicio ? new Date(req.query.inicio as string) : undefined;
    const fim = req.query.fim ? new Date(req.query.fim as string) : undefined;

    try {
      const reservas = await reservaService.relatorioReservas({
        unidade_id,
        smartlock_id,
        usuario_id,
        inicio,
        fim,
      });
      return res.status(200).json(reservas);
    } catch (e: any) {
      if (e?.message === "ERR_FILTRO_OBRIGATORIO") {
        return res.status(400).json({
          message: "Pelo menos um dos filtros precisa estar preenchido (unidade ou usuário).",
        });
      }
      console.error(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getById(req: Request, res: Response) {
    let raw_id = req.params.id;
    if (!raw_id || typeof raw_id != "string") {
      return res.status(400).json({ message: "Dados inválidos" });
    }
    let reserva_id = parseInt(raw_id);
    if (isNaN(reserva_id)) {
      return res.status(400).json({ message: "ID é inválido" });
    }
    try {
      let reserva = await reservaService.getById(reserva_id);
      return res.status(200).json(reserva);
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async update(req: Request, res: Response) {
    let { id, dt_reserva, dt_devolucao, equipamentos, motivo } = req.body;

    if (!id || !dt_reserva || !dt_devolucao || !equipamentos) {
      return res.status(400).json({ message: "Dados obrigatórios faltando" });
    }
    if (equipamentos.length == 0) {
      return res
        .status(400)
        .json({
          message: "É necessário pelo menos um equipamento selecionado",
        });
    }

    dt_reserva = new Date(dt_reserva);
    dt_devolucao = new Date(dt_devolucao);
    let agora = new Date();

    if (dt_reserva > dt_devolucao) {
      return res
        .status(400)
        .json({
          message: "Data da reserva não pode ser superior à data de devolução",
        });
    }

    if (dt_reserva < agora || dt_devolucao < agora) {
      return res
        .status(400)
        .json({ message: "A reserva precisa ser para um momento futuro" });
    }

    try {
      let reserva = await reservaService.update(
        id,
        dt_reserva,
        dt_devolucao,
        equipamentos,
        motivo,
      );
      return res.status(201).json(reserva);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async delete(req: Request, res: Response) {
    let raw_id = req.params.id;
    if (!raw_id || typeof raw_id != "string") {
      return res.status(400).json({ message: "Dados inválidos" });
    }
    let reserva_id = parseInt(raw_id);
    if (isNaN(reserva_id)) {
      return res.status(400).json({ message: "ID é inválido" });
    }
    try {
        await reservaService.delete(reserva_id)
        return res.status(200).json({message:"Excluído"})
    } catch (e) {
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }

  async getReservaVigente(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({ message: "Não autenticado" });
    }
    const rawSmartlockId = req.query.smartlock_id;
    if (!rawSmartlockId) {
      return res.status(400).json({ message: "smartlock_id é obrigatório" });
    }
    const smartlock_id = Number(rawSmartlockId);
    if (isNaN(smartlock_id)) {
      return res.status(400).json({ message: "smartlock_id inválido" });
    }

    try {
      const data = await reservaService.getReservaVigenteSmartlock(
        req.user.id,
        smartlock_id,
      );
      return res.status(200).json(data);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
    }
  }
}

export default new ReservaController();
