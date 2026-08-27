#pragma once
#include <Arduino.h>
#include <functional>

enum class MotorDirection {
    LEFT  = LOW,
    RIGHT = HIGH
};

class MotorController {
public:
    MotorController(uint8_t stepPin, uint8_t dirPin, uint8_t limitLeftPin, uint8_t limitRightPin);
    
    void init();
    
    // Move até atingir o fim de curso, aceitando um callback opcional por passo (não-bloqueante)
    bool moveToLimit(MotorDirection dir, uint16_t stepDelayUs, unsigned long timeoutMs = 15000, std::function<void()> onStepCallback = nullptr);
    
    void step(MotorDirection dir, uint32_t steps, uint16_t stepDelayUs);
    bool isLimitTriggered(MotorDirection dir) const;

private:
    uint8_t _stepPin;
    uint8_t _dirPin;
    uint8_t _limitLeftPin;
    uint8_t _limitRightPin;

    void singlePulse(uint16_t delayUs);
    uint8_t getPinForDirection(MotorDirection dir) const;
};