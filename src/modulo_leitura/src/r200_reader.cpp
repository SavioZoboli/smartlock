#include "r200_reader.h"

// ======================================================================
// 🐞 MODO DEBUG ATIVADO: Mude para 0 quando quiser parar de jorrar logs
#define DEBUG_UHF 0 
// ======================================================================

const uint8_t FRAME_HEADER = 0xAA;
const uint8_t FRAME_END    = 0xDD;
const uint8_t TYPE_COMMAND      = 0x00;
const uint8_t TYPE_NOTIFICATION = 0x02;

R200Reader::R200Reader(Stream& port) : _stream(port) {}

void R200Reader::init() {
    delay(100);
    while (_stream.available()) {
        _stream.read(); // Limpa sujeira no buffer
    }
}

uint8_t R200Reader::calcularChecksum(const uint8_t* body, size_t length) {
    uint32_t sum = 0;
    for (size_t i = 0; i < length; i++) sum += body[i];
    return static_cast<uint8_t>(sum & 0xFF);
}

void R200Reader::sendFrame(uint8_t frameType, uint8_t cmd, const uint8_t* params, uint16_t paramsLen) {
    size_t bodyLen = 4 + paramsLen;
    uint8_t body[bodyLen];

    body[0] = frameType;
    body[1] = cmd;
    body[2] = static_cast<uint8_t>((paramsLen >> 8) & 0xFF);
    body[3] = static_cast<uint8_t>(paramsLen & 0xFF);

    for (uint16_t i = 0; i < paramsLen; i++) body[4 + i] = params[i];

    uint8_t cs = calcularChecksum(body, bodyLen);

    #if DEBUG_UHF
    Serial.print("\n[UHF TX] Enviando: AA ");
    for (size_t i = 0; i < bodyLen; i++) Serial.printf("%02X ", body[i]);
    Serial.printf("%02X DD\n", cs);
    #endif

    _stream.write(FRAME_HEADER);
    _stream.write(body, bodyLen);
    _stream.write(cs);
    _stream.write(FRAME_END);
    _stream.flush();
}

void R200Reader::setPower(uint8_t powerDbm) {
    if (powerDbm < 15) powerDbm = 15;
    if (powerDbm > 26) powerDbm = 26;

    uint16_t powerVal = powerDbm * 100;
    uint8_t params[3] = {
        0x02,
        static_cast<uint8_t>((powerVal >> 8) & 0xFF),
        static_cast<uint8_t>(powerVal & 0xFF)
    };
    
    #if DEBUG_UHF
    Serial.printf("[UHF CONFIG] Ajustando potencia para %u dBm...\n", powerDbm);
    #endif
    
    sendFrame(TYPE_COMMAND, 0xB6, params, 3);
    delay(50);
}

void R200Reader::startInventory() {
    while (_stream.available()) _stream.read();
    uint8_t pollParams[] = {0x22, 0xFF, 0xFF};
    
    #if DEBUG_UHF
    Serial.println("[UHF CONFIG] Iniciando Leitura Continua (CMD 0x27)...");
    #endif
    
    sendFrame(TYPE_COMMAND, 0x27, pollParams, sizeof(pollParams));
}

void R200Reader::stopInventory() {
    #if DEBUG_UHF
    Serial.println("[UHF CONFIG] Parando Leitura Continua (CMD 0x28)...");
    #endif
    
    sendFrame(TYPE_COMMAND, 0x28);
    delay(50);
    while (_stream.available()) _stream.read();
}

void R200Reader::processBuffer(std::vector<String>& tagList) {
    while (_stream.available() > 0) {
        // Se o byte não for 0xAA (Nosso Header Python), é lixo.
        if (_stream.peek() != FRAME_HEADER) {
            uint8_t lixo = _stream.read();
            #if DEBUG_UHF
            Serial.printf("[UHF RX RAW] Byte ignorado (Nao e 0xAA): %02X\n", lixo);
            #endif
            continue;
        }

        // Aguarda ter pelo menos os 5 bytes básicos do cabeçalho
        if (_stream.available() < 5) return;

        uint8_t header = _stream.read(); // Sempre será 0xAA
        uint8_t type   = _stream.read();
        uint8_t cmd    = _stream.read();
        uint8_t lenH   = _stream.read();
        uint8_t lenL   = _stream.read();
        uint16_t paramLen = (lenH << 8) | lenL;
        constexpr uint16_t MAX_R200_PARAM_LEN = 64;
        constexpr uint16_t MAX_R200_EPC_LEN = 32;

        if (paramLen > MAX_R200_PARAM_LEN) {
            #if DEBUG_UHF
            Serial.printf("[UHF RX ERRO] paramLen inválido (%u > %u). Frame descartado.\n", paramLen, MAX_R200_PARAM_LEN);
            #endif
            continue;
        }

        unsigned long inicioEspera = millis();
        // Aguarda no máximo 5ms pelo restante do frame (evita jitter no motor de passo)
        while (_stream.available() < paramLen + 2) {
            if (millis() - inicioEspera > 5) {
                #if DEBUG_UHF
                Serial.printf("[UHF RX ERRO] Timeout. Esperava %d bytes, buffer tinha %d.\n", (paramLen + 2), _stream.available());
                #endif
                break;
            }
        }

        if (_stream.available() < paramLen + 2) break;

        uint8_t params[MAX_R200_PARAM_LEN];
        if (paramLen > 0) {
            _stream.readBytes(params, paramLen);
        }
        uint8_t checksum = _stream.read();
        uint8_t endByte  = _stream.read();

        #if DEBUG_UHF
        Serial.printf("[UHF RX PACOTE] Type:%02X | Cmd:%02X | Len:%d | CS:%02X | End:%02X\n", type, cmd, paramLen, checksum, endByte);
        if (paramLen > 0) {
            Serial.print("  -> Payload: ");
            for(uint16_t i=0; i<paramLen; i++) Serial.printf("%02X ", params[i]);
            Serial.println();
        }
        #endif

        if (endByte != FRAME_END) {
            #if DEBUG_UHF
            Serial.println("[UHF RX ERRO] Frame descartado. Byte final incorreto (Diferente de 0xDD).");
            #endif
            continue;
        }

        // Valida checksum do protocolo R200: soma de (type, cmd, lenH, lenL, params...) & 0xFF
        uint32_t sum = type + cmd + lenH + lenL;
        for (uint16_t i = 0; i < paramLen; i++) {
            sum += params[i];
        }
        uint8_t expectedCs = static_cast<uint8_t>(sum & 0xFF);
        if (checksum != expectedCs) {
            #if DEBUG_UHF
            Serial.printf("[UHF RX ERRO] Checksum inválido (recebido %02X, esperado %02X).\n", checksum, expectedCs);
            #endif
            continue;
        }

        // Filtra Notificação de Tag Detectada do protocolo Python que testamos
        if (type == TYPE_NOTIFICATION && cmd == 0x22 && paramLen >= 5) {
            uint8_t rssi = params[0];
            uint16_t epcLen = paramLen - 5;
            if (epcLen == 0 || epcLen > MAX_R200_EPC_LEN) {
                continue;
            }
            char epcStr[MAX_R200_EPC_LEN * 2 + 1];
            for (uint16_t i = 0; i < epcLen; i++) {
                sprintf(&epcStr[i * 2], "%02X", params[3 + i]);
            }
            epcStr[epcLen * 2] = '\0';

            String tagHex = String(epcStr);
            
            #if DEBUG_UHF
            Serial.printf("[TAG LIDA!] EPC: %s | RSSI: %02X\n", tagHex.c_str(), rssi);
            #endif
            
            bool exists = false;
            for (const auto& t : tagList) {
                if (t == tagHex) { exists = true; break; }
            }
            if (!exists) tagList.push_back(tagHex);
        }
    }
}