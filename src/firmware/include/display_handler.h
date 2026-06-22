#pragma once
#include <Arduino.h>

class DisplayHandler {
public:
    // Inicializa o display via I2C
    static void init();
    
    // Atualiza a tela de forma assíncrona (resolve os timeouts)
    static void update();
    
    // Atualiza os ícones/textos da barra superior
    static void setIndicators(bool wifiOk, bool mqttOk, bool isLocked);
    
    // Escreve uma mensagem fixa (Ex: "Aproxime o Cracha")
    static void setFixedMessage(const char* title, const char* message);
    
    // Escreve uma mensagem temporária (Ex: "Acesso Negado" por 3 segundos)
    static void setTimeoutMessage(const char* title, const char* message, unsigned long timeoutMs);

private:
    static void drawLayout(); // Função interna que desenha a tela
};