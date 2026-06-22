#pragma once
#include <Arduino.h>

enum class AuthState {
    IDLE,
    GRANTED,
    DENIED,
    PENDING_CLOUD,
    TIMEOUT_CLOUD,
    ERROR_OFFLINE
};

class AuthHandler {
public:
    static void init();
    static void update();
    static AuthState requestAccess(const char* uid);
    static AuthState getAsyncStatus();
    static void processCloudResponse(const char* uid, bool isAuthorized);
    
    // CORREÇÃO: Sintaxe C++ correta para métodos estáticos
    static const char* getLastUser();

private:
    static AuthState currentState;
    static unsigned long cloudRequestStartTime;
    static const unsigned long CLOUD_TIMEOUT_MS = 3000; 
    static char pendingUid[16]; 
};