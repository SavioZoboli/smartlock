class SmartlockService{

    private api_url = `${process.env.URL_API}/api/smartlock`;

    async whoami(mac:string){
        try{
            let resposta = await fetch(`${this.api_url}/whoami/${mac}`,{
                method:'GET',
                headers:{
                    "Content-Type":"application/json"
                }
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