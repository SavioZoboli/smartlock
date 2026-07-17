#include "mqtt_handler.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "status_feedback_handler.h"
#include "storage_handler.h"
#include "auth_handler.h"
#include "display_handler.h"
#include "config.h"
#include "secrets.h"

// Variáveis encapsuladas neste escopo
namespace
{
    WiFiClient espClient;
    PubSubClient mqttClient(espClient);

    unsigned long lastMqttReconnectAttempt = 0;
    const unsigned long MQTT_RECONNECT_INTERVAL = 5000; // Tenta a cada 5 segundos

    char macStr[18];   // Armazena o MAC (ex: "AA:BB:CC:DD:EE:FF")
    char lwtTopic[64]; // Tópico de Last Will

}

void MqttHandler::init()
{
    // Pega o MAC do ESP32 formatado
    String mac = WiFi.macAddress();
    strncpy(macStr, mac.c_str(), sizeof(macStr));

    mqttClient.setServer(MQTT_HOST, MQTT_PORT);
    mqttClient.setCallback(MqttHandler::callback);

    // Constrói o tópico LWT: smartlock/system/status/[MAC]
    buildTopic(lwtTopic, sizeof(lwtTopic), "system", "status");
}

void MqttHandler::reconnect()
{
    unsigned long currentMillis = millis();
    if (currentMillis - lastMqttReconnectAttempt >= MQTT_RECONNECT_INTERVAL)
    {
        lastMqttReconnectAttempt = currentMillis;
        Serial.println("[MQTT] Tentando conectar ao Broker...");

        // Conecta enviando o LWT. Se o ESP morrer, o broker publica "offline" nesse tópico.
        if (mqttClient.connect(macStr, MQTT_USER, MQTT_PASS, lwtTopic, 1, true, "{\"status\":\"offline\"}"))
        {
            Serial.println("[MQTT] Conectado!");
            StatusFeedback::set(Component::MQTT, State::OK);

            // Publica que ficou online (Retained = true para gravar no Broker)
            mqttClient.publish(lwtTopic, "{\"status\":\"online\"}", true);

            // === ASSINATURA DE TÓPICOS ===
            char subTopic[64];

            // 1. Sincronização de Usuários
            buildTopic(subTopic, sizeof(subTopic), "usuarios", "sync_response");
            mqttClient.subscribe(subTopic);

            // 2. Sincronização de Equipamentos
            buildTopic(subTopic, sizeof(subTopic), "equipamentos", "sync_response");
            mqttClient.subscribe(subTopic);

            // 3. Resposta de Login (Caso o ESP pergunte pro banco se a UID é válida)
            buildTopic(subTopic, sizeof(subTopic), "usuarios", "login_response");
            mqttClient.subscribe(subTopic);

            Serial.println("[MQTT] Tópicos assinados com sucesso.");

            MqttHandler::publish("usuarios", "sync_request", "{}");
        }
        else
        {
            Serial.printf("[MQTT] Falha na conexão. Erro: %d\n", mqttClient.state());
        }
    }
}

void MqttHandler::update()
{
    // Se o WiFi estiver offline, nem tenta conectar no MQTT
    if (WiFi.status() != WL_CONNECTED)
    {
        StatusFeedback::set(Component::MQTT, State::OFF);
        return;
    }

    if (!mqttClient.connected())
    {
        StatusFeedback::set(Component::MQTT, State::ERROR); // Pisca indicando desconexão
        MqttHandler::reconnect();
    }
    else
    {
        // Se estiver conectado, o método loop() mantém o ping-pong e checa o buffer
        mqttClient.loop();
        StatusFeedback::set(Component::MQTT, State::OK);
    }
}

bool MqttHandler::publish(const char *module, const char *action, const char *payload)
{
    if (!mqttClient.connected())
    {
        Serial.println("[MQTT] Erro ao publicar: Broker desconectado. (Os dados deveriam ir para Flash aqui!)");
        // Futuro: Se falhar aqui, você salva na Preferences (Flash) e o StatusFeedback vai para DIRTY_OFFLINE
        return false;
    }

    char pubTopic[64];
    buildTopic(pubTopic, sizeof(pubTopic), module, action);
    mqttClient.publish(pubTopic, payload);
    Serial.printf("[MQTT] Publicado em %s: %s\n", pubTopic, payload);
    return true;
}

void MqttHandler::callback(char *topic, byte *payload, unsigned int length)
{
    // Converte o payload de bytes para uma string C limpa
    char message[length + 1];
    memcpy(message, payload, length);
    message[length] = '\0';

    Serial.printf("[MQTT] Mensagem recebida no tópico [%s]\n", topic);

    // ==========================================
    // MONTAGEM DINÂMICA DOS TÓPICOS ESPERADOS
    // (Garante que só processaremos dados destinados ao NOSSO MAC)
    // ==========================================
    char topicLoginResponse[64];
    char topicUserSync[64];
    char topicEquipSync[64];

    buildTopic(topicLoginResponse, sizeof(topicLoginResponse), "usuarios", "login_response");
    buildTopic(topicUserSync, sizeof(topicUserSync), "usuarios", "sync_response");
    buildTopic(topicEquipSync, sizeof(topicEquipSync), "equipamentos", "sync_response");

    // ==========================================
    // ROTA 1: RESPOSTA DE LOGIN (Comparação Exata)
    // ==========================================
    if (strcmp(topic, topicLoginResponse) == 0)
    {

        // Aloca 256 bytes na Stack (super rápido, não fragmenta a RAM)
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, message);

        if (error)
        {
            Serial.print(F("[MQTT] Erro de parse no login: "));
            Serial.println(error.f_str());
            return;
        }

        // Extrai os dados seguindo o contrato esperado do Node-RED
        const char *uid = doc["uuid"];
        bool isAuthorized = doc["authorized"];

        Serial.print("O usuário ");
        Serial.print(uid);
        Serial.print(" está ");
        Serial.print(isAuthorized?"autorizado":"não autorizado");

        if (uid != nullptr)
        {
            AuthHandler::processCloudResponse(uid, isAuthorized);
        }
    }

    // ==========================================
    // ROTA 2: SINCRONIZAÇÃO EM LOTE DE USUÁRIOS
    // ==========================================
    else if (strcmp(topic, topicUserSync) == 0)
    {

        // Aloca até 2048 bytes no Heap (suporta arrays maiores)
        DynamicJsonDocument doc(2048);
        DeserializationError error = deserializeJson(doc, message);

        if (error)
        {
            Serial.print(F("[MQTT] Erro de parse na sync: "));
            Serial.println(error.f_str());
            return;
        }

        // O Node-RED deve enviar: {"usuarios": [{"uid":"A1B2", "autorizado":true}, ...]}
        JsonArray users = doc["usuarios"].as<JsonArray>();
        for (JsonObject user : users)
        {
            const char *uid = user["uuid"];

            Serial.print("Salvando usuário com uuid: ");
            Serial.println(uid);

            if (uid != nullptr)
            {
                StorageHandler::saveUserAccess(uid);
            }
        }
        Serial.println("[MQTT] Banco de dados offline atualizado via Nuvem!");
    }

    // ==========================================
    // ROTA 3: ACK DE INVENTÁRIO
    // ==========================================
    else if (strcmp(topic, topicEquipSync) == 0)
    {
        // Se a nuvem acusar recebimento, o ESP32 sabe que o dado do R200 chegou a salvo.
        Serial.println("[MQTT] Confirmação (ACK) de inventário recebida.");
        DisplayHandler::setTimeoutMessage("AUDITORIA", "Nuvem\nSincronizada", 3000);
    }
}

// Monta as strings de tópico sem usar a classe String do Arduino (Evita fragmentação de heap)
void MqttHandler::buildTopic(char *buffer, size_t maxLen, const char *module, const char *action)
{
    snprintf(buffer, maxLen, "smartlock/%s/%s/%s", module, action, macStr);
}

bool MqttHandler::isConnected()
{
    return mqttClient.connected();
}