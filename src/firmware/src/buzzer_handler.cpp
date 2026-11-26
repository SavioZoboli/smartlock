#include "buzzer_handler.h"
#include "config.h" // Garanta que #define BUZZER_PIN XX está configurado corretamente
#include "pitches.h"

// Inicializa o ponteiro da Task e mutex para evitar race condition no vTaskDelete
TaskHandle_t BuzzerHandler::buzzerTaskHandle = NULL;
namespace {
    portMUX_TYPE buzzerMux = portMUX_INITIALIZER_UNLOCKED;
}

void BuzzerHandler::init() {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW); // Garante que começa desligado
    BuzzerHandler::play(SoundEffect::STARTUP);
}

void BuzzerHandler::play(SoundEffect effect) {
    // Retira o handle atomicamente antes de deletar, evitando double-delete com buzzerTask
    TaskHandle_t handleToDelete = NULL;
    portENTER_CRITICAL(&buzzerMux);
    if (buzzerTaskHandle != NULL) {
        handleToDelete = buzzerTaskHandle;
        buzzerTaskHandle = NULL;
    }
    portEXIT_CRITICAL(&buzzerMux);

    if (handleToDelete != NULL) {
        vTaskDelete(handleToDelete);
        noTone(BUZZER_PIN);
    }

    // Cria uma tarefa no background com stack segura (2048 bytes para LEDC/tone)
    TaskHandle_t created = NULL;
    if (xTaskCreate(
        buzzerTask,
        "BuzzerTask",
        2048,
        (void*)(intptr_t)effect,
        1,
        &created
    ) == pdPASS) {
        portENTER_CRITICAL(&buzzerMux);
        buzzerTaskHandle = created;
        portEXIT_CRITICAL(&buzzerMux);
    }
}

// O Maestro do Background: Roda paralelo ao loop principal
void BuzzerHandler::buzzerTask(void* parameter) {
    // Recupera qual som foi pedido
    SoundEffect effect = (SoundEffect)(intptr_t)parameter;

    // Redireciona para as funções de UX de Sistema
    switch (effect) {
        case SoundEffect::BOOT:         soundBoot(); break;
        case SoundEffect::RFID_SUCCESS: soundRFIDSuccess(); break;
        case SoundEffect::RFID_FAIL:    soundRFIDFail(); break;
        case SoundEffect::OP_SUCCESS:   soundOperationSuccess(); break;
        case SoundEffect::OP_FAIL:      soundOperationFail(); break;
        case SoundEffect::LOGOFF:       soundLogoff(); break;
        case SoundEffect::STARTUP:      soundStartup();break;
        case SoundEffect::TAG_READ:     soundTagRead();break;
    }

    // Desliga o buzzer por segurança ao terminar
    noTone(BUZZER_PIN);

    // Limpa o handle sob spinlock apenas se ainda apontar para esta task
    TaskHandle_t self = xTaskGetCurrentTaskHandle();
    portENTER_CRITICAL(&buzzerMux);
    if (buzzerTaskHandle == self) {
        buzzerTaskHandle = NULL;
    }
    portEXIT_CRITICAL(&buzzerMux);

    vTaskDelete(NULL);
}

// =========================================
// IMPLEMENTAÇÕES DOS SONS DE ESTADO
// =========================================

void BuzzerHandler::soundBoot() {
    // Arpejo ascendente rápido (C5 -> E5 -> G5 -> C6)
    tone(BUZZER_PIN, NOTE_C5, 100); delay(120);
    tone(BUZZER_PIN, NOTE_E5, 100); delay(120);
    tone(BUZZER_PIN, NOTE_G5, 100); delay(120);
    tone(BUZZER_PIN, NOTE_C6, 250); delay(250);
}

void BuzzerHandler::soundRFIDSuccess() {
    // "Bip-bip" agudo e rápido (como um scanner de mercado)
    tone(BUZZER_PIN, NOTE_A6, 80); delay(100);
    tone(BUZZER_PIN, NOTE_A6, 80); delay(80);
}

void BuzzerHandler::soundRFIDFail() {
    // Som grave e longo de negação
    tone(BUZZER_PIN, NOTE_G2, 400); delay(400);
}

void BuzzerHandler::soundOperationSuccess() {
    // "Cha-ching!" positivo (salto de quinta perfeita)
    tone(BUZZER_PIN, NOTE_C6, 150); delay(150);
    tone(BUZZER_PIN, NOTE_G6, 300); delay(300);
}

void BuzzerHandler::soundOperationFail() {
    // "Uh-oh" descendente (terça menor)
    tone(BUZZER_PIN, NOTE_E5, 200); delay(250);
    tone(BUZZER_PIN, NOTE_CS5, 400); delay(400);
}

void BuzzerHandler::soundLogoff() {
    // Oposto do boot: arpejo descendente suave
    tone(BUZZER_PIN, NOTE_G5, 150); delay(150);
    tone(BUZZER_PIN, NOTE_E5, 150); delay(150);
    tone(BUZZER_PIN, NOTE_C5, 300); delay(300);
}

void BuzzerHandler::soundStartup(){
    // Nota 1: Curta (tã)
    tone(BUZZER_PIN, 523, 120); // NOTE_C5 (Dó)
    delay(140);                 // Tempo da nota + pequeno intervalo
    
    // Nota 2: Curta (nã)
    tone(BUZZER_PIN, 659, 120); // NOTE_E5 (Mi)
    delay(140);
    
    // Nota 3: Longa e marcante (nãã)
    tone(BUZZER_PIN, 784, 350); // NOTE_G5 (Sol)
    delay(350);
}

void BuzzerHandler::soundTagRead(){
    tone(BUZZER_PIN, NOTE_A4, 100); delay(120);
}