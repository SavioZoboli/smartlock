#include "auth_handler.h"
#include "mqtt_handler.h" 
#include "wifi_handler.h" 
#include "storage_handler.h" // CORREÇÃO: Agora ele fala com o Storage!

// Variáveis encapsuladas com segurança
namespace {
    char lastAuthorizedUser[16] = "DESCONHECIDO";
}

AuthState AuthHandler::currentState = AuthState::IDLE;
unsigned long AuthHandler::cloudRequestStartTime = 0;
char AuthHandler::pendingUid[16] = {0};

void AuthHandler::init() {
    // CORREÇÃO: Removido o uso de Preferences daqui. 
    Serial.println("[AUTH] Serviço de autenticação pronto.");
}

AuthState AuthHandler::requestAccess(const char* uid) {
    // 1. TENTA O CACHE LOCAL PRIMEIRO (Delega pro Storage)
    DbResult localAccess = StorageHandler::getUserAccess(uid); 

    if (localAccess == DbResult::AUTHORIZED) {
        Serial.printf("[AUTH] Acesso CONCEDIDO via Storage: %s\n", uid);
        strncpy(lastAuthorizedUser, uid, sizeof(lastAuthorizedUser));
        return AuthState::GRANTED;
    } 
    else if (localAccess == DbResult::DENIED) {
        Serial.printf("[AUTH] Acesso NEGADO via Storage: %s\n", uid);
        return AuthState::DENIED;
    }

    // 2. SE NÃO ESTÁ NO CACHE, VAMOS PARA A NUVEM
    if (!WiFiHandler::isConnected()) {
        Serial.printf("[AUTH] UID %s desconhecida e sistema OFFLINE. Acesso Negado.\n", uid);
        return AuthState::ERROR_OFFLINE;
    }

    char payload[64];
    snprintf(payload, sizeof(payload), "{\"uid\":\"%s\"}", uid);
    MqttHandler::publish("usuarios", "login_request", payload);
    
    strncpy(pendingUid, uid, sizeof(pendingUid));
    cloudRequestStartTime = millis();
    currentState = AuthState::PENDING_CLOUD;
    
    Serial.printf("[AUTH] UID %s desconhecida. Consultando Servidor...\n", uid);
    return AuthState::PENDING_CLOUD;
}

void AuthHandler::update() {
    if (currentState == AuthState::PENDING_CLOUD) {
        if (millis() - cloudRequestStartTime >= CLOUD_TIMEOUT_MS) {
            Serial.println("[AUTH] Timeout: O servidor demorou demais.");
            currentState = AuthState::TIMEOUT_CLOUD;
            pendingUid[0] = '\0'; 
        }
    }
}

AuthState AuthHandler::getAsyncStatus() {
    return currentState;
}

void AuthHandler::processCloudResponse(const char* uid, bool isAuthorized) {
    if (currentState == AuthState::PENDING_CLOUD && strcmp(pendingUid, uid) == 0) {
        if (isAuthorized) {
            currentState = AuthState::GRANTED;
            strncpy(lastAuthorizedUser, uid, sizeof(lastAuthorizedUser));
            StorageHandler::saveUserAccess(uid); // Delega pro Storage
        } else {
            currentState = AuthState::DENIED;
            StorageHandler::saveUserAccess(uid); 
        }
        pendingUid[0] = '\0'; 
    }
}

const char* AuthHandler::getLastUser() {
    return lastAuthorizedUser;
}