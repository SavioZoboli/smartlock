#pragma once
#include <Arduino.h>

namespace PinConfig {
    // Driver A4988 - Motor 1
    constexpr uint8_t MOTOR1_STEP = 4;
    constexpr uint8_t MOTOR1_DIR  = 2;

    // Finais de Curso (Contato seco Pull-up -> COM no GND, NO no GPIO)
    constexpr uint8_t LIMIT_LEFT  = 13;
    constexpr uint8_t LIMIT_RIGHT = 12;

    // Leitor UHF R200 (UART2)
    constexpr uint8_t R200_RX = 16;
    constexpr uint8_t R200_TX = 17;
}