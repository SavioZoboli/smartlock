import { getInternalHeaders, URL_API } from "../config/env";

class SmartlockService{

    private api_url = `${URL_API}/api/smartlock`;

    async whoami(mac:string){
        try{
            let resposta = await fetch(`${this.api_url}/whoami/${mac}`,{
                method:'GET',
                headers:getInternalHeaders(),
                signal: AbortSignal.timeout(10000),
            })
            if(!resposta.ok){
                throw new Error(`ERRO AO PROCESSAR REQUISIÇÃO: ${resposta.status}`)
            }
            let dados = await resposta.json()

            return dados;

        }catch(e){
            throw e;
        }
    }
}

export default new SmartlockService();