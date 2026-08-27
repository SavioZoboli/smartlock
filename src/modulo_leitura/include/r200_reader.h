#pragma once
#include <Arduino.h>
#include <vector>

class R200Reader {
public:
    R200Reader(HardwareSerial& port, uint8_t rxPin, uint8_t txPin, uint32_t baudRate = 115200);
    
    void init();
    void setPower(uint8_t powerDbm); // Potência de 15 a 26 dBm
    
    void startInventory();
    void stopInventory();
    
    // Processa os bytes do buffer da UART e adiciona tags novas ao vetor
    void processBuffer(std::vector<String>& tagList);

private:
    HardwareSerial& _serial;
    uint8_t _rxPin;
    uint8_t _txPin;
    uint32_t _baudRate;

    void sendFrame(const uint8_t* cmd, size_t length);
};