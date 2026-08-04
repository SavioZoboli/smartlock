import { Regiao, Unidade, Usuario } from "../models/index.model";

class RegiaoService {
  async listAll() {
    try {
      let regionais = Regiao.findAll();
      return regionais;
    } catch (e) {
      throw e;
    }
  }

  async getRegiaoDoUsuario(usuario_id: number): Promise<number> {
    try {
      let regiao = await Regiao.findOne({
        attributes: ["id"],
        include: [
          {
            model: Unidade,
            as: "unidade",
            required: true,
            attributes: [],
            include: [
              {
                model: Usuario,
                as: "usuarios",
                required: true,
                where: { id: usuario_id },
                attributes: [],
              },
            ],
          },
        ],
      });
      if(!regiao){
        throw new Error("REGIAO_NAO_VINCULADA")
      }
      return regiao.id
    } catch (e) {
      throw e;
    }
  }
}

export default new RegiaoService();
