#include "rfid_uhf_handler.h"
#include "config.h" 
// IMPORTANTE: Garanta que R200_RX_PIN seja 16 e R200_TX_PIN seja 17 no seu config.h

// Inicializa a memória da classe
String UhfHandler::tagsLidas[UhfHandler::MAX_TAGS];
int UhfHandler::numTagsLidas = 0;

void UhfHandler::init() {
    // O módulo R200 utiliza 115200 baud de fábrica
    Serial2.begin(115200, SERIAL_8N1, R200_RX_PIN, R200_TX_PIN);
    Serial.println("[UHF] R200 Inicializado.");
    
    delay(200); // Pequeno fôlego para o chip ligar
    
    // Define a potência média-baixa para testes iniciais (20 dBm)
    setPower(20);
}

void UhfHandler::setPower(uint8_t dbm) {
    if (dbm < 15) dbm = 15; // Proteção contra valores inválidos
    if (dbm > 26) dbm = 26;
    
    // No R200, o valor do dBm é multiplicado por 100 (ex: 20dBm = 2000 = 0x07D0)
    uint16_t powerVal = dbm * 100;
    uint8_t data[] = { (uint8_t)(powerVal >> 8), (uint8_t)(powerVal & 0xFF) };
    
    sendCommand(0xB6, data, 2);
    Serial.printf("[UHF] Potência calibrada para %d dBm\n", dbm);
}

void UhfHandler::startInventory() {
    numTagsLidas = 0; // Limpa o inventário da leitura passada
    
    // Comando 0x27: Multiple Polling (Parâmetros: Lê o tempo todo)
    uint8_t data[] = { 0x22, 0x27, 0x10 };
    sendCommand(0x27, data, 3);
    Serial.println("[UHF] Varredura volumétrica INICIADA.");
}

void UhfHandler::stopInventory() {
    sendCommand(0x28, nullptr, 0); // Comando de parada absoluta
    Serial.println("[UHF] Varredura volumétrica PARADA.");
}

// -------------------------------------------------------------
// O PARSER ASSÍNCRONO (NÃO BLOQUEANTE)
// -------------------------------------------------------------
void UhfHandler::update() {
    static uint8_t buffer[256];
    static uint8_t index = 0;
    static bool isReading = false;

    // Lê a porta serial 2 conforme os bytes chegam
    while (Serial2.available() > 0) {
        uint8_t b = Serial2.read();

        // 0xBB é o cabeçalho oficial que inicia um pacote no R200
        if (b == 0xBB && !isReading) {
            isReading = true;
            index = 0;
        }

        if (isReading) {
            buffer[index++] = b;

            // 0x7E é a marcação de Fim do Pacote
            if (b == 0x7E && index > 5) {
                processPacket(buffer, index);
                isReading = false;
                index = 0;
            }
            
            // Prevenção de falha de segmentação (se entrar ruído no cabo)
            if (index >= 255) {
                isReading = false;
                index = 0;
            }
        }
    }
}

void UhfHandler::processPacket(uint8_t* buffer, uint8_t len) {
    if (len < 7) return; 

    uint8_t type = buffer[1];
    uint8_t cmd = buffer[2];
    
    // Se Tipo for 0x02 (Notificação) e Cmd for 0x22 (Leitura EPC efetuada)
    if (type == 0x02 && cmd == 0x22) {
        
        uint8_t dataLen = buffer[4];
        if (dataLen < 4) return;
        
        // Remove bytes de controle (RSSI e PC) para sobrar só o ID do notebook
        uint8_t epcLen = dataLen - 5; 
        
        String epc = "";
        for (int i = 0; i < epcLen; i++) {
            uint8_t byteLido = buffer[8 + i]; // A Tag começa no oitavo byte
            if (byteLido < 0x10) epc += "0";  // Preenche com zero à esquerda
            epc += String(byteLido, HEX);
        }
        
        epc.toUpperCase();
        addTagIfNew(epc);
    }
}

void UhfHandler::addTagIfNew(String epc) {
    // Garante que o mesmo notebook não entre na lista duas vezes
    for (int i = 0; i < numTagsLidas; i++) {
        if (tagsLidas[i] == epc) return; 
    }
    
    if (numTagsLidas < MAX_TAGS) {
        tagsLidas[numTagsLidas++] = epc;
        Serial.printf("[UHF] Novo Notebook Detectado: %s\n", epc.c_str());
        
        // Se quiser um feedback visual, pode descomentar a linha abaixo:
        // BuzzerHandler::play(SoundEffect::RFID_SUCCESS); 
    }
}

String UhfHandler::getInventoryPayload() {
    // Monta a string do JSON Array para facilitar a vida no Node-RED
    String json = "[";
    for (int i = 0; i < numTagsLidas; i++) {
        json += "\"" + tagsLidas[i] + "\"";
        if (i < numTagsLidas - 1) json += ",";
    }
    json += "]";
    return json;
}

void UhfHandler::sendCommand(uint8_t cmd, const uint8_t* data, uint8_t len) {
    // O protocolo exige a soma de todos os bits para validar integridade
    uint8_t checksum = 0x00 + cmd + 0x00 + len; 
    
    Serial2.write(0xBB); // Header
    Serial2.write(0x00); // Tipo: Comando
    Serial2.write(cmd);  // Código do Comando
    Serial2.write(0x00); // Tamanho (Byte Alto)
    Serial2.write(len);  // Tamanho (Byte Baixo)
    
    for (uint8_t i = 0; i < len; i++) {
        Serial2.write(data[i]);
        checksum += data[i];
    }
    
    Serial2.write(checksum); // Envia a verificação de soma
    Serial2.write(0x7E);     // Fecha pacote
}