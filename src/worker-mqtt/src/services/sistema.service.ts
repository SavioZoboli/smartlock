
import { getInternalHeaders, URL_API } from "../config/env";

class SistemaService {
  async enviaStatusAtual(mac: string, status: string) {
    const body = { mac, status };

    let resposta = await fetch(
      `${URL_API}/api/smartlock/setStatus`,
      {
        method: "POST",
        headers: getInternalHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!resposta.ok) {
      console.log(
        `[Sistema Service] Erro ${resposta.status} ao enviar status do SmartLock ${mac}`,
      );
      console.log(resposta);
      return;
    }
    if (resposta.status == 200) {
      console.log(
        `[Sistema Service] Status do SmartLock ${mac} alterado para ${status}`,
      );
    } else if (resposta.status == 202) {
      console.log(
        `[Sistema Service] Nenhuma ação necessária para o SmartLock ${mac}`,
      );
    }else{
        console.log(`[Sistema Service] Retorno não tratado com o status ${resposta.status}`)
    }
  }
}

export default new SistemaService();
