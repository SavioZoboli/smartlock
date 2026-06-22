#pragma once
#include <Arduino.h>

class WiFiHandler {
public:
    // Inicializa o rádio, tenta conectar na Flash ou abre o portal
    static void init();
    
    // Mantém o portal rodando ou tenta reconectar a cada 60s
    static void update();

    // Retorna o estado de conexão
    static bool isConnected();
};