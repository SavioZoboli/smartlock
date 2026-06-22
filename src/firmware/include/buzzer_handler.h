#pragma once
#include <Arduino.h>

// Lista de todos os sons disponíveis (Apenas estados do sistema)
enum class SoundEffect {
    BOOT,
    RFID_SUCCESS,
    RFID_FAIL,
    OP_SUCCESS,
    OP_FAIL,
    LOGOFF,
    STARTUP
};

class BuzzerHandler {
public:
    // Inicializa o pino do buzzer (chamar no setup)
    static void init();

    // Toca o som de estado de forma 100% assíncrona
    static void play(SoundEffect effect);

private:
    // Handle da Task do FreeRTOS
    static TaskHandle_t buzzerTaskHandle;

    // A Task paralela que roda no background
    static void buzzerTask(void* parameter);

    // --- FUNÇÕES INTERNAS DE ÁUDIO (UX de Sistema) ---
    static void soundBoot();
    static void soundRFIDSuccess();
    static void soundRFIDFail();
    static void soundOperationSuccess();
    static void soundOperationFail();
    static void soundLogoff();
    static void soundStartup();
};