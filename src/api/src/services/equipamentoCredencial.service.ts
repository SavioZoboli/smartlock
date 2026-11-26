import { Sequelize, Transaction, UniqueConstraintError } from "sequelize";
import sequelize from "../config/database";
import {
  Equipamento,
  EquipamentoCredencial,
  LogAcessoEqpCred,
  SmartLock,
  TipoEquipamento,
  Unidade,
} from "../models/index.model";
import {
  criptografar,
  descriptografar,
  TAMANHO_MAX_TEXTO_BYTES,
} from "../utils/crypto.utils";

export interface CredencialDTO {
  id: number;
  equipamento_id: number;
  login: string;
  possui_senha: boolean;
}

export interface CredencialListagemDTO extends CredencialDTO {
  patrimonio: string | null;
  apelido: string | null;
  tipo: string;
}

/** Indica se há senha cadastrada sem nunca selecionar o valor cifrado. */
const POSSUI_SENHA = (alias: string) =>
  [
    Sequelize.literal(`("${alias}"."senha" IS NOT NULL)`),
    "possui_senha",
  ] as [ReturnType<typeof Sequelize.literal>, string];

/**
 * O AAD amarra o ciphertext ao equipamento: um payload copiado de outra linha
 * falha na verificação do authTag do GCM.
 */
const aadDoEquipamento = (equipamento_id: number) =>
  `equipamento_credencial:${equipamento_id}`;

function validarSenha(senha: string): void {
  if (Buffer.byteLength(senha, "utf8") > TAMANHO_MAX_TEXTO_BYTES) {
    throw new Error("ERR_SENHA_MUITO_LONGA");
  }
}

class EquipamentoCredencialService {
  private async validarPermissaoAcesso(
    equipamento_id: number,
    usuario_id: number,
    is_admin: boolean,
    transaction?: Transaction,
  ): Promise<void> {
    if (is_admin) return;

    const equipamento = await Equipamento.findByPk(equipamento_id, {
      attributes: ["id", "usuario_atual_id", "ativo"],
      transaction,
    });
    if (!equipamento || !equipamento.ativo) {
      throw new Error("ERR_EQUIPAMENTO_NOT_FOUND");
    }
    if (equipamento.usuario_atual_id !== usuario_id) {
      throw new Error("ERR_SEM_PERMISSAO_CREDENCIAL");
    }
  }

  async listAll(
    regiao_id: number,
    usuario_id: number,
    is_admin: boolean,
  ): Promise<CredencialListagemDTO[]> {
    const whereEquipamento: Record<string, any> = { ativo: true };
    if (!is_admin) {
      whereEquipamento.usuario_atual_id = usuario_id;
    }

    const linhas = await EquipamentoCredencial.unscoped().findAll({
      attributes: [
        "id",
        "equipamento_id",
        "login",
        POSSUI_SENHA("EquipamentoCredencial"),
        [Sequelize.col("equipamento.patrimonio"), "patrimonio"],
        [Sequelize.col("equipamento.apelido"), "apelido"],
        [Sequelize.col("equipamento->tipoEquipamento.nome"), "tipo"],
      ],
      include: [
        {
          model: Equipamento,
          as: "equipamento",
          attributes: [],
          where: whereEquipamento,
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
              // INNER JOIN: sem isso o filtro de região vira LEFT JOIN e não restringe nada
              required: true,
              include: [
                {
                  model: Unidade,
                  as: "unidade",
                  attributes: [],
                  where: { regiao_id },
                },
              ],
            },
          ],
        },
      ],
      order: [
        [Sequelize.col("equipamento.apelido"), "asc"],
        [Sequelize.col("equipamento.patrimonio"), "asc"],
      ],
      raw: true,
    });
    return linhas as unknown as CredencialListagemDTO[];
  }

  async getByEquipamento(
    equipamento_id: number,
    usuario_id: number,
    is_admin: boolean,
  ): Promise<CredencialDTO> {
    await this.validarPermissaoAcesso(equipamento_id, usuario_id, is_admin);

    const credencial = await EquipamentoCredencial.unscoped().findOne({
      where: { equipamento_id },
      attributes: [
        "id",
        "equipamento_id",
        "login",
        POSSUI_SENHA("EquipamentoCredencial"),
      ],
      raw: true,
    });
    if (!credencial) {
      throw new Error("ERR_NOT_FOUND");
    }
    return credencial as unknown as CredencialDTO;
  }

  async create(
    equipamento_id: number,
    login: string,
    senha?: string | null,
  ): Promise<CredencialDTO> {
    const equipamento = await Equipamento.findByPk(equipamento_id, {
      attributes: ["id", "ativo", "tipo_id"],
      include: [
        {
          model: TipoEquipamento,
          as: "tipoEquipamento",
          attributes: ["has_credencial"],
        },
      ],
    });
    if (!equipamento || !equipamento.ativo) {
      throw new Error("ERR_EQUIPAMENTO_NOT_FOUND");
    }
    if (!(equipamento as any).tipoEquipamento?.has_credencial) {
      throw new Error("ERR_TIPO_SEM_CREDENCIAL");
    }

    const existente = await EquipamentoCredencial.findOne({
      where: { equipamento_id },
      attributes: ["id"],
    });
    if (existente) {
      throw new Error("ERR_DUPLICATE");
    }

    let senhaCifrada: string | null = null;
    if (senha) {
      validarSenha(senha);
      senhaCifrada = criptografar(senha, aadDoEquipamento(equipamento_id));
    }

    try {
      const criada = await EquipamentoCredencial.create({
        equipamento_id,
        login,
        senha: senhaCifrada,
      });
      return {
        id: criada.id,
        equipamento_id,
        login,
        possui_senha: senhaCifrada !== null,
      };
    } catch (e) {
      // Corrida entre a checagem acima e o insert: a constraint uq_equipamento barra.
      if (e instanceof UniqueConstraintError) {
        throw new Error("ERR_DUPLICATE");
      }
      throw e;
    }
  }

  /**
   * @param senha `undefined` mantém a senha atual; `null` remove a senha;
   *              string não vazia substitui (sempre cifrada).
   */
  async update(
    equipamento_id: number,
    login: string,
    senha?: string | null,
  ): Promise<CredencialDTO> {
    const credencial = await EquipamentoCredencial.scope("comSenha").findOne({
      where: { equipamento_id },
    });
    if (!credencial) {
      throw new Error("ERR_NOT_FOUND");
    }

    credencial.login = login;
    if (senha === null) {
      credencial.senha = null;
    } else if (typeof senha === "string" && senha.length > 0) {
      validarSenha(senha);
      credencial.senha = criptografar(senha, aadDoEquipamento(equipamento_id));
    }
    await credencial.save();

    return {
      id: credencial.id,
      equipamento_id,
      login: credencial.login,
      possui_senha: credencial.senha !== null,
    };
  }

  async delete(equipamento_id: number): Promise<void> {
    const removidas = await EquipamentoCredencial.destroy({
      where: { equipamento_id },
    });
    if (removidas === 0) {
      throw new Error("ERR_NOT_FOUND");
    }
  }

  /**
   * Descriptografa a senha e registra a auditoria em LogAcessoEqpCred.
   * A senha só é devolvida se o log for gravado com sucesso (mesma transação).
   */
  async revelarSenha(
    equipamento_id: number,
    usuario_id: number,
    is_admin: boolean,
  ): Promise<string> {
    return sequelize.transaction(async (transaction) => {
      await this.validarPermissaoAcesso(
        equipamento_id,
        usuario_id,
        is_admin,
        transaction,
      );

      const credencial = await EquipamentoCredencial.scope("comSenha").findOne({
        where: { equipamento_id },
        attributes: ["id", "equipamento_id", "senha"],
        transaction,
      });
      if (!credencial) {
        throw new Error("ERR_NOT_FOUND");
      }
      if (!credencial.senha) {
        throw new Error("ERR_SEM_SENHA");
      }

      let senha: string;
      try {
        senha = descriptografar(credencial.senha, aadDoEquipamento(equipamento_id));
      } catch (e: any) {
        if (e?.message === "ERR_MASTER_KEY_INVALIDA") throw e;
        throw new Error("ERR_FALHA_DESCRIPTOGRAFIA");
      }

      await LogAcessoEqpCred.create(
        { equipamento_id, usuario_id, timestamp: new Date() },
        { transaction },
      );

      return senha;
    });
  }
}

export default new EquipamentoCredencialService();
