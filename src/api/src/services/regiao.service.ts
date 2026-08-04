import {Regiao} from '../models/index.model'

class RegiaoService {
  async listAll() {
    try {
        let regionais = Regiao.findAll()
        return regionais
    } catch (e) {
        throw e
    }
  }
}

export default new RegiaoService();
