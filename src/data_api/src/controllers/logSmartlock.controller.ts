import LogSmartlockService from "../services/logSmartLock.service";

class LogSmartlockController {

    async gravarLog(mac:string,status:string){
        if(!mac || !status){
            console.log("[LogSmartLock Controller] MAC ou status indefinidos")
            console.log(`MAC: ${mac}`)
            console.log(`Status: ${status}`)
            return;
        }
        try{
            await LogSmartlockService.gravarLog(mac,status)
        }catch(e){
            console.log("[LogSmartLock Controller] Erro ao processar requisição")
            console.error(e)
        }
    }


}

export default new LogSmartlockController();