#include "motor_controller.h"

MotorController::MotorController(uint8_t stepPin, uint8_t dirPin, uint8_t limitLeftPin, uint8_t limitRightPin)
    : _stepPin(stepPin), _dirPin(dirPin), _limitLeftPin(limitLeftPin), _limitRightPin(limitRightPin) {}

void MotorController::init() {
    pinMode(_stepPin, OUTPUT);
    pinMode(_dirPin, OUTPUT);
    pinMode(_limitLeftPin, INPUT_PULLUP);
    pinMode(_limitRightPin, INPUT_PULLUP);

    digitalWrite(_stepPin, LOW);
    digitalWrite(_dirPin, LOW);
}

uint8_t MotorController::getPinForDirection(MotorDirection dir) const {
    return (dir == MotorDirection::LEFT) ? _limitLeftPin : _limitRightPin;
}

bool MotorController::isLimitTriggered(MotorDirection dir) const {
    return digitalRead(getPinForDirection(dir)) == LOW;
}

void MotorController::singlePulse(uint16_t delayUs) {
    digitalWrite(_stepPin, HIGH);
    delayMicroseconds(delayUs);
    digitalWrite(_stepPin, LOW);
    delayMicroseconds(delayUs);
}

void MotorController::step(MotorDirection dir, uint32_t steps, uint16_t stepDelayUs) {
    digitalWrite(_dirPin, static_cast<uint8_t>(dir));
    for (uint32_t i = 0; i < steps; ++i) {
        singlePulse(stepDelayUs);
    }
}

bool MotorController::moveToLimit(MotorDirection dir, uint16_t stepDelayUs, unsigned long timeoutMs, std::function<void()> onStepCallback) {
    digitalWrite(_dirPin, static_cast<uint8_t>(dir));
    unsigned long startTime = millis();

    if (isLimitTriggered(dir)) {
        return true;
    }

    while (!isLimitTriggered(dir)) {
        if (millis() - startTime >= timeoutMs) {
            Serial.println("[MOTOR] ALERTA: Timeout no deslocamento.");
            return false;
        }

        singlePulse(stepDelayUs);

        // Executa processamento concorrente (leitura do buffer serial)
        if (onStepCallback) {
            onStepCallback();
        }
    }
    return true;
}