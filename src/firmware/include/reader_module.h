#pragma once
#include <Arduino.h>
#include <vector>
#include <set>
#include <string>

class ReaderModule {
public:
    static void init();
    static void update();

    static bool beginReading();
    static bool getIsReading();
    
    // Retorna true exatamente no ciclo em que a leitura terminou
    static bool scanJustFinished();
    static bool wasSuccess();

    // Métodos de integração com o InventoryManager
    static String getInventoryPayload();
    static void populateCurrentInventory(std::set<std::string>& currentSet);

    // Consulta direta
    static const std::vector<String>& getTags();
    static size_t getTagCount();
    static void clearTags();

    static void sendCommand(const char* command);

private:
    static bool isReading;
    static bool justFinished;
    static bool scanSuccess;
    static std::vector<String> collectedTags;
    static String rxLineBuffer;

    static void processLine(const String& line);
    static void drainRxBurst();
};