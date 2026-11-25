import { Request, Response } from "express";
import tipoEquipamentoService from "../services/tipoEquipamento.service";
import { TipoEquipamentoAttributes } from "../models/tipoEquipamento.model";

const TAMANHO_MAX_NOME = 30;
const TAMANHO_MAX_DESCRICAO = 100;
const TAMANHO_MAX_ICONE = 20;

/** Mapeia os códigos de erro do service para respostas HTTP. */
function responderErro(res: Response, e: any) {
  switch (e?.message) {
    case "ERR_NOT_FOUND":
      return res.status(404).json({ message: "Tipo de equipamento não encontrado" });
    case "ERR_DUPLICATE":
      return res.status(409).json({ message: "Já existe um tipo de equipamento com este nome" });
    case "ERR_IN_USE":
      return res.status(409).json({
        message: "Não é possível excluir este tipo pois existem equipamentos vinculados a ele",
      });
    default:
      console.error(e);
      return res.status(500).json({ message: "Erro interno do servidor" });
  }
}

function lerId(raw: unknown): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Normaliza e valida um campo de texto opcional, retornando null quando vazio. */
function validarCampoOpcional(
  valor: unknown,
  rotulo: string,
  tamanhoMax: number,
): { erro?: string; valor: string | null } {
  if (valor === undefined || valor === null) {
    return { valor: null };
  }
  if (typeof valor !== "string") {
    return { erro: `${rotulo} inválido`, valor: null };
  }
  const limpo = valor.trim();
  if (limpo.length > tamanhoMax) {
    return { erro: `${rotulo} deve ter no máximo ${tamanhoMax} caracteres`, valor: null };
  }
  return { valor: limpo.length > 0 ? limpo : null };
}

/** Valida e sanitiza o corpo da requisição para criação/atualização de tipo. */
function validarBody(
  body: any,
): { erro: string } | { dados: Omit<TipoEquipamentoAttributes, "id"> } {
  const { nome, descricao, has_patrimonio, has_credencial, icone } = body ?? {};

  if (typeof nome !== "string" || nome.trim().length === 0) {
    return { erro: "O nome é obrigatório" };
  }
  const nomeLimpo = nome.trim();
  if (nomeLimpo.length > TAMANHO_MAX_NOME) {
    return { erro: `O nome deve ter no máximo ${TAMANHO_MAX_NOME} caracteres` };
  }

  const descricaoValidada = validarCampoOpcional(descricao, "A descrição", TAMANHO_MAX_DESCRICAO);
  if (descricaoValidada.erro) {
    return { erro: descricaoValidada.erro };
  }

  if (typeof has_patrimonio !== "boolean") {
    return { erro: "O campo has_patrimonio é obrigatório e deve ser booleano" };
  }

  if (typeof has_credencial !== "boolean") {
    return { erro: "O campo has_credencial é obrigatório e deve ser booleano" };
  }

  const iconeValidado = validarCampoOpcional(icone, "O ícone", TAMANHO_MAX_ICONE);
  if (iconeValidado.erro) {
    return { erro: iconeValidado.erro };
  }

  return {
    dados: {
      nome: nomeLimpo,
      descricao: descricaoValidada.valor,
      has_patrimonio,
      has_credencial,
      icone: iconeValidado.valor,
    },
  };
}

class TipoEquipamentoController {
  async listAll(req: Request, res: Response) {
    try {
      const tipos = await tipoEquipamentoService.listAll();
      return res.status(200).json(tipos);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  async getById(req: Request, res: Response) {
    const id = lerId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "O código precisa ser numérico" });
    }
    try {
      const tipo = await tipoEquipamentoService.getById(id);
      return res.status(200).json(tipo);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  async create(req: Request, res: Response) {
    const validacao = validarBody(req.body);
    if ("erro" in validacao) {
      return res.status(400).json({ message: validacao.erro });
    }
    try {
      const criado = await tipoEquipamentoService.create(validacao.dados);
      return res.status(201).json(criado);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  async update(req: Request, res: Response) {
    const id = lerId(req.params.id ?? req.body?.id);
    if (!id) {
      return res.status(400).json({ message: "O código do tipo precisa ser numérico" });
    }
    const validacao = validarBody(req.body);
    if ("erro" in validacao) {
      return res.status(400).json({ message: validacao.erro });
    }
    try {
      const atualizado = await tipoEquipamentoService.update(id, validacao.dados);
      return res.status(200).json(atualizado);
    } catch (e) {
      return responderErro(res, e);
    }
  }

  async delete(req: Request, res: Response) {
    const id = lerId(req.params.id);
    if (!id) {
      return res.status(400).json({ message: "O código precisa ser numérico" });
    }
    try {
      await tipoEquipamentoService.delete(id);
      return res.status(200).json({ message: "Tipo de equipamento removido com sucesso" });
    } catch (e) {
      return responderErro(res, e);
    }
  }
}

export default new TipoEquipamentoController();
