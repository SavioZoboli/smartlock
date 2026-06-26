import mqtt from "mqtt";
import { rotearMensagemMQTT } from "../topic/mqtt.topic";

require('dotenv').config()

// Avalia as configurações de conexão apenas no momento da execução
const brokerHost = process.env.MQTT_BROKER || "localhost";
const brokerPort = process.env.MQTT_PORT || 1883;
const brokerUrl = `mqtt://${brokerHost}:${brokerPort}`;
const username = process.env.MQTT_USER || "";
const password = process.env.MQTT_PASS || "";

console.log(`[MQTT] Inicializando conexão ao MQTT em: ${brokerUrl}`);

// Estabelece a conexão com o broker aplicando tentativas de reconexão
export const mqttClient = mqtt.connect(brokerUrl, {
  username,
  password,
  reconnectPeriod: 5000,
});

// Confirma a conexão bem-sucedida e assina os tópicos base
mqttClient.on("connect", () => {
  console.log("[MQTT] Conectado ao Broker MQTT com sucesso!");

  mqttClient.subscribe("smartlock/#", (err) => {
    if (err) {
      console.error("[MQTT] Erro ao assinar os tópicos MQTT", err);
    } else {
      console.log("[MQTT] Escutando tópicos da família smartlock/#");
    }
  });
});

// Processa as mensagens recebidas e encaminha para a camada de rotas
mqttClient.on("message", (topic, message) => {
  try {
    const payloadTexto = message.toString();
    const payloadObject = JSON.parse(payloadTexto);
    rotearMensagemMQTT(topic, payloadObject);
  } catch (error) {
    console.error(
      `[MQTT] Erro ao processar mensagem no tópico ${topic}: Payload não é um JSON válido.`,
      error,
    );
  }
});

// Captura e exibe falhas de conexão para facilitar o debug
mqttClient.on("error", (err) => {
  console.error("[MQTT] Erro crítico no cliente MQTT:", err.message);
  console.error(err)
});

// Monitora tentativas de reconexão
mqttClient.on("reconnect", () => {
  console.log("[MQTT] Tentando reconectar ao Broker...");
});

// Informa quando o cliente perde o acesso à rede ou ao broker
mqttClient.on("offline", () => {
  console.warn("[MQTT] O cliente MQTT está offline");
});

//module.exports = mqttClient;
