#include "reader_module.h"
#include "config.h"

bool ReaderModule::isReading = false;
bool ReaderModule::justFinished = false;
bool ReaderModule::scanSuccess = false;
std::vector<String> ReaderModule::collectedTags;
String ReaderModule::rxLineBuffer = "";

// UART1 configurada no config.h
HardwareSerial LinkSlave(1);

void ReaderModule::init() {
    LinkSlave.begin(115200, SERIAL_8N1, PIN_RX_LINK, PIN_TX_LINK);
    
    collectedTags.reserve(50);
    rxLineBuffer.reserve(64);

    Serial.println("[MASTER] Link serial inter-chip iniciado.");
    sendCommand("CMD:GO_HOME");
}

void ReaderModule::sendCommand(const char* command) {
    Serial.printf("[MASTER -> SLAVE] %s\n", command);
    LinkSlave.println(command);
}

bool ReaderModule::beginReading() {
    if (isReading) {
        return false;
    }

    clearTags();
    isReading = true;
    justFinished = false;
    scanSuccess = false;
    Serial.println("[MASTER] Solicitando varredura ao Slave...");
    sendCommand("CMD:BEGIN_SCAN");
    return true;
}

bool ReaderModule::getIsReading() {
    return isReading;
}

bool ReaderModule::scanJustFinished() {
    if (justFinished) {
        justFinished = false; // Consumo em pulso único (One-shot)
        return true;
    }
    return false;
}

bool ReaderModule::wasSuccess() {
    return scanSuccess;
}

const std::vector<String>& ReaderModule::getTags() {
    return collectedTags;
}

size_t ReaderModule::getTagCount() {
    return collectedTags.size();
}

void ReaderModule::clearTags() {
    collectedTags.clear();
}

// Gera o array JSON: ["EPC1", "EPC2", ...] consumido pelo generateAuditPayload()
String ReaderModule::getInventoryPayload() {
    String jsonArray = "[";
    for (size_t i = 0; i < collectedTags.size(); ++i) {
        jsonArray += "\"" + collectedTags[i] + "\"";
        if (i + 1 < collectedTags.size()) {
            jsonArray += ",";
        }
    }
    jsonArray += "]";
    return jsonArray;
}

// Preenche o std::set<std::string> do InventoryManager::inventarioAtual
void ReaderModule::populateCurrentInventory(std::set<std::string>& currentSet) {
    currentSet.clear();
    for (const auto& tag : collectedTags) {
        currentSet.insert(std::string(tag.c_str()));
    }
}

void ReaderModule::processLine(const String& line) {
    if (line.startsWith("TAG:")) {
        String epc = line.substring(4);
        
        bool exists = false;
        for (const auto& tag : collectedTags) {
            if (tag == epc) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            collectedTags.push_back(epc);
            Serial.printf("[MASTER] Tag recebida [%u]: %s\n", collectedTags.size(), epc.c_str());
        }
    } 
    else if (line == "STATUS:DONE") {
        Serial.printf("[MASTER] Varredura completa. %u tags lidas.\n", collectedTags.size());
        isReading = false;
        scanSuccess = true;  // SUCESSO!
        justFinished = true;
    } 
    else if (line == "STATUS:ERROR") {
        Serial.println("[MASTER] Erro mecânico reportado pelo Slave.");
        isReading = false;
        scanSuccess = false; // ERRO!
        justFinished = true; 
    }
    else if (line == "STATUS:HOME_OK") {
        Serial.println("[MASTER] Slave posicionado na Home.");
    }
}

void ReaderModule::drainRxBurst() {
    unsigned long lastByteTime = millis();
    const unsigned long BURST_TIMEOUT_MS = 150;

    while (millis() - lastByteTime < BURST_TIMEOUT_MS) {
        while (LinkSlave.available()) {
            char c = static_cast<char>(LinkSlave.read());
            lastByteTime = millis();

            if (c == '\n') {
                rxLineBuffer.trim();
                if (rxLineBuffer.length() > 0) {
                    processLine(rxLineBuffer);
                }
                rxLineBuffer = "";
            } else if (c != '\r') {
                rxLineBuffer += c;
            }
        }
    }
}

void ReaderModule::update() {
    if (LinkSlave.available()) {
        drainRxBurst();
    }
}