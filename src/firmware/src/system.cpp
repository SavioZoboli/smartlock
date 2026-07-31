#include "system.h"
#include <LittleFS.h>
#include <ArduinoJson.h>
#include "display_handler.h"
#include "mqtt_handler.h"
#include <WiFi.h>
#include "wifi_handler.h"

int System::_codigo = 0;
String System::_apelido = "";
bool System::_wifi_online = false;
bool System::_mqtt_online = false;
SystemState System::_estadoAtual = SystemState::INITIALIZING;
Unidade System::_unidade = {0, ""};
bool System::_is_provisionado = false;

const char *CONFIG_FILE = "/config.json";
bool solicitou_provisao = false;

void System::init()
{
    setState(SystemState::INITIALIZING);

    if (!LittleFS.begin(true))
    {
        Serial.println("Erro ao montar o LittleFS");
        iniciarProvisionamento();
        return;
    }

    if (!LittleFS.exists(CONFIG_FILE))
    {
        Serial.println("Arquivo não encontrado. Smartlock sem configuração.");
        iniciarProvisionamento();
        return;
    }

    File file = LittleFS.open(CONFIG_FILE, "r");
    if (!file)
    {
        iniciarProvisionamento();
        return;
    }

    StaticJsonDocument<512> doc;
    DeserializationError e = deserializeJson(doc, file);
    file.close();

    if (e)
    {
        Serial.println("Arquivo de configuração corrompido.");
        iniciarProvisionamento();
        return;
    }

    _codigo = doc["codigo"] | 0;
    _apelido = doc["apelido"] | "Smartlock";
    _unidade.codigo = doc["unidade"]["codigo"] | 0;
    _unidade.nome = doc["unidade"]["nome"] | "Desconhecida";

    if (_codigo > 0)
    {
        _is_provisionado = true;
        setState(SystemState::IDLE);
        Serial.println("Sistema carregado. Operacional.");
    }
    else
    {
        iniciarProvisionamento();
    }
}

bool System::salvarConfiguracao(int codigo, String apelido, int codUnidade, String nomeUnidade)
{
    StaticJsonDocument<512> doc;

    // Monta o JSON
    doc["codigo"] = codigo;
    doc["apelido"] = apelido;
    doc["unidade"]["codigo"] = codUnidade;
    doc["unidade"]["nome"] = nomeUnidade;

    File file = LittleFS.open(CONFIG_FILE, "w");
    if (!file)
    {
        Serial.println("Falha ao abrir arquivo para gravação");
        return false;
    }

    // Escreve o JSON no arquivo
    if (serializeJson(doc, file) == 0)
    {
        Serial.println("Falha ao gravar JSON");
        file.close();
        return false;
    }

    file.close();

    // Atualiza a memória RAM imediatamente
    _codigo = codigo;
    _apelido = apelido;
    _unidade.codigo = codUnidade;
    _unidade.nome = nomeUnidade;
    _is_provisionado = true;

    setState(SystemState::IDLE);
    return true;
}

bool System::isProvisionado()
{
    return _is_provisionado;
}

String System::getSystemTitle()
{
    if (_apelido.length() > 0 && _unidade.nome.length() > 0)
    {
        return _apelido + "/\n" + _unidade.nome;
    }
    else
    {
        return "-----";
    }
}

void System::iniciarProvisionamento()
{
    _is_provisionado = true;
    setState(SystemState::PROVISIONANDO);
    Serial.println("Entrando em modo de provisionamento...");

    solicitou_provisao = false;
}

void System::updateProvisionamento()
{
    if (!solicitou_provisao)
    {
        char macStr[18];
        String mac = WiFi.macAddress();
        strncpy(macStr, mac.c_str(), sizeof(macStr));

        char bufferMsg[32];
        snprintf(bufferMsg, sizeof(bufferMsg), "MAC:\n%s", macStr);
        DisplayHandler::setFixedMessage(bufferMsg);

        solicitou_provisao = MqttHandler::publish("system", "discover", "{}");
    }
}

void System::setState(SystemState state)
{
    _estadoAtual = state;
}

SystemState System::getState()
{
    return _estadoAtual;
}

String System::getStateString()
{
    switch (_estadoAtual)
    {
    case SystemState::INITIALIZING:
        return "INITIALIZING";
    case SystemState::IDLE:
        return "IDLE";
    case SystemState::AWAITING_CLOUD:
        return "AWAITING_CLOUD";
    case SystemState::IN_PROCESS:
        return "IN_PROCESS";
    case SystemState::READING:
        return "READING";
    case SystemState::PROVISIONANDO:
        return "PROVISIONANDO";
    default:
        return "UNKNOWN_STATE";
    }
}