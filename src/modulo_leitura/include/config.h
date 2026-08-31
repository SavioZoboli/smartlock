#pragma once
#include <Arduino.h>

namespace PinConfig {
    // Driver A4988 - Motor 1 (Eixo X)
    constexpr uint8_t MOTOR1_STEP = 4;
    constexpr uint8_t MOTOR1_DIR  = 2;
    constexpr uint8_t LIMIT_M1_LEFT  = 13;
    constexpr uint8_t LIMIT_M1_RIGHT = 12;

    // Driver A4988 - Motor 2 (Eixo Y)
    constexpr uint8_t MOTOR2_STEP = 18;
    constexpr uint8_t MOTOR2_DIR  = 5;
    constexpr uint8_t LIMIT_M2_LEFT  = 14; 
    constexpr uint8_t LIMIT_M2_RIGHT = 27; 

    // Comunicação inter-chip com ESP Master (UART1)
    constexpr uint8_t PIN_RX_LINK = 32;
    constexpr uint8_t PIN_TX_LINK = 33;

    // Leitor UHF R200 #1 (UART2 Hardware)
    constexpr uint8_t R200_1_RX = 16;
    constexpr uint8_t R200_1_TX = 17;

    // Leitor UHF R200 #2 (UART Virtual / SoftwareSerial)
    constexpr uint8_t R200_2_RX = 25;
    constexpr uint8_t R200_2_TX = 26;
}