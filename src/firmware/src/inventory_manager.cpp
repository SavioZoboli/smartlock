#include "inventory_manager.h"
#include "rfid_uhf_handler.h"
#include "auth_handler.h"
#include "hardware_io_handler.h"
#include <ArduinoJson.h>

bool InventoryManager::isScanning = false;
unsigned long InventoryManager::scanEndTime = 0;
bool InventoryManager::flagFinished = false;

std::set<std::string> InventoryManager::inventarioAnterior;
std::set<std::string> InventoryManager::inventarioAtual;

void InventoryManager::startScanFor(unsigned long durationMs) {
    UhfHandler::startInventory(); // Liga a antena do gavetão
    isScanning = true;
    scanEndTime = millis() + durationMs;
    flagFinished = false;
    Serial.println("[INVENTORY] Varredura pós-fechamento iniciada.");
}

void InventoryManager::update() {
    flagFinished = false; // Reseta a flag do loop principal

    if (isScanning) {
        if (millis() >= scanEndTime) {
            UhfHandler::stopInventory(); // Desliga a antena
            isScanning = false;
            flagFinished = true; // Avisa a main que terminou
            Serial.println("[INVENTORY] Varredura concluída.");
        }
    }
}

bool InventoryManager::scanJustFinished() {
    return true; //Remover quando chegar o leitor de RFID
    return flagFinished;
}

String InventoryManager::generateAuditPayload() {
    // Recupera o JSON sujo gerado pelo leitor UHF (Ex: ["EPC1", "EPC2"])
    String epcArray = UhfHandler::getInventoryPayload();
    
    // Recupera o último crachá que destrancou a porta
    const char* user = AuthHandler::getLastUser();

    // Monta o Payload Absoluto (Snapshot) para o Node-RED.
    // O Node-RED usará o Node de "Diff" para comparar isso com a última 
    // leitura do banco e gerar a tabela de movimentações com a timestamp do servidor.
    String payload = "{";
    payload += "\"usuario\":\"" + String(user) + "\",";
    payload += "\"equipamentos\":" + epcArray;
    payload += "}";

    return payload;
}

std::vector<EventoMovimentacao> InventoryManager::calculateDiff() {
    std::vector<EventoMovimentacao> eventos;

    // Detectar RETIRADAS: Estava antes, não está agora
    for (const auto& epc : inventarioAnterior) {
        if (inventarioAtual.find(epc) == inventarioAtual.end()) {
            eventos.push_back({epc, "RETIRADA"});
        }
    }

    // Detectar DEVOLUÇÕES: Não estava antes, está agora
    for (const auto& epc : inventarioAtual) {
        if (inventarioAnterior.find(epc) == inventarioAnterior.end()) {
            eventos.push_back({epc, "DEVOLUCAO"});
        }
    }
    return eventos;
}

String InventoryManager::serializeEvents(const std::vector<EventoMovimentacao>& eventos) {
    StaticJsonDocument<1024> doc;
    JsonArray array = doc.createNestedArray("eventos");
    for (const auto& e : eventos) {
        JsonObject obj = array.createNestedObject();
        obj["epc"] = e.epc.c_str();
        obj["tipo"] = e.tipo;
    }
    String output;
    serializeJson(doc, output);
    return output;
}

void InventoryManager::commitInventory() {
    inventarioAnterior = inventarioAtual;
    // Opcional: Salvar inventarioAnterior na Flash para persistência pós-reboot
}