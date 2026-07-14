import { Sequelize } from "sequelize";
import { Usuario, LogUsuario, Unidade } from "../models/index.model";
import Smartlock from "../models/smartlock.model";
import smartLockService from "./smartLock.service";

class UsuarioService {
  async create(
    uid_rfid: string,
    nome: string,
    sobrenome: string,
    matricula: string,
    unidade_lotacao_id: number,
    email: string,
    avatar:string|null = null
  ): Promise<Usuario> {
    try {
      let usuario = await Usuario.create({
        uid_rfid,
        nome,
        sobrenome,
        matricula,
        unidade_lotacao_id,
        email,
        avatar,
        role:"USER"
      });
      return usuario;
    } catch (e) {
      throw e;
    }
  }

  async login(mac_address: string, uuid: string): Promise<number | undefined> {
    try {
      let usuario = await Usuario.findOne({
        where: { uid_rfid: uuid, ativo: true },
        attributes: ["id"],
      });

      let smartlock = await smartLockService.getSmartlockByMac(mac_address);

      if (!smartlock) {
        throw new Error("Smartlock não foi encontrado");
      }

      await LogUsuario.create({
        uid_lido: uuid,
        smartlock_id: smartlock.id,
        operacao: "Login",
        usuario_id: usuario ? usuario.id : null,
      });

      return usuario?.id;
    } catch (e) {
      throw e;
    }
  }

  async getUsersSmartlock(mac: string): Promise<Usuario[]> {
    try {
      const smartlock: Smartlock =
        await smartLockService.getSmartlockByMac(mac);
      if (!smartlock) {
        throw new Error("SMARTLOCK_NOT_FOUND");
      }
      let usuarios = await Usuario.findAll({
        where: { unidade_lotacao_id: smartlock.unidade_id, ativo: true },
        attributes: [["uid_rfid", "uuid"], "nome"],
        raw: true,
      });
      return usuarios;
    } catch (e) {
      throw e;
    }
  }

  async getUserByEmail(email: string): Promise<Usuario | null> {
    try {
      let usuario = await Usuario.findOne({
        where: { email, ativo: true },
      });
      return usuario;
    } catch (e) {
      throw e;
    }
  }

  async listAll(): Promise<Usuario[]> {
    try {
      let usuarios = await Usuario.findAll({
        where: { ativo: true },
        attributes: [
          "id",
          "nome",
          "sobrenome",
          "email",
          "avatar",
          [Sequelize.col("unidadeLotacao.nome"), "unidade"],
          [Sequelize.col("unidadeLotacao.regional"), "regional"],
        ],
        include: [
          {
            model: Unidade,
            as: "unidadeLotacao",
            attributes: [], // Array vazio para não gerar um objeto "unidadeLotacao" aninhado extra
          },
        ],
        raw: true,
      });
      return usuarios;
    } catch (e) {
      throw e;
    }
  }

  async getById(id: number): Promise<Usuario | null> {
    try {
      let usuario = await Usuario.findByPk(id, {
        attributes: [
          "id",
          "nome",
          "sobrenome",
          "matricula",
          "email",
          ["unidade_lotacao_id", "unidade_id"],
          ["uid_rfid", "uuid"],
        ],
        raw: true,
      });
      return usuario;
    } catch (e) {
      throw e;
    }
  }

  async update(
    id: number,
    nome: string,
    sobrenome: string,
    email: string,
    uuid: string,
    matricula: string,
    unidade_id: number,
  ): Promise<Usuario> {
    try {
      let usuario = await Usuario.findByPk(id);

      if (!usuario) {
        throw new Error("USER_NOT_FOUND");
      }

      usuario.nome = nome;
      usuario.sobrenome = sobrenome;
      usuario.email = email;
      usuario.uid_rfid = uuid;
      usuario.matricula = matricula;
      usuario.unidade_lotacao_id = unidade_id;

      await usuario.save();
      return usuario;
    } catch (e) {
      throw e;
    }
  }

  async deactivate(id: number): Promise<void> {
    try {
      let usuario = await Usuario.findByPk(id);
      if (!usuario) throw new Error("USER_NOT_FOUND");
      usuario.ativo = false;
      await usuario.save();
    } catch (e) {
      throw e;
    }
  }

  async updateAvatar(id:number,avatar:string):Promise<Usuario>{
    try{
      let usuario = await Usuario.findByPk(id)
      if(!usuario) throw new Error("USER_NOT_FOUND")
      usuario.avatar = avatar
      await usuario.save()

      return usuario;

    }catch(e){
      throw e;
    }
  }


}

export default new UsuarioService();
