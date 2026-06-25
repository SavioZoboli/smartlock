import LogSmartlockController from "../controllers/logSmartlock.controller";

export const roteiaMqttSistema = async(rota:string,mac:string,payload:any)=>{

    console.log(`A rota ${rota} foi publicada pelo mac ${mac} com o payload ${payload.status}`)

    switch (rota){
        case 'status':
            await LogSmartlockController.gravarLog(mac,payload.status)
            break;
    }

}