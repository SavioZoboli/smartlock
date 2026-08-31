import equipamentosController from "../controllers/equipamentos.controller";

export const roteiaMqttEquipamentos = async(rota:string,mac:string,payload:any)=>{

    console.log(`A rota ${rota} foi publicada pelo mac ${mac} com o payload ${payload}`)

    switch (rota){
        case 'sync_events':
            await equipamentosController.syncEvents(mac,payload)
            break;
        case 'my_equipments':
            await equipamentosController.getMyEquipments(mac);
    }

}