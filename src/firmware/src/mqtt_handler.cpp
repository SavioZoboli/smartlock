#include "mqtt_handler.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "status_feedback_handler.h"
#include "storage_handler.h"
#include "auth_handler.h"
#include "display_handler.h"
#include "config.h"
#include "secrets.h"
#include "certs.h"
#include "time_handler.h"
#include "wifi_handler.h"
#include "system.h"

// Variáveis encapsuladas neste escopo
namespace
{
    WiFiClientSecure espClient;
    PubSubClient mqttClient(espClient);

    unsigned long lastMqttReconnectAttempt = 0;
    const unsigned long MQTT_RECONNECT_INTERVAL = 5000; // Tenta a cada 5 segundos

    char macStr[18];   // Armazena o MAC (ex: "AA:BB:CC:DD:EE:FF")
    char lwtTopic[96]; // Tópico de Last Will

}

void MqttHandler::init()
{
    // Pega o MAC do ESP32 formatado
    String mac = WiFi.macAddress();
    strncpy(macStr, mac.c_str(), sizeof(macStr));

#ifdef MQTT_TLS_INSECURE
    espClient.setInsecure();
#else
    espClient.setCACert(root_ca);
#endif

    mqttClient.setBufferSize(1024);

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
            char subTopic[96];

            // 1. Sincronização de Usuários
            buildTopic(subTopic, sizeof(subTopic), "usuarios", "sync_response");
            mqttClient.subscribe(subTopic);

            // 2. Sincronização de Equipamentos
            buildTopic(subTopic, sizeof(subTopic), "equipamentos", "sync_response");
            mqttClient.subscribe(subTopic);

            // 3. Resposta de Login (Caso o ESP pergunte pro banco se a UID é válida)
            buildTopic(subTopic, sizeof(subTopic), "usuarios", "login_response");
            mqttClient.subscribe(subTopic);

            // 4. Resposta de quem você é
            buildTopic(subTopic, sizeof(subTopic), "system", "youare");
            mqttClient.subscribe(subTopic);

            Serial.println("[MQTT] Tópicos assinados com sucesso.");

            if (MqttHandler::publish("usuarios", "sync_request", "{}"))
            {
                System::setSyncing(true);
            }
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
    if (!WiFiHandler::isConnected())
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
        Serial.println("[MQTT] Erro ao publicar: Broker desconectado.");
        // Futuro: Se falhar aqui, você salva na Preferences (Flash) e o StatusFeedback vai para DIRTY_OFFLINE
        return false;
    }

    char pubTopic[96];
    buildTopic(pubTopic, sizeof(pubTopic), module, action);
    bool publicado = mqttClient.publish(pubTopic, payload);
    if (publicado)
    {
        Serial.printf("[MQTT] Publicado em %s: %s\n", pubTopic, payload);
    }
    else
    {
        Serial.printf("[MQTT] Falha ao publicar em %s (tamanho: %u bytes)\n", pubTopic, strlen(payload));
    }
    return publicado;
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
    char topicLoginResponse[96];
    char topicUserSync[96];
    char topicEquipSync[96];
    char topicIdentity[96];

    buildTopic(topicLoginResponse, sizeof(topicLoginResponse), "usuarios", "login_response");
    buildTopic(topicUserSync, sizeof(topicUserSync), "usuarios", "sync_response");
    buildTopic(topicEquipSync, sizeof(topicEquipSync), "equipamentos", "sync_response");
    buildTopic(topicIdentity, sizeof(topicIdentity), "system", "youare");
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
        bool isAuthorized = doc["authorized"] | false;

        if (uid == nullptr)
        {
            Serial.println("[MQTT] Resposta de login sem campo 'uuid'.");
            return;
        }

        Serial.print("O usuário ");
        Serial.print(uid);
        Serial.print(" está ");
        Serial.println(isAuthorized ? "autorizado" : "não autorizado");

        AuthHandler::processCloudResponse(uid, isAuthorized);
    }

    // ==========================================
    // ROTA 2: SINCRONIZAÇÃO EM LOTE DE USUÁRIOS
    // ==========================================
    else if (strcmp(topic, topicUserSync) == 0)
    {
        System::setSyncing(false);

        // Aloca até 2048 bytes no Heap (suporta arrays maiores)
        DynamicJsonDocument doc(2048);
        DeserializationError error = deserializeJson(doc, message);

        if (error)
        {
            Serial.print(F("[MQTT] Erro de parse na sync: "));
            Serial.println(error.f_str());
            return;
        }

        if (!doc["usuarios"].is<JsonArray>())
        {
            Serial.println(F("[MQTT] Payload de sync sem array 'usuarios' válido. Cache mantido."));
            return;
        }

        // Limpa cache anterior antes de gravar a lista atualizada da unidade
        StorageHandler::clearUsers();

        JsonArray users = doc["usuarios"].as<JsonArray>();
        for (JsonObject user : users)
        {
            const char *uid = user["uuid"];

            if (uid != nullptr)
            {
                Serial.print("Salvando usuário com uuid: ");
                Serial.println(uid);
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

    // ==========================================
    // ROTA 4: IDENTIDADE DO DISPOSITIVO
    // ==========================================
    else if (strcmp(topic, topicIdentity) == 0)
    {
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, message);
        if (error)
        {
            Serial.print(F("[MQTT] Erro de parse na identidade: "));
            Serial.println(error.f_str());
            return;
        }

        JsonObject info = doc["me"]["smartlock_info"].is<JsonObject>()
                              ? doc["me"]["smartlock_info"].as<JsonObject>()
                              : doc["me"].as<JsonObject>();
        if (info.isNull()) return;

        int codigo = info["id"] | 0;
        String apelido = info["apelido"] | "";
        int codUnidade = info["uni_id"] | 0;
        String nomeUnidade = info["uni_nome"] | "";

        // Se o servidor não reconhece o provisionamento (sem unidade vinculada ou sem apelido),
        // invalida a configuração local antiga e força o modo PROVISIONANDO.
        if (codigo <= 0 || codUnidade <= 0 || apelido.length() == 0)
        {
            if (System::getState() != SystemState::PROVISIONANDO)
            {
                System::invalidarProvisionamento();
            }
            return;
        }

        // Decide qual função chamar baseado no que o sistema está fazendo agora
        if (System::getState() == SystemState::PROVISIONANDO)
        {
            System::salvarConfiguracao(codigo, apelido, codUnidade, nomeUnidade);
        }
        else
        {
            System::atualizarConfiguracao(codigo, apelido, codUnidade, nomeUnidade);
        }
    }
}

// Monta as strings de tópico sem usar a classe String do Arduino (Evita fragmentação de heap)
void MqttHandler::buildTopic(char *buffer, size_t maxLen, const char *module, const char *action)
{
    snprintf(buffer, maxLen, "%s/%s/%s/%s", MQTT_PREFIX, module, action, macStr);
}

bool MqttHandler::isConnected()
{
    return mqttClient.connected();
}