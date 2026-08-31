#include "inventory_manager.h"
#include "auth_handler.h"
#include "hardware_io_handler.h"
#include "reader_module.h"
#include <ArduinoJson.h>


std::set<std::string> InventoryManager::inventarioAnterior;
std::set<std::string> InventoryManager::inventarioAtual;


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
    // Aumentei levemente o buffer para garantir espaço para a chave do usuário
    StaticJsonDocument<1024> doc; 
    
    // 1. Busca o último usuário autorizado que abriu a porta
    const char* user = AuthHandler::getLastUser();
    doc["usuario"] = user;

    // 2. Cria o array de eventos de retirada/devolução
    JsonArray array = doc.createNestedArray("eventos");
    for (const auto& e : eventos) {
        JsonObject obj = array.createNestedObject();
        obj["epc"] = e.epc.c_str();
        obj["tipo"] = e.tipo; // "RETIRADA" ou "DEVOLUCAO"
    }
    
    String output;
    serializeJson(doc, output);
    return output;
}

void InventoryManager::commitInventory() {
    inventarioAnterior = inventarioAtual;
    // Opcional: Salvar inventarioAnterior na Flash para persistência pós-reboot
}