import { mqttClient } from "../config/mqtt";
import { getInternalHeaders, MQTT_PREFIX, URL_API } from "../config/env";
import { Events } from "../controllers/equipamentos.controller";

class EquipamentoService{

    private base_url = `${MQTT_PREFIX}/equipamentos`

    async syncEvents(mac:string,events:Events[],usuario:string,timestamp:number){
        try{
            let resposta = await fetch(
          `${URL_API}/api/movimentacao/${mac}`,
          {
            method: "POST",
            headers:getInternalHeaders(),
            body: JSON.stringify({events,usuario,timestamp}),
            signal: AbortSignal.timeout(10000),
          },
        );

        if(!resposta.ok){
            console.error(`[EquipamentoService] Erro HTTP ${resposta.status} ao sincronizar eventos de ${mac}`);
            mqttClient.publish(`${this.base_url}/sync_response/${mac}`,JSON.stringify({sincronizado:false}))
            return
        }

        let retorno = await resposta.json()

        console.log(retorno)

        mqttClient.publish(`${this.base_url}/sync_response/${mac}`,JSON.stringify({sincronizado:resposta.status==200}))
        }catch(e){
            console.error(`[EquipamentoService] Falha ao sincronizar eventos de ${mac}:`, e);
            mqttClient.publish(`${this.base_url}/sync_response/${mac}`,JSON.stringify({sincronizado:false}))
        }
    }

}

export default new EquipamentoService()