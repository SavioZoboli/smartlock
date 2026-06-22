#pragma once

// ==========================================
// CONFIGURAÇÕES DE HARDWARE (PINOUT)
// ==========================================

// --- Comunicação UHF (R200) ---
#define R200_RX_PIN 16
#define R200_TX_PIN 17

// --- Comunicação SPI (MFRC522) ---
#define MFRC522_RST_PIN 4
#define MFRC522_SS_PIN 5
// Nota: Pinos 18(SCK), 19(MISO) e 23(MOSI) são assumidos por padrão na biblioteca SPI.

// --- LEDs de Status ---
#define LED_WIFI_PIN 32
#define LED_MQTT_PIN 33
#define LED_PORTA_PIN 25

// --- Atuadores e Sensores ---
#define RELE_PIN 26
#define BUZZER_PIN 27
#define SENSOR_PORTA_PIN 14

// ==========================================
// CONSTANTES DO SISTEMA
// ==========================================
#define TEMPO_ABERTURA_MS 5000 // Tempo que o relé fica aberto