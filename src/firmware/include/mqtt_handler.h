#pragma once
#include <Arduino.h>


class MqttHandler {
public:
    // Inicializa as configurações do Broker e define os tópicos com o MAC
    static void init();
    
    // Mantém o client rodando e gerencia reconexões assíncronas
    static void update();
    
    // Função utilitária para publicar de qualquer lugar da main.cpp
    static bool publish(const char* module, const char* action, const char* payload);

    // Função para retornar o status de conexão do MQTT
    static bool isConnected();

private:
    // Callback que é disparado quando o Node-RED manda uma mensagem para o ESP32
    static void callback(char* topic, byte* payload, unsigned int length);
    
    // Construtor de tópicos dinâmico para não poluir a RAM
    static void buildTopic(char* buffer, size_t maxLen, const char* module, const char* action);

    static void reconnect();
};