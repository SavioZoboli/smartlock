//require('dotenv').config()


class SistemaService {
  async enviaStatusAtual(mac: string, status: string) {
    const body = { mac, status };

    console.log()

    let resposta = await fetch(
      `${process.env.URL_API}/api/smartlock/setStatus`,
      {
        method: "POST",
        headers:{
          "content-type":"application/json"
        },
        body: JSON.stringify(body),
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
