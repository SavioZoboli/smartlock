import { mqttClient } from "../config/mqtt";
import { getInternalHeaders, MQTT_PREFIX, URL_API } from "../config/env";

class UsuarioService{

    private base_url = `${MQTT_PREFIX}/usuarios`

    async loginRequest(mac:string,uuid:string){
        try{
            let resposta = await fetch(`${URL_API}/api/usuario/login`,{
                method:'POST',
                headers:getInternalHeaders(),
                body:JSON.stringify({mac,uuid}),
                signal: AbortSignal.timeout(10000),
            })
            if(!resposta.ok && resposta.status != 401){
                console.log("[Usuário Service] Erro ao processar requisição")
                console.log(resposta)
                return;
            }

            mqttClient.publish(`${this.base_url}/login_response/${mac}`,JSON.stringify({authorized:resposta.status == 200,uuid}))
        }catch(e){
            console.error("[Usuário Service] Falha na requisição de login:", e);
        }
    }

    async syncList(mac:string){
        try{
            let resposta = await fetch(`${URL_API}/api/usuario/smartlock/${mac}`,{
                method:"GET",
                headers:getInternalHeaders(),
                signal: AbortSignal.timeout(10000),
            })

            if(!resposta.ok){
                console.log("[Usuário Service] Erro ao processar lista de usuários")
                console.log(resposta)
                return;
            }

            let body = await resposta.json()
            console.log(body);
            mqttClient.publish(`${this.base_url}/sync_response/${mac}`,JSON.stringify(body))
        }catch(e){
            console.error("[Usuário Service] Falha ao sincronizar lista de usuários:", e);
        }
    }
}

export default new UsuarioService()