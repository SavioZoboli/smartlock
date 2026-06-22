#include "buzzer_handler.h"
#include "config.h" // Garanta que #define BUZZER_PIN XX está configurado corretamente
#include "pitches.h"

// Inicializa o ponteiro da Task
TaskHandle_t BuzzerHandler::buzzerTaskHandle = NULL;

void BuzzerHandler::init() {
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(BUZZER_PIN, LOW); // Garante que começa desligado
    BuzzerHandler::play(SoundEffect::STARTUP);
}

void BuzzerHandler::play(SoundEffect effect) {
    // Se já tiver um som tocando, cancelamos antes de começar o novo (evita sobreposição)
    if (buzzerTaskHandle != NULL) {
        vTaskDelete(buzzerTaskHandle);
        buzzerTaskHandle = NULL;
        noTone(BUZZER_PIN);
    }

    // Cria uma tarefa no background para tocar o bipe sem travar o loop principal
    xTaskCreate(
        buzzerTask,          
        "BuzzerTask",        
        1024,                // Memória RAM reduzida (1024 é suficiente, não há mais arrays pesados)
        (void*)(intptr_t)effect, 
        1,                   // Prioridade da tarefa (1 = Baixa)
        &buzzerTaskHandle    
    );
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
    }

    // Desliga o buzzer por segurança ao terminar
    noTone(BUZZER_PIN);
    
    // Limpa o handle e deleta a si mesmo (Obrigatório no FreeRTOS para liberar a RAM)
    buzzerTaskHandle = NULL;
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