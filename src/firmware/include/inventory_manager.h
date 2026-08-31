#pragma once
#include <Arduino.h>
#include <vector>
#include <string>
#include <set>

struct EventoMovimentacao
{
    std::string epc;
    String tipo; // "RETIRADA" ou "DEVOLUCAO"
};

class InventoryManager
{
public:
    static std::set<std::string> inventarioAtual;

    // Gera a lista de eventos baseada na diferença das leituras
    static std::vector<EventoMovimentacao> calculateDiff();

    // Limpa o cache após o envio bem-sucedido
    static void commitInventory();

    static String serializeEvents(const std::vector<EventoMovimentacao> &eventos);

private:
    static bool isScanning;
    static unsigned long scanEndTime;
    static bool flagFinished;
    static std::set<std::string> inventarioAnterior;
};