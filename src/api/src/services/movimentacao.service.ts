import { Op, Sequelize } from "sequelize";
import sequelize from "../config/database";
import {
  Movimentacao,
  ItensMovimentacao,
  SmartLock,
  Unidade,
  Usuario,
  Equipamento,
} from "../models/index.model";
import unidadeService from "./unidade.service";

const STATUS_DISPONIVEL = "DISPONIVEL";
const STATUS_EMPRESTADO = "EM USO";

export type TipoMovimento =
  | "emprestimo"
  | "emprestimo_manual"
  | "devolucao"
  | "devolucao_manual"
  | "manutencao";

// Erro tipado para o controller decidir o status HTTP (400/404/409) sem parsear string.
export class MovimentacaoError extends Error {
  constructor(
    public codigo:
      | "TIPO_INVALIDO"
      | "SEM_EQUIPAMENTOS"
      | "NAO_IMPLEMENTADO"
      | "EQUIPAMENTO_NAO_ENCONTRADO"
      | "EQUIPAMENTO_INDISPONIVEL",
    message: string,
    public detalhes?: any,
  ) {
    super(message);
    this.name = "MovimentacaoError";
  }
}

class MovimentacaoService {
  private getAcao(
    tipo_movimento: string,
  ): "emprestimo" | "devolucao" | "manutencao" {
    if (
      tipo_movimento === "emprestimo" ||
      tipo_movimento === "emprestimo_manual"
    )
      return "emprestimo";
    if (tipo_movimento === "devolucao" || tipo_movimento === "devolucao_manual")
      return "devolucao";
    if (tipo_movimento === "manutencao") return "manutencao";
    throw new MovimentacaoError(
      "TIPO_INVALIDO",
      `tipo_movimento "${tipo_movimento}" inválido`,
    );
  }

  private isManual(tipo_movimento: string): boolean {
    return tipo_movimento.endsWith("_manual");
  }

  async bulkInsert(
    usuario_id: number,
    smartlock_id: number,
    tipo_movimento: TipoMovimento,
    equipamentos: number[],
  ): Promise<number> {
    if (!equipamentos || equipamentos.length === 0) {
      throw new MovimentacaoError(
        "SEM_EQUIPAMENTOS",
        "Nenhum equipamento informado.",
      );
    }

    const acao = this.getAcao(tipo_movimento);

    if (acao === "manutencao") {
      // Fluxo de manutenção fica pra depois — não mexe em status/posse por enquanto.
      throw new MovimentacaoError(
        "NAO_IMPLEMENTADO",
        "Movimentação de manutenção ainda não implementada.",
      );
    }

    const transaction = await sequelize.transaction();

    try {
      // FOR UPDATE: trava as linhas até o commit/rollback, então duas requisições
      // concorrentes tentando pegar o mesmo equipamento não passam as duas na validação.
      // order by id evita deadlock quando duas transações travam os mesmos equipamentos em ordens diferentes.
      const eqp = await Equipamento.findAll({
        where: { id: { [Op.in]: equipamentos } },
        order: [["id", "ASC"]],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      // 1. Todos existem?
      if (eqp.length !== equipamentos.length) {
        const encontrados = new Set(eqp.map((e) => e.id));
        const faltando = equipamentos.filter((id) => !encontrados.has(id));
        throw new MovimentacaoError(
          "EQUIPAMENTO_NAO_ENCONTRADO",
          "Um ou mais equipamentos não foram encontrados.",
          { equipamentos: faltando },
        );
      }

      // 2. Cada um está livre pra essa ação?
      const indisponiveis: {
        id: number;
        patrimonio: string;
        motivo: string;
      }[] = [];

      for (const equipamento of eqp) {
        if (!equipamento.ativo) {
          indisponiveis.push({
            id: equipamento.id,
            patrimonio: equipamento.patrimonio,
            motivo: "inativo",
          });
          continue;
        }

        if (acao === "emprestimo") {
          if (
            equipamento.status_atual !== STATUS_DISPONIVEL ||
            equipamento.usuario_atual_id
          ) {
            indisponiveis.push({
              id: equipamento.id,
              patrimonio: equipamento.patrimonio,
              motivo: "já emprestado",
            });
          }
        }

        if (acao === "devolucao") {
          if (equipamento.status_atual !== STATUS_EMPRESTADO) {
            indisponiveis.push({
              id: equipamento.id,
              patrimonio: equipamento.patrimonio,
              motivo: "não está emprestado",
            });
            continue;
          }

          // Fluxo automático (hardware): só quem pegou pode devolver.
          // Fluxo manual (HMI): operador pode devolver em nome de outro usuário.
          if (
            !this.isManual(tipo_movimento) &&
            equipamento.usuario_atual_id !== usuario_id
          ) {
            indisponiveis.push({
              id: equipamento.id,
              patrimonio: equipamento.patrimonio,
              motivo: "emprestado a outro usuário",
            });
          }
        }
      }

      if (indisponiveis.length > 0) {
        throw new MovimentacaoError(
          "EQUIPAMENTO_INDISPONIVEL",
          "Um ou mais equipamentos não estão livres para essa movimentação.",
          { equipamentos: indisponiveis },
        );
      }

      // 3. Cria a movimentação e os itens
      const movimentacao = await Movimentacao.create(
        { usuario_id, smartlock_id, tipo_movimento, timestamp: new Date() },
        { transaction },
      );

      const itens = equipamentos.map((equipamento_id) => ({
        equipamento_id,
        movimentacao_id: movimentacao.id,
      }));
      await ItensMovimentacao.bulkCreate(itens, { transaction });

      // 4. Atualiza status/posse — é isso que estava faltando
      const novoStatus =
        acao === "emprestimo" ? STATUS_EMPRESTADO : STATUS_DISPONIVEL;
      const novoUsuario = acao === 'devolucao' ? null : usuario_id
      await Equipamento.update(
        { status_atual: novoStatus, usuario_atual_id: novoUsuario },
        { where: { id: { [Op.in]: equipamentos } }, transaction },
      );

      await transaction.commit();
      return movimentacao.id;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async movimentacoesUltimosDiasDoUsuario(usuario_id: number, dias: number) {
  const diasAtras = new Date();
  diasAtras.setDate(diasAtras.getDate() - dias);

  const movimentacoes = await Movimentacao.findAll({
    where: {
      usuario_id,
      timestamp: { [Op.gte]: diasAtras },
    },
    include: [
      {
        model: SmartLock,
        as: "smartlock",
        attributes: ["id", "apelido"],
        include: [
          {
            model: Unidade,
            as: "unidade",
            attributes: ["id", "nome", "regional"],
          },
        ],
      },
      {
        model: Usuario,
        as: "usuario",
        attributes: ["id", "nome", "sobrenome", "matricula"],
      },
      {
        model: Equipamento,
        as: "equipamentos",
        attributes: ["id", "apelido", "patrimonio", "tipo", "status_atual"],
        through: { attributes: [] },
      },
    ],
    order: [["timestamp", "DESC"]],
  });

  return movimentacoes.map((m: any) => ({
    id: m.id,
    timestamp: m.timestamp,
    tipo: m.tipo_movimento,
    usuario: `${m.usuario.nome} ${m.usuario.sobrenome ?? ""}`.trim(),
    smartlock: m.smartlock.apelido,
    unidade: m.smartlock.unidade.nome,
    regional: m.smartlock.unidade.regional,
    equipamentos: m.equipamentos.map((e: any) => ({
      id: e.id,
      apelido: e.apelido,
      patrimonio: e.patrimonio,
      tipo: e.tipo,
      situacao: e.status_atual,
    })),
  }));
}
}

export default new MovimentacaoService();
