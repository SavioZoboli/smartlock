#include "wifi_handler.h"
#include <WiFiManager.h>
#include "status_feedback_handler.h"

// Usamos um namespace anônimo para encapsular essas variáveis.
// Elas só existem dentro deste arquivo, protegendo a memória do projeto.
namespace {
    WiFiManager wm;
    unsigned long lastReconnectAttempt = 0;
    const unsigned long RECONNECT_INTERVAL = 60000; // 60.000 ms = 1 minuto
    bool portalRunning = false;
    
    char macHtml[150]; // Buffer para armazenar o HTML com o MAC
    WiFiManagerParameter* customMacParam = nullptr;
}

void WiFiHandler::init() {
    // Sinaliza visualmente que iniciou o processo de rede
    StatusFeedback::set(Component::WIFI, State::CONNECTING);

    // Garante que o ESP32 atue como Estação (Cliente) e Access Point
    WiFi.mode(WIFI_AP_STA);
    
    // 1. Injeta o MAC Address na tela do Portal Cativeiro
    snprintf(macHtml, sizeof(macHtml), 
             "<hr><h3>Configuracao de Fabrica</h3><p><b>MAC Address:</b> %s</p><hr>", 
             WiFi.macAddress().c_str());
    customMacParam = new WiFiManagerParameter(macHtml);
    wm.addParameter(customMacParam);

    // 2. O Segredo do Assíncrono: Desabilita o bloqueio de código
    wm.setConfigPortalBlocking(false);

    // 3. Tenta conectar com o que está na Flash (NVS)
    // Se falhar (ou se estiver vazio), ele abre a rede "SMART_LOCK_CONFIG" sem travar o código
    if(wm.autoConnect("SMART_LOCK_CONFIG")) {
        StatusFeedback::set(Component::WIFI, State::OK);
        Serial.println("[WIFI] Conectado via cache da Flash!");
    } else {
        portalRunning = true;
        Serial.println("[WIFI] Cache vazio/invalido. Portal AP iniciado de forma assincrona.");
    }
}

void WiFiHandler::update() {
    // Cenário 1: O Portal Cativeiro está aberto esperando o celular do usuário
    if (portalRunning) {
        wm.process(); // Processa as requisições HTTP da página sem usar delay()
        
        // Verifica se o usuário finalizou a digitação e o ESP32 conectou
        if (WiFi.status() == WL_CONNECTED) {
            portalRunning = false;
            StatusFeedback::set(Component::WIFI, State::OK);
            Serial.println("[WIFI] Credenciais recebidas. Conectado com sucesso!");
        }
        return; // Sai da função para não executar a lógica de reconexão abaixo
    }

    // Cenário 2: Operação normal, verificando se o roteador caiu
    if (WiFi.status() != WL_CONNECTED) {
        StatusFeedback::set(Component::WIFI, State::ERROR); // LED passa a piscar
        
        unsigned long currentMillis = millis();
        // Dispara a tentativa exatamente a cada 1 minuto
        if (currentMillis - lastReconnectAttempt >= RECONNECT_INTERVAL) {
            lastReconnectAttempt = currentMillis;
            Serial.println("[WIFI] Conexao perdida. Tentando reconectar (Sem abrir o Portal)...");
            
            // Usamos WiFi.reconnect() em vez do WiFiManager para não reabrir a rede do ESP32,
            // garantindo que não crie uma brecha de segurança toda vez que o roteador reiniciar.
            WiFi.reconnect(); 
        }
    } else {
        // Mantém o LED aceso e fixo
        StatusFeedback::set(Component::WIFI, State::OK);
    }
}

bool WiFiHandler::isConnected(){
    return WiFi.status() == WL_CONNECTED;
}