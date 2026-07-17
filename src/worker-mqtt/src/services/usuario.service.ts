import { mqttClient } from "../config/mqtt";

class UsuarioService{

    private base_url = 'smartlock/usuarios'

    async loginRequest(mac:string,uuid:string){
        let resposta = await fetch(`${process.env.URL_API}/api/usuario/login`,{
            method:'POST',
            headers:{
                'content-type':'application/json'
            },
            body:JSON.stringify({mac,uuid})
        })
        if(!resposta.ok && resposta.status != 401){
            console.log("[Usuário Service] Erro ao processar requisição")
            console.log(resposta)
            return;
        }

        mqttClient.publish(`${this.base_url}/login_response/${mac}`,JSON.stringify({authorized:resposta.status == 200,uuid}))


    }

    async syncList(mac:string){
        let resposta = await fetch(`${process.env.URL_API}/api/usuario/${mac}`,{
            method:"GET",
            headers:{"content-type":"application/json"},
        })

        if(!resposta.ok){
            console.log("[Usuário Service] Erro ao processar lista de usuários")
            console.log(resposta)
            return;
        }

        let body = await resposta.json()
        console.log(body);
        mqttClient.publish(`${this.base_url}/sync_response/${mac}`,JSON.stringify(body))
    }
}

export default new UsuarioService()