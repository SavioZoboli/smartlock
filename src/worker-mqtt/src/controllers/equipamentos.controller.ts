import equipamentosService from "../services/equipamentos.service";

export interface Events{
    epc:string;
    tipo:string;
}

export interface PayloadSyncEvents{
    usuario?:string;
    eventos:Events[],
    timestamp:number;
}


class EquipamentosController{

    async syncEvents(mac:string,payload:PayloadSyncEvents){
        let {usuario,eventos,timestamp} = payload;
        if(!usuario){
            usuario = "DESCONHECIDO";
        }
        if(!timestamp){
            timestamp = (new Date()).getTime();
        }
        if(eventos.length==0){
            console.error("Nenhum evento foi lançado")
            return;
        }
        try{
            await equipamentosService.syncEvents(mac,eventos,usuario,timestamp)
        }catch(e){
            console.log(e)
        }
    }

    async getMyEquipments(mac:string){

    }


}

export default new EquipamentosController();