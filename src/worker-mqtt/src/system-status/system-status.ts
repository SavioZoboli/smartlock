import { mqttClient } from "../config/mqtt";
import { getInternalHeaders, URL_API } from "../config/env";


class SystemStatus{
    private need_heartbeat = true;
    private api_url = `${URL_API}/api/status/mqtt`;

    private next_heartbeat_in:number = 15000;
    private timerId: NodeJS.Timeout | null = null;

    public async polling(){
        if(!this.need_heartbeat){
            return;
        }

        await this.sendHeartbeat();

        if(!this.need_heartbeat){
            return;
        }

        this.timerId = setTimeout(()=>{
            this.polling();
        },this.next_heartbeat_in);
    }

    public stop(){
        this.need_heartbeat = false;
        if(this.timerId){
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    private async sendHeartbeat(){
        try{
            let broker_status:string = mqttClient.connected?'online':'offline'
            this.next_heartbeat_in = mqttClient.connected?15000:1000
            let response = await fetch(this.api_url,{
                method:'POST',
                body:JSON.stringify({
                    worker:'online',
                    broker:broker_status
                }),
                headers:getInternalHeaders(),
                signal: AbortSignal.timeout(10000),
            })
            if(response.status != 200){
                throw new Error(`API_UNREACHABLE (${response.status})`)
            }
            
        }catch(e){
            console.error(e)
        }
    }
}

export default new SystemStatus()