import { mqttClient } from "../config/mqtt";


class SystemStatus{
    private need_heartbeat = true;
    private api_url = `${process.env.URL_API}/api/status/mqtt`

    private next_heartbeat_in:number = 15000;

    public polling(){
        this.sendHeartbeat()
        setTimeout(()=>{
            if(!this.need_heartbeat){
                return;
            }

            this.sendHeartbeat()
            this.polling()
        },this.next_heartbeat_in)
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
                headers:{'Content-Type':'application/json'}
            })
            if(response.status != 200){
                throw new Error("API_UNREACHABLE")
                return;
            }
            
        }catch(e){
            console.error(e)
        }
    }
}

export default new SystemStatus()