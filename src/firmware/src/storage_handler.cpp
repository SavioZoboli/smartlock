#include "storage_handler.h"

// Inicialização dos membros estáticos
Preferences StorageHandler::userDb;
const char* StorageHandler::QUEUE_DIR = "/queue";

void StorageHandler::init() {
    // 1. Inicia o banco de usuários
    userDb.begin("users", false);
    
    // 2. Inicia o sistema de arquivos para a Fila
    if (!LittleFS.begin(true)) {
        Serial.println("[STORAGE] Falha ao montar LittleFS!");
        return;
    }
    
    if (!LittleFS.exists(QUEUE_DIR)) {
        LittleFS.mkdir(QUEUE_DIR);
    }
    Serial.println("[STORAGE] Armazenamento iniciado com sucesso.");
}

// --- MÉTODOS DE USUÁRIOS ---
DbResult StorageHandler::getUserAccess(const char* uid) {
    uint8_t status = userDb.getUChar(uid, 255);
    if (status == 1) return DbResult::AUTHORIZED;
    if (status == 0) return DbResult::DENIED;
    return DbResult::NOT_FOUND;
}

void StorageHandler::saveUserAccess(const char* uid) {
    userDb.putString(uid, "");
}

// --- MÉTODOS DE FILA (FIFO com LittleFS) ---

bool StorageHandler::pushEventToQueue(const char* jsonPayload) {
    // Nome do arquivo baseado em tempo para garantir unicidade e ordem
    String filename = String(QUEUE_DIR) + "/" + String(millis()) + ".json";
    
    File file = LittleFS.open(filename, FILE_WRITE);
    if (!file) return false;
    
    file.print(jsonPayload);
    file.close();
    Serial.printf("[STORAGE] Evento enfileirado: %s\n", filename.c_str());
    return true;
}

bool StorageHandler::hasPendingEvents() {
    File root = LittleFS.open(QUEUE_DIR);
    File file = root.openNextFile();
    bool exists = (bool)file;
    file.close();
    root.close();
    return exists;
}

String StorageHandler::popEventFromQueue() {
    File root = LittleFS.open(QUEUE_DIR);
    File oldestFile = root.openNextFile(); // Pega o primeiro arquivo na pasta
    
    if (!oldestFile) return "";

    String path = oldestFile.path();
    String content = oldestFile.readString();
    
    oldestFile.close();
    root.close();
    
    LittleFS.remove(path); // Remove o arquivo após a leitura (FIFO)
    Serial.printf("[STORAGE] Evento despachado e removido: %s\n", path.c_str());
    
    return content;
}