#include "hardware_io_handler.h"
#include "config.h" 
// Garanta que no seu config.h existam:
// #define RELE_PIN 26
// #define SENSOR_PORTA_PIN 14
// #define TEMPO_ABERTURA_MS 5000 

namespace {
    // --- Variáveis do Relé ---
    bool relayIsActive = false;
    unsigned long relayOpenedAt = 0;

    // --- Variáveis do Sensor de Porta (Debounce) ---
    bool currentDoorState = false;  // Falso = Fechada, Verdadeiro = Aberta
    bool lastDoorReading = false;
    unsigned long lastDebounceTime = 0;
    const unsigned long DEBOUNCE_DELAY = 50; // Filtra vibrações menores que 50ms

    // --- Variáveis de Eventos ---
    bool flagJustClosed = false;
}

void HardwareIOHandler::init() {
    // Configuração do Relé
    pinMode(RELE_PIN, OUTPUT);
    lockDoor(); // Garante que a fechadura inicia trancada!

    // Configuração do Sensor com Pull-Up interno (Evita resistor externo)
    pinMode(SENSOR_PORTA_PIN, INPUT_PULLUP);

    // Faz a leitura inicial
    // Com INPUT_PULLUP: Sensor encostado (porta fechada) = LOW. Sensor afastado (aberta) = HIGH.
    currentDoorState = (digitalRead(SENSOR_PORTA_PIN) == HIGH);
    lastDoorReading = currentDoorState;
}

void HardwareIOHandler::update() {
    // ==========================================
    // 1. GERENCIADOR DE TEMPO DO RELÉ
    // ==========================================
    if (relayIsActive) {
        if (millis() - relayOpenedAt >= TEMPO_ABERTURA_MS) {
            lockDoor(); // O tempo acabou, tranca a porta!
        }
    }

    // ==========================================
    // 2. FILTRO DE RUÍDO DO SENSOR (DEBOUNCE)
    // ==========================================
    bool reading = (digitalRead(SENSOR_PORTA_PIN) == HIGH);

    // Se a leitura mudou (vibração mecânica ou porta realmente se movendo)
    if (reading != lastDoorReading) {
        lastDebounceTime = millis(); // Reseta o cronômetro do filtro
    }

    // Limpa a flag de evento para o próximo ciclo
    flagJustClosed = false;

    // Se a leitura ficou estável por mais de 50ms (passou no filtro)
    if ((millis() - lastDebounceTime) > DEBOUNCE_DELAY) {
        
        // Se o estado consolidado for diferente do nosso estado atual salvo
        if (reading != currentDoorState) {
            currentDoorState = reading;

            // Dispara o evento apenas se a porta mudou para FECHADA
            if (currentDoorState == false) {
                flagJustClosed = true; 
                Serial.println("[HARDWARE] Porta Fisicamente Fechada.");
            } else {
                Serial.println("[HARDWARE] Porta Fisicamente Aberta.");
            }
        }
    }

    // Salva a leitura atual para comparar no próximo ciclo
    lastDoorReading = reading;
}

void HardwareIOHandler::unlockDoor() {
    // IMPORTANTE: Alguns relés acionam em LOW. Mude para LOW aqui se o seu relé for ativo baixo.
    digitalWrite(RELE_PIN, HIGH); 
    relayIsActive = true;
    relayOpenedAt = millis();
    Serial.println("[HARDWARE] Relé Acionado (Porta Destrancada).");
}

void HardwareIOHandler::lockDoor() {
    // Mude para HIGH aqui se o seu relé for ativo baixo.
    digitalWrite(RELE_PIN, LOW);
    relayIsActive = false;
}

bool HardwareIOHandler::isDoorOpen() {
    return false;
    return currentDoorState;
}

bool HardwareIOHandler::doorJustClosed() {
    return flagJustClosed;
}