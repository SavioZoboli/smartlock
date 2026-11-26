#include <Arduino.h>
#include <SoftwareSerial.h>
#include "config.h"
#include "motor_controller.h"
#include "r200_reader.h"

uint8_t uhfPowerConfig = 20;

// Portas de Comunicação
HardwareSerial LinkMaster(1);
SoftwareSerial SerialUHF2;

// Instanciação de Motores
MotorController motor1(PinConfig::MOTOR1_STEP, PinConfig::MOTOR1_DIR, PinConfig::LIMIT_M1_LEFT, PinConfig::LIMIT_M1_RIGHT);
MotorController motor2(PinConfig::MOTOR2_STEP, PinConfig::MOTOR2_DIR, PinConfig::LIMIT_M2_LEFT, PinConfig::LIMIT_M2_RIGHT);

// Instanciação de Leitores (usando abstração de Stream)
R200Reader uhfReader1(Serial2);     // R200 #1 na porta Hardware
R200Reader uhfReader2(SerialUHF2);  // R200 #2 na porta de Software

void executarGoHome() {
    Serial.println("[SLAVE] Comando GO_HOME recebido. Posicionando os eixos...");
    
    motor1.moveToLimit(MotorDirection::RIGHT, 1600, 15000);
    motor1.step(MotorDirection::LEFT, 150, 1200); 
    
    motor2.moveToLimit(MotorDirection::RIGHT, 1600, 15000);
    motor2.step(MotorDirection::LEFT, 150, 1200); 
    
    LinkMaster.println("STATUS:HOME_OK");
    Serial.println("[SLAVE] Posicionamento concluído.");
}

void executarLeitura() {
    Serial.println("[SLAVE] Comando BEGIN_READ recebido. Iniciando ciclo M1 e M2...");
    std::vector<String> tagsDetectadas;
    tagsDetectadas.reserve(80); // Pré-aloca espaço para o lote todo
    const unsigned long MOVE_TIMEOUT_MS = 12000; // 6 movimentos x 12s <= 72s (< 80s do Master)

    // --- CICLO MOTOR 1 ---
    Serial.println("[SLAVE] Lendo eixo M1...");
    if (!motor1.moveToLimit(MotorDirection::RIGHT, 1600, MOVE_TIMEOUT_MS)) {
        Serial.println("[SLAVE] ERRO: Falha mecânica no homing de M1.");
        LinkMaster.println("STATUS:ERROR");
        return;
    }
    motor1.step(MotorDirection::LEFT, 150, 1200);

    uhfReader1.startInventory();
    auto leitorCallback1 = [&]() { uhfReader1.processBuffer(tagsDetectadas); };

    bool m1Ok = motor1.moveToLimit(MotorDirection::LEFT, 1000, MOVE_TIMEOUT_MS, leitorCallback1);
    if (m1Ok) {
        motor1.step(MotorDirection::RIGHT, 150, 1200);
        m1Ok = motor1.moveToLimit(MotorDirection::RIGHT, 1000, MOVE_TIMEOUT_MS, leitorCallback1);
    }
    uhfReader1.stopInventory();

    if (!m1Ok) {
        Serial.println("[SLAVE] ERRO: Falha mecânica durante varredura de M1.");
        LinkMaster.println("STATUS:ERROR");
        return;
    }
    motor1.step(MotorDirection::LEFT, 150, 1200);

    // --- CICLO MOTOR 2 ---
    Serial.println("[SLAVE] Lendo eixo M2...");
    if (!motor2.moveToLimit(MotorDirection::RIGHT, 1600, MOVE_TIMEOUT_MS)) {
        Serial.println("[SLAVE] ERRO: Falha mecânica no homing de M2.");
        LinkMaster.println("STATUS:ERROR");
        return;
    }
    motor2.step(MotorDirection::LEFT, 150, 1200);

    uhfReader2.startInventory();
    auto leitorCallback2 = [&]() { uhfReader2.processBuffer(tagsDetectadas); };

    bool m2Ok = motor2.moveToLimit(MotorDirection::LEFT, 1000, MOVE_TIMEOUT_MS, leitorCallback2);
    if (m2Ok) {
        motor2.step(MotorDirection::RIGHT, 150, 1200);
        m2Ok = motor2.moveToLimit(MotorDirection::RIGHT, 1000, MOVE_TIMEOUT_MS, leitorCallback2);
    }
    uhfReader2.stopInventory();

    if (!m2Ok) {
        Serial.println("[SLAVE] ERRO: Falha mecânica durante varredura de M2.");
        LinkMaster.println("STATUS:ERROR");
        return;
    }
    motor2.step(MotorDirection::LEFT, 150, 1200);

    // --- CONSOLIDAÇÃO E ENVIO (LINK MASTER) ---
    for (const auto& tag : tagsDetectadas) {
        LinkMaster.printf("TAG:%s\n", tag.c_str());
    }
    LinkMaster.println("STATUS:DONE");
    
    // --- EXIBIÇÃO NO MONITOR SERIAL (CONSOLIDADOR) ---
    Serial.printf("\n[SLAVE] Varredura dupla finalizada. %u tag(s) encontrada(s):\n", tagsDetectadas.size());
    for (size_t i = 0; i < tagsDetectadas.size(); i++) {
        Serial.printf("  [%d] EPC: %s\n", i + 1, tagsDetectadas[i].c_str()); // Exibe cada tag em uma linha
    }
    Serial.println("==================================================");
}

void processarComando(const String& cmd) {
    if (cmd == "CMD:GO_HOME") {
        executarGoHome();
    } 
    else if (cmd == "CMD:BEGIN_READ" || cmd == "CMD:BEGIN_SCAN") {
        executarLeitura();
    }
}

void setup() {
    Serial.begin(115200); 
    
    // Inicialização das Portas Seriais
    LinkMaster.begin(115200, SERIAL_8N1, PinConfig::PIN_RX_LINK, PinConfig::PIN_TX_LINK);
    Serial2.begin(115200, SERIAL_8N1, PinConfig::R200_1_RX, PinConfig::R200_1_TX);
    
    // Inicialização do SoftwareSerial com a config SWSERIAL_8N1
    SerialUHF2.begin(115200, SWSERIAL_8N1, PinConfig::R200_2_RX, PinConfig::R200_2_TX, false);

    Serial.println("\n[SLAVE] Inicializando hardware...");
    motor1.init();
    motor2.init();
    
    uhfReader1.init();
    uhfReader1.setPower(uhfPowerConfig); 

    uhfReader2.init();
    uhfReader2.setPower(uhfPowerConfig);

    Serial.println("[SLAVE] Sistema pronto. Aguardando Master...");
}

void loop() {
    if (LinkMaster.available()) {
        String comando = LinkMaster.readStringUntil('\n');
        comando.trim();
        if (comando.length() > 0) {
            processarComando(comando);
        }
    }
}