import mqtt from "mqtt";
import { rotearMensagemMQTT } from "../topic/mqtt.topic";
import fs from "fs";
import path from "path";

require('dotenv').config();

// Avalia as configurações de conexão
const brokerHost = process.env.MQTT_BROKER || "localhost";
const brokerPort = process.env.MQTT_PORT || 1883;
const brokerProtocol = process.env.MQTT_PROTOCOL || "mqtt";
const username = process.env.MQTT_USER || "";
const password = process.env.MQTT_PASS || "";

// Monta a URL (ex: mqtt://localhost:1883 ou mqtts://iot.dominio.com:8883)
const brokerUrl = `${brokerProtocol}://${brokerHost}:${brokerPort}`;

console.log(`[MQTT] Inicializando conexão ao broker em: ${brokerUrl}`);

// Opções base (comuns para MQTT e MQTTS)
const options:any = {
  username,
  password,
  reconnectPeriod: 5000,
};

// Injeta o certificado APENAS se o protocolo for seguro
if (brokerProtocol === "mqtts" || brokerProtocol === "ssl") {
  try {
    // __dirname garante que ele acha o arquivo não importa de onde você rode o script
    const caPath = path.resolve(__dirname, "../../ca.crt"); 
    options.ca = fs.readFileSync(caPath);
    console.log("[MQTT] Certificado CA carregado com sucesso para conexão TLS.");
    
    // DESCOMENTE A LINHA ABAIXO APENAS PARA TESTE LOCAL SE OCORRER ERRO DE HOSTNAME
    // options.rejectUnauthorized = false; 

  } catch (error:any) {
    console.error("[MQTT] Erro fatal: Não foi possível ler o arquivo ca.crt. Verifique o caminho.", error.message);
    process.exit(1); // Derruba o Worker se não achar o certificado exigido
  }
}

// Estabelece a conexão com o broker
export const mqttClient = mqtt.connect(brokerUrl, options);

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

// Processa as mensagens recebidas
mqttClient.on("message", (topic, message) => {
  try {
    const payloadTexto = message.toString();
    const payloadObject = JSON.parse(payloadTexto);
    rotearMensagemMQTT(topic, payloadObject);
  } catch (error) {
    console.error(
      `[MQTT] Erro ao processar mensagem no tópico ${topic}: Payload não é um JSON válido.`,
      error
    );
  }
});

// Captura e exibe falhas de conexão
mqttClient.on("error", (err) => {
  console.error("[MQTT] Erro crítico no cliente MQTT:", err.message);
});

// Monitora tentativas de reconexão
mqttClient.on("reconnect", () => {
  console.log("[MQTT] Tentando reconectar ao Broker...");
});

// Informa quando o cliente perde o acesso à rede ou ao broker
mqttClient.on("offline", () => {
  console.warn("[MQTT] O cliente MQTT está offline");
});