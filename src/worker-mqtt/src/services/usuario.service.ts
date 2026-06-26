import { mqttClient } from "../config/mqtt";

class UsuarioService{

    private base_url = 'smartlock/usuarios'

    async loginRequest(mac:string,uuid:string){
        console.log("[Usuario Service] Requisição enviada")
        let resposta = await fetch(`${process.env.URL_API}/api/usuario/login`,{
            method:'POST',
            headers:{
                'content-type':'application/json'
            },
            body:JSON.stringify({mac,uuid})
        })

        console.log("[Usuario Service] Resposta recebida")

        if(!resposta.ok && resposta.status != 401){
            console.log("[Usuário Service] Erro ao processar requisição")
            console.log(resposta)
            return;
        }

        console.log(`[Usuario Service] Publicando authorized:${resposta.status == 200} no tópico ${this.base_url}/login_response/${mac}`)
        mqttClient.publish(`${this.base_url}/login_response/${mac}`,JSON.stringify({authorized:resposta.status == 200,uuid}))


    }
}

export default new UsuarioService()