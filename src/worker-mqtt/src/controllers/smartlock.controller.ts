import { mqttClient } from "../config/mqtt";
import smartlockService from "../services/smartlock.service";

class SmartlockController {
  private mqtt_base_topic = "smartlock/system";

  async whoami(mac: string) {
    if (!mac) {
      mqttClient.publish(
        `${this.mqtt_base_topic}/youare/${mac}`,
        JSON.stringify({ status: "invalid" }),
      );
      return;
    }
    try {
      let me = await smartlockService.whoami(mac);
      let status = me.uni_id?"criado":"autenticado";
      let payload = JSON.stringify({ status, me });
      console.log(payload)
      mqttClient.publish(`${this.mqtt_base_topic}/youare/${mac}`, payload);
    } catch (e) {
      console.error(e);
      mqttClient.publish(
        `${this.mqtt_base_topic}/youare/${mac}`,
        JSON.stringify("error"),
      );
    }
  }
}

export default new SmartlockController();
