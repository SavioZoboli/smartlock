#pragma once
#include <Arduino.h>
#include <vector>
#include <Stream.h> // Interface genérica de fluxo de dados

class R200Reader {
public:
    // Agora aceita tanto HardwareSerial quanto SoftwareSerial
    R200Reader(Stream& port);
    
    void init();
    void setPower(uint8_t powerDbm); // Potência de 15 a 26 dBm
    
    void startInventory();
    void stopInventory();
    
    // Processa os bytes do buffer da UART e adiciona tags novas ao vetor
    void processBuffer(std::vector<String>& tagList);

private:
    Stream& _stream; // Referência genérica para a porta serial

    void sendFrame(uint8_t frameType, uint8_t cmd, const uint8_t* params = nullptr, uint16_t paramsLen = 0);
    uint8_t calcularChecksum(const uint8_t* body, size_t length);
};