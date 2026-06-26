#include "state_handler.h"


SystemState StateHandler::estadoAtual;

void StateHandler::init(){
    estadoAtual = SystemState::INITIALIZING;
}

void StateHandler::setState(SystemState state){
    estadoAtual = state;
}

SystemState StateHandler::getState(){
    return estadoAtual;
}

String StateHandler::getStateString(){
    switch(estadoAtual) {
        case SystemState::INITIALIZING: return "INITIALIZING";
        case SystemState::IDLE:         return "IDLE";
        case SystemState::AWAITING_CLOUD:return "AWAITING_CLOUD";
        case SystemState::IN_PROCESS:   return "IN_PROCESS";
        case SystemState::READING:      return "READING";
        default:                        return "UNKNOWN_STATE";
    }
}

