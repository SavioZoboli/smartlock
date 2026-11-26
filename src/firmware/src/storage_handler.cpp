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
    userDb.putUChar(uid, 1);
}

void StorageHandler::clearUsers() {
    userDb.clear();
    Serial.println("[STORAGE] Cache local de usuários limpo.");
}

// --- MÉTODOS DE FILA (FIFO com LittleFS) ---

bool StorageHandler::pushEventToQueue(const char* jsonPayload) {
    // Contador monotônico persistido em NVS garante ordem FIFO real e evita colisões pós-reboot
    Preferences queueMeta;
    uint32_t seq = 1;
    if (queueMeta.begin("qmeta", false)) {
        seq = queueMeta.getUInt("seq", 0) + 1;
        queueMeta.putUInt("seq", seq);
        queueMeta.end();
    }

    char filename[48];
    snprintf(filename, sizeof(filename), "%s/%08lu.json", QUEUE_DIR, static_cast<unsigned long>(seq));

    File file = LittleFS.open(filename, FILE_WRITE);
    if (!file) return false;

    size_t written = file.print(jsonPayload);
    file.close();
    if (written == 0) {
        LittleFS.remove(filename);
        return false;
    }
    Serial.printf("[STORAGE] Evento enfileirado: %s\n", filename);
    return true;
}

bool StorageHandler::hasPendingEvents() {
    File root = LittleFS.open(QUEUE_DIR);
    if (!root || !root.isDirectory()) {
        if (root) root.close();
        return false;
    }
    File file = root.openNextFile();
    bool exists = (bool)file;
    if (file) file.close();
    root.close();
    return exists;
}

String StorageHandler::popEventFromQueue() {
    File root = LittleFS.open(QUEUE_DIR);
    if (!root || !root.isDirectory()) {
        if (root) root.close();
        return "";
    }

    // LittleFS não garante ordem cronológica no openNextFile():
    // escolhe sempre o menor nome lexicográfico (%08lu.json) para FIFO estrito.
    String oldestPath = "";
    File entry = root.openNextFile();
    while (entry) {
        if (!entry.isDirectory()) {
            String path = entry.path();
            if (oldestPath.length() == 0 || path < oldestPath) {
                oldestPath = path;
            }
        }
        entry.close();
        entry = root.openNextFile();
    }
    root.close();

    if (oldestPath.length() == 0) {
        return "";
    }

    File oldestFile = LittleFS.open(oldestPath, FILE_READ);
    if (!oldestFile) {
        return "";
    }

    String content = oldestFile.readString();
    oldestFile.close();

    LittleFS.remove(oldestPath); // Remove o arquivo após a leitura (FIFO)
    Serial.printf("[STORAGE] Evento despachado e removido: %s\n", oldestPath.c_str());

    return content;
}