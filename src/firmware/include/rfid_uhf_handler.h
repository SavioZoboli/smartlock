#pragma once
#include <Arduino.h>

class UhfHandler {
public:
    // Inicializa a Serial2 e configura o R200
    static void init();
    
    // Ajusta a potência da antena (15 a 26 dBm). Evita ler equipamentos de outras salas.
    static void setPower(uint8_t dbm);
    
    // Liga a antena e começa a registrar tudo o que está dentro do gavetão
    static void startInventory();
    
    // Desliga a antena (Poupa energia e evita aquecimento)
    static void stopInventory();
    
    // Maestro Assíncrono: Deve ser chamado no loop() livremente
    static void update();
    
    // Retorna as tags em formato JSON (Ex: ["EPC1", "EPC2"]) para enviar via MQTT
    static String getInventoryPayload();

private:
    // Funções internas para lidar com os comandos Hexadecimais
    static void sendCommand(uint8_t cmd, const uint8_t* data, uint8_t len);
    static void processPacket(uint8_t* buffer, uint8_t len);
    static void addTagIfNew(String epc);

    // Gerenciamento de Memória Offline (Máximo de 50 notebooks no gavetão)
    static const int MAX_TAGS = 50;
    static String tagsLidas[MAX_TAGS];
    static int numTagsLidas;
};