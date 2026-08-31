import { raw, Request, Response } from "express";
import movimentacaoService from "../services/movimentacao.service";
import usuarioService from "../services/usuario.service";
import smartLockService from "../services/smartLock.service";
import equipamentoService from "../services/equipamento.service";

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

  async bulkMovimentaPorSmartlock(req: Request, res: Response) {
    let mac = req.params.mac;
    if (!mac || typeof mac != "string") {
      return res.status(400).json({ message: "Sem endereço MAC" });
    }
    let { events, usuario, timestamp } = req.body;
    if (!usuario || !events || !timestamp) {
      return res.status(400).json({ message: "Faltam dados obrigatórios" });
    }
    console.log(`Movimentos: ${events}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`Timestamp: ${timestamp}`);
    try {
      let usuario_id = await usuarioService.getByTag(usuario);
      if (!usuario_id) {
        throw new Error("USER_NOT_FOUND");
      }
      console.log("Usuário encontrado!");
      let smartlock_id = (await smartLockService.getSmartlockByMac(mac))?.id;
      if (!smartlock_id) {
        throw new Error("SMARTLOCK_NOT_FOUND");
      }
      console.log("Smartlock encontrada");
      let events_entrada = events
        .filter((e: any) => e.tipo == "DEVOLUCAO")
        .map((e: any) => e.epc);
      let events_saida = events
        .filter((e: any) => e.tipo == "RETIRADA")
        .map((e: any) => e.epc);
      console.log(`${events_entrada.length} equipamentos para dar entrada:`);
      console.log(events_entrada);
      console.log(`${events_saida.length} equipamentos para dar saída:`);
      console.log(events_saida);

      let nencontrados: any = [];

      if (events_entrada.length > 0) {
        console.log("Possui equipamentos para dar entrada.");
        let entradas = await equipamentoService.listByTag(events_entrada);
        console.log("Equipamentos encontrados no banco:");
        console.log(entradas);

        if (events_entrada.length != entradas.length) {
          //Faz um push das tags não encontradas
          events_entrada.forEach((e: any) => {
            if (entradas.find((ent: any) => ent == e) == null) {
              console.log(`${e} não foi encontrado no banco!`);
              nencontrados.push(e);
            }
          });
        }
        await movimentacaoService.bulkInsert(
          usuario_id,
          smartlock_id,
          "devolucao",
          entradas,
        );
      }
      if (events_saida.length > 0) {
        console.log("Possui equipamentos para dar saida.");
        let saidas = await equipamentoService.listByTag(events_saida);
        console.log("Equipamentos encontrados no banco:");
        console.log(saidas);

        if (events_saida.length != saidas.length) {
          //Faz um push das tags não encontradas
          events_saida.forEach((e: any) => {
            if (!saidas.find((ent: any) => ent == e)) {
              console.log(`${e} não foi encontrado no banco!`);
              nencontrados.push(e);
            }
          });
        }

        await movimentacaoService.bulkInsert(
          usuario_id,
          smartlock_id,
          "emprestimo",
          saidas,
        );
      }
      console.log(`Equipamentos que não foi encontrado no banco:`);
      console.log(nencontrados);
      return res
        .status(200)
        .json({ message: "ok", "nao-cadastrados": nencontrados });
    } catch (e) {
      console.log(e);
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
