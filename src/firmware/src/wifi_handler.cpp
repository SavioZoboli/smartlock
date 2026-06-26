#include "wifi_handler.h"
#include <WiFiManager.h>
#include "status_feedback_handler.h"
#include "secrets.h"
namespace {
    WiFiManager wm;
    unsigned long lastReconnectAttempt = 0;
    const unsigned long RECONNECT_INTERVAL = 60000;
    bool portalRunning = false;
    
    char macHtml[150];
    WiFiManagerParameter* customMacParam = nullptr;
}

void WiFiHandler::init() {
    StatusFeedback::set(Component::WIFI, State::CONNECTING);
    WiFi.mode(WIFI_STA);

    // 1. TENTA CONECTAR NA REDE SALVA NA FLASH
    Serial.println("[WIFI] Tentando rede salva na memoria...");
    WiFi.begin(); // Usa as credenciais que já estão na NVS
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) { // Aguarda ~10 segundos
        delay(500);
        attempts++;
        Serial.print(".");
    }

    // 2. SE FALHOU (OU ESTAVA VAZIO), TENTA A REDE PADRÃO DA FIESC
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("\n[WIFI] Rede salva falhou/vazia. Tentando rede padrao FIESC...");
        WiFi.disconnect();
        delay(100);
        
        WiFi.begin(WIFI_DEFAULT_SSID, WIFI_DEFAULT_PASSWORD);
        
        attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) { // Aguarda mais ~10 segundos
            delay(500);
            attempts++;
            Serial.print(".");
        }
    }

    // 3. SE TUDO FALHOU, SOBE O PORTAL CATIVEIRO
    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n[WIFI] Conectado com sucesso!");
        StatusFeedback::set(Component::WIFI, State::OK);
    } else {
        Serial.println("\n[WIFI] Nenhuma rede disponivel. Subindo Portal AP em background...");
        
        snprintf(macHtml, sizeof(macHtml), 
                 "<hr><h3>Configuracao de Fabrica</h3><p><b>MAC Address:</b> %s</p><hr>", 
                 WiFi.macAddress().c_str());
        customMacParam = new WiFiManagerParameter(macHtml);
        wm.addParameter(customMacParam);

        // Configurações do Portal
        wm.setConfigPortalBlocking(false); // Mantém o hardware rodando!
        wm.setRemoveDuplicateAPs(true);
        wm.setMinimumSignalQuality(20);
        wm.setConfigPortalTimeout(0);
        
        // Inicia o portal AP de forma direta, sem forçar autoConnect a fazer scan
        wm.startConfigPortal("SMART_LOCK_CONFIG");
        portalRunning = true;
    }
}

void WiFiHandler::update() {
    if (portalRunning) {
        wm.process(); // Mantém o portal web vivo sem travar o loop
        
        if (WiFi.status() == WL_CONNECTED) {
            portalRunning = false;
            StatusFeedback::set(Component::WIFI, State::OK);
            Serial.println("[WIFI] Credenciais recebidas via Portal com sucesso!");
        }
        return; 
    }

    // Operação normal: monitoramento de queda
    if (WiFi.status() != WL_CONNECTED) {
        StatusFeedback::set(Component::WIFI, State::ERROR);
        
        unsigned long currentMillis = millis();
        if (currentMillis - lastReconnectAttempt >= RECONNECT_INTERVAL) {
            lastReconnectAttempt = currentMillis;
            Serial.println("[WIFI] Conexao perdida. Tentando reconectar no background...");
            WiFi.reconnect(); 
        }
    } else {
        StatusFeedback::set(Component::WIFI, State::OK);
    }
}

bool WiFiHandler::isConnected(){
    return WiFi.status() == WL_CONNECTED;
}