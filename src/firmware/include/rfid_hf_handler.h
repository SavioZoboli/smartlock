#pragma once
#include <Arduino.h>

class RfidHfHandler {
public:
    // Inicializa o barramento SPI e o chip MFRC522
    static void init();

    // Verifica se há um cartão na leitora.
    // Retorna 'true' e preenche o buffer com a UID (em Hexadecimal) se ler com sucesso.
    // O uso de char* evita o vazamento de memória (Heap Fragmentation).
    static bool readTag(char* uidBuffer, size_t maxLen);

private:
    // Rotina nativa de auto-cura (Self-Healing) do hardware
    static void checkHealth();
};