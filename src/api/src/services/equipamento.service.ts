import { col, fn, Op, Sequelize } from "sequelize";
import { EquipamentoAttributes } from "../models/equipamento.model";
import {
  Equipamento,
  Movimentacao,
  Regiao,
  Reserva,
  SmartLock,
  TipoEquipamento,
  Unidade,
  Usuario,
} from "../models/index.model";
import Smartlock from "../models/smartlock.model";

interface EquipamentoEmUsoDTO {
  id: number;
  apelido: string | null;
  tag: string;
  patrimonio: string | null;
  tipo: string;
  tipo_id?: number;
  icone?: string | null;
  dataRetirada: Date | null;
}

interface EquipamentoResumoDTO {
  id: number;
  apelido: string | null;
  tag: string;
  patrimonio: string | null;
  tipo: string;
  tipo_id?: number;
  icone?: string | null;
}

interface MovimentacaoHistoricoDTO {
  id: number;
  tipo_movimento: string;
  timestamp: Date;
  equipamentos: EquipamentoResumoDTO[];
}

interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

class EquipamentoService {
  async bulkCreate(equipamentos: any[]): Promise<number> {
    try {
      const tipoIds = Array.from(
        new Set(equipamentos.map((e) => Number(e.tipo_id ?? e.tipo))),
      );
      if (tipoIds.some((id) => !Number.isInteger(id) || id <= 0)) {
        throw new Error("ERR_TIPO_NOT_FOUND");
      }

      const tiposEncontrados = await TipoEquipamento.findAll({
        where: { id: { [Op.in]: tipoIds } },
        raw: true,
      });
      const tiposMap = new Map<number, any>(
        tiposEncontrados.map((t: any) => [Number(t.id), t]),
      );

      const patrimoniosLote = new Set<string>();
      const duplicadosLote = new Set<string>();

      const equipamentosNormalizados = equipamentos.map((e) => {
        const tipoId = Number(e.tipo_id ?? e.tipo);
        const tipoInfo = tiposMap.get(tipoId);
        if (!tipoInfo) {
          throw new Error("ERR_TIPO_NOT_FOUND");
        }

        const patrimonio =
          typeof e.patrimonio === "string" && e.patrimonio.trim().length > 0
            ? e.patrimonio.trim()
            : null;

        if (tipoInfo.has_patrimonio && !patrimonio) {
          throw new Error("ERR_PATRIMONIO_OBRIGATORIO");
        }

        if (patrimonio) {
          if (patrimoniosLote.has(patrimonio)) {
            duplicadosLote.add(patrimonio);
          } else {
            patrimoniosLote.add(patrimonio);
          }
        }

        const { tipo: _tipoIgnorado, ...resto } = e;
        return {
          ...resto,
          tipo_id: tipoId,
          patrimonio,
        };
      });

      if (duplicadosLote.size > 0) {
        const erro: any = new Error("ERR_DUPLICATE");
        erro.duplicados = Array.from(duplicadosLote);
        throw erro;
      }

      const patrimonios = Array.from(patrimoniosLote);
      if (patrimonios.length > 0) {
        const existentes = await Equipamento.findAll({
          where: { patrimonio: { [Op.in]: patrimonios } },
          attributes: ["patrimonio"],
          raw: true,
        });

        if (existentes.length > 0) {
          const erro: any = new Error("ERR_DUPLICATE");
          erro.duplicados = existentes
            .map((e: any) => e.patrimonio)
            .filter((p: any): p is string => typeof p === "string");
          throw erro;
        }
      }

      let created = await Equipamento.bulkCreate(
        equipamentosNormalizados as EquipamentoAttributes[],
      );
      return created.length;
    } catch (e: any) {
      if (e.name === "SequelizeUniqueConstraintError") {
        e.duplicados = e.errors?.map((err: any) => err.value) ?? [];
        e.message = "ERR_DUPLICATE";
      }
      throw e;
    }
  }

  async listAll(regiao_id: number): Promise<Equipamento[]> {
    try {
      let equipametos = await Equipamento.findAll({
        where: { ativo: true },
        attributes: [
          "id",
          "patrimonio",
          ["status_atual", "status"],
          "tipo_id",
          [Sequelize.col("tipoEquipamento.nome"), "tipo"],
          [Sequelize.col("tipoEquipamento.icone"), "icone"],
          [Sequelize.col("tipoEquipamento.has_patrimonio"), "has_patrimonio"],
          [Sequelize.col("tipoEquipamento.has_credencial"), "has_credencial"],
          "apelido",
          [Sequelize.col("smartlockBase.apelido"), "smartlock"],
          [Sequelize.col("smartlockBase.unidade.nome"), "unidade"],
          [Sequelize.col("usuarioAtual.nome"), "usuario"],
        ],
        order: [
          ["apelido", "asc"],
          ["patrimonio", "asc"],
        ],
        include: [
          {
            model: TipoEquipamento,
            as: "tipoEquipamento",
            attributes: [],
          },
          {
            model: SmartLock,
            as: "smartlockBase",
            attributes: [],
            include: [
              {
                model: Unidade,
                as: "unidade",
                attributes: [],
                where: { regiao_id },
              },
            ],
          },
          {
            model: Usuario,
            as: "usuarioAtual",
            attributes: [],
          },
        ],
        raw: true,
      });
      return equipametos;
    } catch (e) {
      throw e;
    }
  }

  async getById(id: number): Promise<Equipamento> {
    try {
      let equipamento = await Equipamento.findByPk(id, {
        attributes: [
          "id",
          "patrimonio",
          "tag",
          "tipo_id",
          [Sequelize.col("tipoEquipamento.nome"), "tipo"],
          [Sequelize.col("tipoEquipamento.icone"), "icone"],
          [Sequelize.col("tipoEquipamento.has_patrimonio"), "has_patrimonio"],
          [Sequelize.col("tipoEquipamento.has_credencial"), "has_credencial"],
          "apelido",
          "ativo",
          ["smartlock_base_id", "smartlock_id"],
        ],
        include: [
          {
            model: TipoEquipamento,
            as: "tipoEquipamento",
            attributes: [],
          },
        ],
        raw: true,
      });
      if (!equipamento) {
        throw new Error("ERR_NOT_FOUND");
      }
      return equipamento;
    } catch (e) {
      throw e;
    }
  }

  async update(
    id: number,
    tag: string,
    patrimonio: string | null | undefined,
    tipo_id: number,
    smartlock_id: number,
    apelido: string,
  ): Promise<void> {
    try {
      let equipamento = await Equipamento.findByPk(id);
      if (!equipamento) {
        throw new Error("ERR_NOT_FOUND");
      }

      const tipoEquipamento = await TipoEquipamento.findByPk(tipo_id);
      if (!tipoEquipamento) {
        throw new Error("ERR_TIPO_NOT_FOUND");
      }

      const patrimonioNormalizado =
        typeof patrimonio === "string" && patrimonio.trim().length > 0
          ? patrimonio.trim()
          : null;

      if (tipoEquipamento.has_patrimonio && !patrimonioNormalizado) {
        throw new Error("ERR_PATRIMONIO_OBRIGATORIO");
      }

      equipamento.tag = tag;
      equipamento.patrimonio = patrimonioNormalizado;
      equipamento.tipo_id = tipo_id;
      equipamento.smartlock_base_id = smartlock_id;
      equipamento.apelido = apelido;
      await equipamento.save();
      return;
    } catch (e) {
      throw e;
    }
  }

  async relocate(
    smartlock_destino_id: number,
    equipamentos: number[],
  ): Promise<number> {
    try {
      let smartlock_destino = await SmartLock.findByPk(smartlock_destino_id);
      if (!smartlock_destino) {
        throw new Error("SMARTLOCK_NOT_FOUND");
      }
      const [affected_rows] = await Equipamento.update(
        { smartlock_base_id: smartlock_destino.id },
        { where: { id: { [Op.in]: equipamentos } } },
      );
      return affected_rows;
    } catch (e) {
      throw e;
    }
  }

  async deactivate(id: number): Promise<number> {
    try {
      const [affected_rows] = await Equipamento.update(
        { ativo: false },
        { where: { id } },
      );
      return affected_rows;
    } catch (e) {
      throw e;
    }
  }

  async listBySmartlock(smartlock_id: number, usuario_id: number) {
    try {
      let equipamentos = await Equipamento.findAll({
        where: {
          smartlock_base_id: smartlock_id,
          ativo: true,
          [Op.or]: [
            { usuario_atual_id: null },
            { usuario_atual_id: usuario_id },
          ],
        },
        include: [
          {
            model: TipoEquipamento,
            as: "tipoEquipamento",
            attributes: ["id", "nome", "icone", "has_patrimonio", "has_credencial"],
          },
        ],
        order: [
          ["apelido", "asc"],
          ["patrimonio", "asc"],
        ],
      });
      return equipamentos.map((e: any) => ({
        ...e.get({ plain: true }),
        tipo: e.tipoEquipamento?.nome ?? null,
        icone: e.tipoEquipamento?.icone ?? null,
      }));
    } catch (e) {
      throw e;
    }
  }

  async getEmprestadosUsuario(usuario_id: number) {
    try {
      const equipamentos = await Equipamento.findAll({
        where: {
          usuario_atual_id: usuario_id,
          ativo: true,
        },
        attributes: {
          include: [
            [
              Sequelize.literal(`(
            SELECT m."timestamp"
            FROM movimentacoes m
            INNER JOIN "itensMovimentacao" im ON im.movimentacao_id = m.id
            WHERE im.equipamento_id = "Equipamento"."id"
              AND m.usuario_id = :usuario_id
            ORDER BY m."timestamp" DESC
            LIMIT 1
          )`),
              "data_movimentacao",
            ],
            [
              Sequelize.literal(
                `EXISTS (SELECT 1 FROM equipamento_credencial ec WHERE ec.equipamento_id = "Equipamento"."id")`,
              ),
              "possui_credencial",
            ],
          ],
        },
        include: [
          {
            model: TipoEquipamento,
            as: "tipoEquipamento",
            attributes: ["nome", "icone", "has_credencial"],
          },
          {
            model: SmartLock,
            as: "smartlockBase",
            attributes: ["id", "apelido"],
            include: [
              {
                model: Unidade,
                as: "unidade",
                attributes: ["nome"],
                include: [
                  {
                    model: Regiao,
                    as: "regional",
                    attributes: ["id", "nome"], // adicionei "id" já que você quer retorná-lo
                  },
                ],
              },
            ],
          },
        ],
        replacements: { usuario_id },
        order: [["patrimonio", "ASC"]],
      });

      return equipamentos.map((e: any) => ({
        id: e.id,
        apelido: e.apelido,
        patrimonio: e.patrimonio,
        tipo_id: e.tipo_id,
        tipo: e.tipoEquipamento?.nome ?? null,
        icone: e.tipoEquipamento?.icone ?? null,
        smartlock: e.smartlockBase.apelido,
        unidade: e.smartlockBase.unidade.nome,
        regional: e.smartlockBase.unidade.regional.id,
        data_movimentacao: e.get("data_movimentacao"),
        possui_credencial: Boolean(e.get("possui_credencial")),
      }));
    } catch (e) {
      throw e;
    }
  }

  async getRelatorioDisponibilidade(smartlock_id: number) {
    try {
      const agora = new Date();
      const fimDoDia = new Date();
      fimDoDia.setHours(23, 59, 59, 999);

      const linhas: any[] = await Equipamento.findAll({
        attributes: [
          "id",
          "apelido",
          "tipo_id",
          [Sequelize.col("tipoEquipamento.nome"), "tipo"],
          [Sequelize.col("tipoEquipamento.icone"), "icone"],
          "patrimonio",
          [Sequelize.col("usuarioAtual.nome"), "responsavel"],
          [Sequelize.col("reservas.reserva_inicio"), "reserva_inicio"],
          [Sequelize.col("reservas.reserva_fim"), "reserva_fim"],
          [Sequelize.col("reservas->usuario.nome"), "reserva_usuario"],
        ],
        include: [
          {
            model: TipoEquipamento,
            as: "tipoEquipamento",
            attributes: [],
          },
          {
            model: Usuario,
            as: "usuarioAtual",
            attributes: [],
            required: false,
          },
          {
            model: Reserva,
            as: "reservas",
            attributes: [],
            required: false,
            through: { attributes: [] },
            where: {
              reserva_inicio: { [Op.gte]: agora },
              reserva_fim: { [Op.lte]: fimDoDia },
              situacao: { [Op.ne]: "CANCELADA" },
            },
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: [],
                required: false,
              },
            ],
          },
        ],
        where: { ativo: true, smartlock_base_id: smartlock_id },
        order: [
          ["apelido", "asc"],
          ["patrimonio", "asc"],
          [Sequelize.col("reservas.reserva_inicio"), "asc"],
        ],
        raw: true,
      });

      // Agrupa as linhas duplicadas (uma por reserva) em um único equipamento com array de reservas
      const agrupado = new Map<number, any>();

      for (const linha of linhas) {
        if (!agrupado.has(linha.id)) {
          agrupado.set(linha.id, {
            id: linha.id,
            apelido: linha.apelido,
            tipo_id: linha.tipo_id,
            tipo: linha.tipo,
            icone: linha.icone,
            patrimonio: linha.patrimonio,
            responsavel: linha.responsavel,
            disponivel: linha.responsavel == null,
            reservas: [],
          });
        }

        if (linha.reserva_inicio) {
          agrupado.get(linha.id).reservas.push({
            usuario: linha.reserva_usuario,
            inicio: linha.reserva_inicio,
            fim: linha.reserva_fim,
          });
        }
      }

      return Array.from(agrupado.values());
    } catch (e) {
      throw e;
    }
  }

  async getRelatorioDisponibilidadeUnidade(unidade_id: number) {
    try {
      const agora = new Date();
      const fimDoDia = new Date();
      fimDoDia.setHours(23, 59, 59, 999);

      const linhas: any[] = await Equipamento.findAll({
        attributes: [
          "id",
          "apelido",
          "tipo_id",
          [Sequelize.col("tipoEquipamento.nome"), "tipo"],
          [Sequelize.col("tipoEquipamento.icone"), "icone"],
          "patrimonio",
          [Sequelize.col("smartlockBase.id"), "smartlock_id"],
          [Sequelize.col("smartlockBase.apelido"), "smartlock_apelido"],
          [Sequelize.col("usuarioAtual.nome"), "responsavel"],
          [Sequelize.col("usuarioAtual.avatar"), "avatar"],
          [Sequelize.col("reservas.reserva_inicio"), "reserva_inicio"],
          [Sequelize.col("reservas.reserva_fim"), "reserva_fim"],
          [Sequelize.col("reservas->usuario.nome"), "reserva_usuario"],
        ],
        include: [
          {
            model: TipoEquipamento,
            as: "tipoEquipamento",
            attributes: [],
          },
          {
            model: Usuario,
            as: "usuarioAtual",
            attributes: [],
            required: false,
          },
          {
            model: Smartlock,
            as: "smartlockBase",
            attributes: [],
            where: { unidade_id },
          },
          {
            model: Reserva,
            as: "reservas",
            attributes: [],
            required: false,
            through: { attributes: [] },
            where: {
              reserva_inicio: { [Op.gte]: agora },
              reserva_fim: { [Op.lte]: fimDoDia },
              situacao: { [Op.ne]: "CANCELADA" },
            },
            include: [
              {
                model: Usuario,
                as: "usuario",
                attributes: [],
                required: false,
              },
            ],
          },
        ],
        where: { ativo: true },
        order: [
          ["apelido", "asc"],
          ["patrimonio", "asc"],
          [Sequelize.col("reservas.reserva_inicio"), "asc"],
        ],
        raw: true,
      });

      // Agrupa as linhas duplicadas (uma por reserva) em um único equipamento com array de reservas
      const agrupado = new Map<number, any>();

      for (const linha of linhas) {
        if (!agrupado.has(linha.id)) {
          agrupado.set(linha.id, {
            id: linha.id,
            apelido: linha.apelido,
            tipo_id: linha.tipo_id,
            tipo: linha.tipo,
            icone: linha.icone,
            patrimonio: linha.patrimonio,
            responsavel: linha.responsavel,
            avatar: linha.avatar,
            disponivel: linha.responsavel == null,
            smartlockId: linha.smartlock_id,
            smartlockApelido: linha.smartlock_apelido,
            reservas: [],
          });
        }

        if (linha.reserva_inicio) {
          agrupado.get(linha.id).reservas.push({
            usuario: linha.reserva_usuario,
            inicio: linha.reserva_inicio,
            fim: linha.reserva_fim,
          });
        }
      }

      return Array.from(agrupado.values());
    } catch (e) {
      throw e;
    }
  }

  async listDisponibilidadeData(
    smartlock_id: number,
    dataInicio: Date,
    dataFim: Date,
  ) {
    const TOLERANCIA_MS = 30 * 60 * 1000; // 30 min

    const inicioComTolerancia = new Date(dataInicio.getTime() - TOLERANCIA_MS);
    const fimComTolerancia = new Date(dataFim.getTime() + TOLERANCIA_MS);

    const equipamentos = await Equipamento.findAll({
      attributes: ["id", "apelido", "patrimonio"],
      include: [
        {
          model: Reserva,
          as: "reservas",
          through: { attributes: [] },
          required: false, // LEFT JOIN -> mantém equipamento mesmo sem reserva
          where: {
            situacao: { [Op.notIn]: ["CANCELADA", "FINALIZADA", "FINALIZADO"] },
            reserva_inicio: { [Op.lte]: fimComTolerancia },
            reserva_fim: { [Op.gte]: inicioComTolerancia },
          },
          attributes: ["id", "reserva_inicio", "reserva_fim"],
          include: [
            {
              model: Usuario,
              as: "usuario",
              attributes: ["nome", "sobrenome"],
            },
          ],
        },
      ],
      order: [["apelido", "ASC"]],
      where: { smartlock_base_id: smartlock_id, ativo: true },
    });

    // Mapeia para o formato pedido, com "reserva" já no shape desejado
    return equipamentos;
  }

  async listByTag(tags: string[]): Promise<number[]> {
    try {
      let equipamentos = await Equipamento.findAll({
        where: { tag: { [Op.in]: tags } },
        attributes: ["id"],
      });
      return equipamentos.map((e) => e.id);
    } catch (e) {
      throw e;
    }
  }

  async listByTagWithTag(tags: string[]): Promise<{ id: number; tag: string }[]> {
    const equipamentos = await Equipamento.findAll({
      where: { tag: { [Op.in]: tags } },
      attributes: ["id", "tag"],
      raw: true,
    });
    return equipamentos.map((e: any) => ({ id: e.id, tag: e.tag }));
  }

  async getRelatorioUsuariosUsando() {
    try {
      const resultado = await Usuario.findAll({
        attributes: [
          "Usuario.id",
          [
            fn("concat", col("Usuario.nome"), " ", col("Usuario.sobrenome")),
            "nome",
          ],
          "avatar",
          "email",
          [col("unidadeLotacao.nome"), "unidade"],
          [col("unidadeLotacao.id"), "unidade_id"],
          [fn("count", col("equipamentosEmUso.id")), "qtd_equipamentos"],
        ],
        include: [
          {
            model: Equipamento,
            as: "equipamentosEmUso",
            attributes: [],
            required: true, // inner join
          },
          {
            model: Unidade,
            as: "unidadeLotacao",
            attributes: [],
            required: false,
          },
        ],
        group: [
          "Usuario.id",
          "Usuario.avatar",
          "Usuario.email",
          "unidadeLotacao.nome",
          "unidadeLotacao.id",
        ],
        raw: true,
      });
      return resultado;
    } catch (e) {
      throw e;
    }
  }

 async buscarEquipamentosEmUso(usuarioId: number): Promise<EquipamentoEmUsoDTO[]> {
    const uid = Math.trunc(Number(usuarioId));
    const equipamentos: any[] = await Equipamento.findAll({
      where: { usuario_atual_id: uid },
      attributes: [
        "id",
        "apelido",
        "tag",
        "patrimonio",
        "tipo_id",
        [Sequelize.col("tipoEquipamento.nome"), "tipo"],
        [Sequelize.col("tipoEquipamento.icone"), "icone"],
        [
          Sequelize.literal(`(
            SELECT MAX(m.timestamp)
            FROM "movimentacoes" m
            INNER JOIN "itensMovimentacao" im ON im.movimentacao_id = m.id
            WHERE im.equipamento_id = "Equipamento"."id"
              AND m.usuario_id = ${uid}
              AND m.tipo_movimento LIKE 'emprestimo%'
          )`),
          "dataRetirada",
        ],
      ],
      include: [
        {
          model: TipoEquipamento,
          as: "tipoEquipamento",
          attributes: [],
        },
      ],
      raw: true,
    });

    return equipamentos.map((eq) => ({
      id: eq.id,
      apelido: eq.apelido ?? null,
      tag: eq.tag,
      patrimonio: eq.patrimonio ?? null,
      tipo: eq.tipo ?? "",
      tipo_id: eq.tipo_id,
      icone: eq.icone ?? null,
      dataRetirada: eq.dataRetirada ?? null,
    }));
  }

  async buscarHistoricoPaginado(
    usuarioId: number,
    page: number,
    pageSize: number
  ): Promise<PaginatedResult<MovimentacaoHistoricoDTO>> {
    const offset = (page - 1) * pageSize;

    const { rows, count } = await Movimentacao.findAndCountAll({
      where: { usuario_id: usuarioId },
      include: [
        {
          model: Equipamento,
          as: 'equipamentos',
          through: { attributes: [] },
          attributes: ['id', 'apelido', 'tag', 'patrimonio', 'tipo_id'],
          include: [
            {
              model: TipoEquipamento,
              as: 'tipoEquipamento',
              attributes: ['nome', 'icone'],
            },
          ],
        },
      ],
      order: [['timestamp', 'DESC']],
      limit: pageSize,
      offset,
      distinct: true, // essencial: sem isso o count vem inflado pelo JOIN belongsToMany
    });

    const items: MovimentacaoHistoricoDTO[] = rows.map((m: any) => ({
      id: m.id,
      tipo_movimento: m.tipo_movimento,
      timestamp: m.timestamp,
      equipamentos: (m.equipamentos ?? []).map((e: any) => ({
        id: e.id,
        apelido: e.apelido ?? null,
        tag: e.tag,
        patrimonio: e.patrimonio ?? null,
        tipo: e.tipoEquipamento?.nome ?? '',
        tipo_id: e.tipo_id,
        icone: e.tipoEquipamento?.icone ?? null,
      })),
    }));

    return { items, total: count, page, pageSize };
  }
}

export default new EquipamentoService();
