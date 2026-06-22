#include "status_feedback_handler.h"
#include <string.h>

// Inicialização das variáveis estáticas
StatusFeedback::LedControl StatusFeedback::wifiLed = {LED_WIFI_PIN, State::OFF, 0, 0, false};
StatusFeedback::LedControl StatusFeedback::mqttLed = {LED_MQTT_PIN, State::OFF, 0, 0, false};
StatusFeedback::LedControl StatusFeedback::portaLed = {LED_PORTA_PIN, State::OFF, 0, 0, false};

void StatusFeedback::init() {
    pinMode(wifiLed.pin, OUTPUT);
    pinMode(mqttLed.pin, OUTPUT);
    pinMode(portaLed.pin, OUTPUT);
    
    digitalWrite(wifiLed.pin, LOW);
    digitalWrite(mqttLed.pin, LOW);
    digitalWrite(portaLed.pin, LOW);
}

void StatusFeedback::set(Component comp, State state) {
    LedControl* targetLed = nullptr;

    switch (comp) {
        case Component::WIFI:  targetLed = &wifiLed; break;
        case Component::MQTT:  targetLed = &mqttLed; break;
        case Component::PORTA: targetLed = &portaLed; break;
    }

    if (targetLed == nullptr || targetLed->currentState == state) return;

    targetLed->currentState = state;

    // Configura o comportamento com base no novo estado
    switch (state) {
        case State::OFF:
            targetLed->blinkInterval = 0;
            targetLed->ledPhysicalState = false;
            digitalWrite(targetLed->pin, LOW);
            break;
        case State::OK:
            targetLed->blinkInterval = 0;
            targetLed->ledPhysicalState = true;
            digitalWrite(targetLed->pin, HIGH);
            break;
        case State::CONNECTING:
        case State::ERROR:
            targetLed->blinkInterval = 200; // Pisca rápido (200ms)
            break;
        case State::DIRTY_OFFLINE:
            targetLed->blinkInterval = 1000; // Pisca lento (1000ms)
            break;
    }
}

// O loop que deve rodar livremente na main.cpp
void StatusFeedback::update() {
    processLed(wifiLed);
    processLed(mqttLed);
    processLed(portaLed);
}

// A mágica do millis() encapsulada
void StatusFeedback::processLed(LedControl& led) {
    if (led.blinkInterval == 0) return; // Se for 0, é estado fixo (OFF ou OK)

    unsigned long currentMillis = millis();
    if (currentMillis - led.lastToggleMillis >= led.blinkInterval) {
        led.lastToggleMillis = currentMillis;
        led.ledPhysicalState = !led.ledPhysicalState; // Inverte o estado
        digitalWrite(led.pin, led.ledPhysicalState ? HIGH : LOW);
    }
}

// Wrapper para interpretar Strings (Caso realmente precise)
void StatusFeedback::setFromString(const char* compStr, const char* stateStr) {
    Component c;
    State s;

    // Converte String para Component
    if (strcasecmp(compStr, "wifi") == 0) c = Component::WIFI;
    else if (strcasecmp(compStr, "mqtt") == 0) c = Component::MQTT;
    else if (strcasecmp(compStr, "porta") == 0) c = Component::PORTA;
    else return; // Componente inválido

    // Converte String para State
    if (strcasecmp(stateStr, "off") == 0) s = State::OFF;
    else if (strcasecmp(stateStr, "connecting") == 0) s = State::CONNECTING;
    else if (strcasecmp(stateStr, "ok") == 0) s = State::OK;
    else if (strcasecmp(stateStr, "error") == 0) s = State::ERROR;
    else if (strcasecmp(stateStr, "dirty") == 0) s = State::DIRTY_OFFLINE;
    else return; // Estado inválido

    set(c, s);
}