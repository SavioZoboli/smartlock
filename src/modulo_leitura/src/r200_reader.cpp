#include "r200_reader.h"

R200Reader::R200Reader(HardwareSerial& port, uint8_t rxPin, uint8_t txPin, uint32_t baudRate)
    : _serial(port), _rxPin(rxPin), _txPin(txPin), _baudRate(baudRate) {}

void R200Reader::init() {
    _serial.begin(_baudRate, SERIAL_8N1, _rxPin, _txPin);
    delay(100);
}

void R200Reader::sendFrame(const uint8_t* cmd, size_t length) {
    _serial.write(cmd, length);
    _serial.flush();
}

void R200Reader::setPower(uint8_t powerDbm) {
    if (powerDbm < 15) powerDbm = 15;
    if (powerDbm > 26) powerDbm = 26;

    uint16_t powerVal = powerDbm * 100;
    uint8_t cmd[9] = {
        0xBB, 0x00, 0xB6, 0x00, 0x02,
        static_cast<uint8_t>((powerVal >> 8) & 0xFF),
        static_cast<uint8_t>(powerVal & 0xFF),
        0x00, 0x7E
    };

    uint8_t checksum = 0;
    for (int i = 1; i < 7; i++) {
        checksum += cmd[i];
    }
    cmd[7] = checksum;

    sendFrame(cmd, sizeof(cmd));
    delay(50);
}

void R200Reader::startInventory() {
    // Limpa o buffer de leitura anterior
    while (_serial.available()) {
        _serial.read();
    }
    const uint8_t startInventoryCmd[] = {0xBB, 0x00, 0x27, 0x00, 0x03, 0x22, 0xFF, 0xFF, 0x4A, 0x7E};
    sendFrame(startInventoryCmd, sizeof(startInventoryCmd));
}

void R200Reader::stopInventory() {
    const uint8_t stopInventoryCmd[] = {0xBB, 0x00, 0x28, 0x00, 0x00, 0x28, 0x7E};
    sendFrame(stopInventoryCmd, sizeof(stopInventoryCmd));
    delay(50);
    while (_serial.available()) {
        _serial.read();
    }
}

void R200Reader::processBuffer(std::vector<String>& tagList) {
    while (_serial.available() >= 7) {
        if (_serial.peek() != 0xBB) {
            _serial.read(); // Alinhamento de cabeçalho
            continue;
        }

        uint8_t header  = _serial.read();
        uint8_t type    = _serial.read();
        uint8_t cmd     = _serial.read();
        uint8_t lenHigh = _serial.read();
        uint8_t lenLow  = _serial.read();
        uint16_t dataLen = (lenHigh << 8) | lenLow;

        if (_serial.available() < dataLen + 2) {
            break; // Frame incompleto no buffer
        }

        uint8_t payload[dataLen];
        _serial.readBytes(payload, dataLen);
        uint8_t checksum = _serial.read();
        uint8_t endByte  = _serial.read();

        // Frame de detecção (cmd == 0x22)
        if (cmd == 0x22 && dataLen > 5) {
            uint16_t epcLength = dataLen - 5;
            char epcStr[epcLength * 2 + 1];
            for (uint16_t i = 0; i < epcLength; i++) {
                sprintf(&epcStr[i * 2], "%02X", payload[3 + i]);
            }
            epcStr[epcLength * 2] = '\0';

            String tagHex = String(epcStr);

            bool exists = false;
            for (const auto& t : tagList) {
                if (t == tagHex) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                tagList.push_back(tagHex);
            }
        }
    }
}