#include "rfid_hf_handler.h"
#include "config.h"     // Carrega os pinos MFRC522_SS_PIN e MFRC522_RST_PIN
#include <SPI.h>
#include <MFRC522.h>

namespace {
    // Instancia o leitor com os pinos definidos na nossa arquitetura central
    MFRC522 mfrc522(MFRC522_SS_PIN, MFRC522_RST_PIN);
}

void RfidHfHandler::init() {
    // Inicia o barramento SPI (Usa os pinos 18, 19 e 23 por padrão no ESP32)
    SPI.begin(); 
    mfrc522.PCD_Init();
    
    // Aumenta o ganho da antena interna do MFRC522 ao máximo (Opção útil para crachás mais grossos)
    mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);
    
    Serial.println("[RFID HF] MFRC522 Inicializado com sucesso.");
}

void RfidHfHandler::checkHealth() {
    // Variável estática retém o valor entre as chamadas da função
    static unsigned long lastCheck = 0;
    
    // Só executa a leitura do registrador a cada 5000ms (5 segundos)
    if (millis() - lastCheck < 5000) {
        return; 
    }
    lastCheck = millis();

    // RNF04: Monitoramento contínuo dos registradores do leitor SPI
    byte version = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
    
    // Se o barramento SPI falhar ou o leitor congelar por ruído elétrico, ele retorna 0x00 ou 0xFF
    if (version == 0x00 || version == 0xFF) {
        Serial.println("[RFID HF] Erro: Leitor travado ou barramento falhou! Forçando Hard Reset...");
        mfrc522.PCD_Init(); // Reinicialização fria apenas do periférico
    }
}   

bool RfidHfHandler::readTag(char* uidBuffer, size_t maxLen) {
    // 1. Diagnóstico e Auto-Cura antes de qualquer leitura
    checkHealth();

    // 2. Verifica se existe algum crachá próximo ao campo magnético
    if (!mfrc522.PICC_IsNewCardPresent()) {
        return false;
    }

    // 3. Tenta extrair o Serial do cartão
    if (!mfrc522.PICC_ReadCardSerial()) {
        // Correção de Arquitetura: Se a leitura falhar a meio (erro de CRC), 
        // forçamos a parada para não bloquear a próxima tentativa do usuário.
        mfrc522.PICC_HaltA();
        return false;
    }

    // 4. Monta a string Hexadecimal (Ex: "A1B2C3D4")
    String tempUid = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
        tempUid += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        tempUid += String(mfrc522.uid.uidByte[i], HEX);
    }
    tempUid.toUpperCase();

    // Copia de forma segura para o buffer fornecido pela main.cpp
    strncpy(uidBuffer, tempUid.c_str(), maxLen);

    // 5. Finaliza a leitura bloqueando novas leituras idênticas da mesma tag (Evita flood)
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();

    return true;
}