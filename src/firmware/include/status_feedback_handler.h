#pragma once
#include <Arduino.h>
#include "config.h" // CORREÇÃO: Importa os pinos do lugar centralizado

enum class Component {
    WIFI,
    MQTT,
    PORTA
};

enum class State {
    OFF,
    CONNECTING,   
    OK,           
    ERROR,        
    DIRTY_OFFLINE 
};

class StatusFeedback {
private:
    struct LedControl {
        uint8_t pin;
        State currentState;
        unsigned long lastToggleMillis;
        uint16_t blinkInterval;
        bool ledPhysicalState;
    };

    static LedControl wifiLed;
    static LedControl mqttLed;
    static LedControl portaLed;

    static void processLed(LedControl& led);

public:
    static void init();
    static void update();
    static void set(Component comp, State state);
    static void setFromString(const char* comp, const char* state);
};