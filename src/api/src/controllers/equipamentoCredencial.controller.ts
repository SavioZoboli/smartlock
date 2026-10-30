import { Request, Response } from "express";
import equipamentoCredencialService from "../services/equipamentoCredencial.service";

const TAMANHO_MAX_LOGIN = 100;

/** Mapeia os códigos de erro do service para respostas HTTP. */
function responderErro(res: Response, e: any) {
  switch (e?.message) {
    case "ERR_NOT_FOUND":
      return res.status(404).json({ message: "Credencial não encontrada para este equipamento" });
    case "ERR_EQUIPAMENTO_NOT_FOUND":
      return res.status(404).json({ message: "Equipamento não encontrado ou inativo" });
    case "ERR_DUPLICATE":
      return res.status(409).json({ message: "Este equipamento já possui credencial cadastrada" });
    case "ERR_SENHA_MUITO_LONGA":
      return res.status(400).json({ message: "A senha excede o tamanho máximo permitido (100 bytes)" });
    case "ERR_SEM_SENHA":
      return res.status(404).json({ message: "Esta credencial não possui senha cadastrada" });
    case "ERR_FALHA_DESCRIPTOGRAFIA":
      console.error("[CREDENCIAL] Falha ao descriptografar senha (payload adulterado ou MASTER_KEY alterada)");
      return res.status(500).json({ message: "Não foi possível descriptografar a senha" });
    case "ERR_MASTER_KEY_INVALIDA":
      console.error("[CREDENCIAL] MASTER_KEY ausente ou com menos de 32 caracteres no .env");
      return res.status(500).json({ message: "Criptografia não configurada no servidor" });
    default:
      console.error(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
  }
}

function lerEquipamentoId(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Valida login/senha do body. Retorna mensagem de erro ou null se válido. */
function validarBody(login: unknown, senha: unknown): string | null {
  if (typeof login !== "string" || login.trim().length === 0) {
    return "O login é obrigatório";
  }
  if (login.trim().length > TAMANHO_MAX_LOGIN) {
    return `O login deve ter no máximo ${TAMANHO_MAX_LOGIN} caracteres`;
  }
  if (senha !== undefined && senha !== null && typeof senha !== "string") {
    return "Senha inválida";
  }
  return null;
}

class EquipamentoCredencialController {
  async listAll(req: Request, res: Response) {
    const regiao_id = req.user?.regiao_id;
    if (!regiao_id) {
      return res.status(401).json({ message: "Deslogado" });
    }
    try {
      const credenciais = await equipamentoCredencialService.listAll(regiao_id);
      return res.status(200).json(credenciais);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  async getByEquipamento(req: Request, res: Response) {
    const equipamento_id = lerEquipamentoId(req.params.equipamento_id);
    if (!equipamento_id) {
      return res.status(400).json({ message: "O código do equipamento precisa ser numérico" });
    }
    try {
      const credencial = await equipamentoCredencialService.getByEquipamento(equipamento_id);
      return res.status(200).json(credencial);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  async create(req: Request, res: Response) {
    const { equipamento_id: rawId, login, senha } = req.body ?? {};
    const equipamento_id = lerEquipamentoId(rawId);
    if (!equipamento_id) {
      return res.status(400).json({ message: "Equipamento não informado" });
    }
    const erro = validarBody(login, senha);
    if (erro) {
      return res.status(400).json({ message: erro });
    }
    try {
      const credencial = await equipamentoCredencialService.create(
        equipamento_id,
        login.trim(),
        senha,
      );
      return res.status(201).json(credencial);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  async update(req: Request, res: Response) {
    const equipamento_id = lerEquipamentoId(req.params.equipamento_id);
    if (!equipamento_id) {
      return res.status(400).json({ message: "O código do equipamento precisa ser numérico" });
    }
    const { login, senha } = req.body ?? {};
    const erro = validarBody(login, senha);
    if (erro) {
      return res.status(400).json({ message: erro });
    }
    try {
      const credencial = await equipamentoCredencialService.update(
        equipamento_id,
        login.trim(),
        senha,
      );
      return res.status(200).json(credencial);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  async delete(req: Request, res: Response) {
    const equipamento_id = lerEquipamentoId(req.params.equipamento_id);
    if (!equipamento_id) {
      return res.status(400).json({ message: "O código do equipamento precisa ser numérico" });
    }
    try {
      await equipamentoCredencialService.delete(equipamento_id);
      return res.status(200).json({ message: "Credencial removida com sucesso" });
    } catch (e) {
      return responderErro(res, e);
    }
  }

  /** "Ver Senha": descriptografa, audita em LogAcessoEqpCred e só então retorna. */
  async revelarSenha(req: Request, res: Response) {
    const usuario_id = req.user?.id;
    if (!usuario_id) {
      return res.status(401).json({ message: "Não consegui te identificar" });
    }
    const equipamento_id = lerEquipamentoId(req.params.equipamento_id);
    if (!equipamento_id) {
      return res.status(400).json({ message: "O código do equipamento precisa ser numérico" });
    }
    try {
      const senha = await equipamentoCredencialService.revelarSenha(equipamento_id, usuario_id);
      // Segredo em texto puro: proíbe qualquer cache (browser/proxy).
      res.set("Cache-Control", "no-store");
      res.set("Pragma", "no-cache");
      return res.status(200).json({ senha });
    } catch (e) {
      return responderErro(res, e);
    }
  }
}

export default new EquipamentoCredencialController();

