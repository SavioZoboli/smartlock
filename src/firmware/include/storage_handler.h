#pragma once
#include <Arduino.h>
#include <LittleFS.h>
#include <Preferences.h>

// Enum para o status de autorização no banco de usuários
enum class DbResult { AUTHORIZED, DENIED, NOT_FOUND };

class StorageHandler {
public:
    static void init();

    // --- MÉTODOS DE USUÁRIOS (Preferences) ---
    static DbResult getUserAccess(const char* uid);
    static void saveUserAccess(const char* uid, bool isAuthorized);

    // --- MÉTODOS DE FILA DE EVENTOS (LittleFS / FIFO) ---
    static bool pushEventToQueue(const char* jsonPayload);
    static String popEventFromQueue(); // Retorna JSON e deleta o arquivo
    static bool hasPendingEvents();
    
private:
    static const char* QUEUE_DIR;
    // Preferences para a base de usuários
    static Preferences userDb; 
};