#include <Arduino.h>
#include "config.h"
#include "motor_controller.h"
#include "r200_reader.h"

MotorController motor1(
    PinConfig::MOTOR1_STEP, 
    PinConfig::MOTOR1_DIR, 
    PinConfig::LIMIT_LEFT, 
    PinConfig::LIMIT_RIGHT
);

R200Reader uhfReader1(Serial2, PinConfig::R200_RX, PinConfig::R200_TX, 115200);

void executarCicloVarredura() {
    std::vector<String> tagsDetectadas;

    Serial.println("\n==========================================");
    Serial.println("[CICLO] 1. Posicionamento na DIREITA (Home)...");
    Serial.println("==========================================");
    
    // Passo 1: Velocidade baixa para buscar o ponto zero (delay maior = 1600us)
    motor1.moveToLimit(MotorDirection::RIGHT, 1600, 15000);
    delay(200);
    motor1.step(MotorDirection::LEFT, 150, 1200); // Afasta do switch
    delay(500);

    Serial.println("[CICLO] 2. Ligando Leitor UHF e iniciando varredura...");
    uhfReader1.startInventory();

    // Callback para processar os pacotes UART durante o movimento do motor
    auto leitorCallback = [&]() {
        uhfReader1.processBuffer(tagsDetectadas);
    };

    Serial.println("[CICLO] 3. Deslocando para ESQUERDA (Velocidade normal)...");
    // Passo 2: Velocidade normal de varredura (1000us)
    motor1.moveToLimit(MotorDirection::LEFT, 1000, 15000, leitorCallback);
    delay(200);
    motor1.step(MotorDirection::RIGHT, 150, 1200); // Afasta da chave
    delay(200);

    Serial.println("[CICLO] 4. Retornando para DIREITA (Home)...");
    motor1.moveToLimit(MotorDirection::RIGHT, 1000, 15000, leitorCallback);
    delay(200);
    motor1.step(MotorDirection::LEFT, 150, 1200); // Posição de repouso final

    Serial.println("[CICLO] 5. Desligando Leitor UHF...");
    uhfReader1.stopInventory();

    // Consolidação dos dados
    Serial.printf("\n[RESULTADO] Varredura concluida. %d tag(s) encontrada(s):\n", tagsDetectadas.size());
    for (size_t i = 0; i < tagsDetectadas.size(); i++) {
        Serial.printf("  [%d] EPC: %s\n", i + 1, tagsDetectadas[i].c_str());
    }
}

void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("[SETUP] Inicializando Motor 1 e UHF R200...");
    motor1.init();
    uhfReader1.init();
    uhfReader1.setPower(20); // 20 dBm de potência
    Serial.println("[SETUP] Concluído.");
}

void loop() {
    executarCicloVarredura();

    Serial.println("\n[SISTEMA] Aguardando 10 segundos para o próximo ciclo...");
    delay(10000);
}