import { Usuario, LogUsuario } from "../models/index.model";
import smartLockService from "./smartLock.service";

class UsuarioService {
  async create(
    uid_rfid: string,
    nome: string,
    matricula: string,
    unidade_lotacao_id: number,
  ): Promise<number> {
    try {
      let usuario = await Usuario.create({
        uid_rfid,
        nome,
        matricula,
        unidade_lotacao_id,
      });
      return usuario.id;
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
        usuario_id: usuario?usuario.id:null,
      });

      return usuario?.id;
    } catch (e) {
      throw e;
    }
  }
}

export default new UsuarioService();
