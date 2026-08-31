import { mqttClient } from "../config/mqtt";
import { Events } from "../controllers/equipamentos.controller";

class EquipamentoService{

    private base_url = 'smartlock/equipamentos'

    async syncEvents(mac:string,events:Events[],usuario:string,timestamp:number){
        let resposta = await fetch(
      `${process.env.URL_API}/api/movimentacao/${mac}`,
      {
        method: "POST",
        headers:{
          "content-type":"application/json"
        },
        body: JSON.stringify({events,usuario,timestamp}),
      },
    );

    if(!resposta.ok){
        console.log("Houve algum erro")
        console.log(resposta)
        return
    }

    let retorno = await resposta.json()

    console.log(retorno)

    mqttClient.publish(`${this.base_url}/sync_response/${mac}`,JSON.stringify({sincronizado:resposta.status==200}))


    }

}

export default new EquipamentoService()