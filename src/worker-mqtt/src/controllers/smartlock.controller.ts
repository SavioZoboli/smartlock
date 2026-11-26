import { mqttClient } from "../config/mqtt";
import { MQTT_PREFIX } from "../config/env";
import smartlockService from "../services/smartlock.service";
import { removerAcentos } from "../utils/sanitizarTexto.util";

class SmartlockController {
  private mqtt_base_topic = `${MQTT_PREFIX}/system`;

  async whoami(mac: string) {
    if (!mac) {
      console.warn("[SmartlockController] whoami chamado sem MAC válido.");
      return;
    }
    try {
      const resposta = await smartlockService.whoami(mac);
      const rawMe = resposta?.smartlock_info ?? resposta;
      const me = rawMe
        ? {
            ...rawMe,
            apelido: removerAcentos(rawMe.apelido),
            uni_nome: removerAcentos(rawMe.uni_nome),
          }
        : rawMe;
      const status = me?.uni_id ? "criado" : "autenticado";
      const payload = JSON.stringify({ status, me });
      console.log(payload);
      mqttClient.publish(`${this.mqtt_base_topic}/youare/${mac}`, payload);
    } catch (e) {
      console.error(e);
      mqttClient.publish(
        `${this.mqtt_base_topic}/youare/${mac}`,
        JSON.stringify({ status: "error" }),
      );
    }
  }
}

export default new SmartlockController();
