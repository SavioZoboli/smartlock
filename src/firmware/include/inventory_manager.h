#pragma once
#include <Arduino.h>
#include <vector>
#include <string>
#include <set>

struct EventoMovimentacao {
    std::string epc;
    String tipo; // "RETIRADA" ou "DEVOLUCAO"
};


class InventoryManager {
public:

    // Chamado na main.cpp quando a porta acaba de fechar
    static void startScanFor(unsigned long durationMs);
    
    // Roda no loop para gerenciar o tempo do R200
    static void update();
    
    // Retorna true exatamente no ciclo em que o R200 desliga
    static bool scanJustFinished();
    
    // Gera o Payload final juntando o Inventário com o Usuário
    static String generateAuditPayload();

    // Gera a lista de eventos baseada na diferença das leituras
    static std::vector<EventoMovimentacao> calculateDiff();
    
    // Limpa o cache após o envio bem-sucedido
    static void commitInventory();

    static String serializeEvents(const std::vector<EventoMovimentacao>& eventos);

private:
    static bool isScanning;
    static unsigned long scanEndTime;
    static bool flagFinished;
    static std::set<std::string> inventarioAnterior;
    static std::set<std::string> inventarioAtual;
};