#pragma once

#include <Arduino.h>

enum class SystemState
{
    INITIALIZING,
    IDLE,
    AWAITING_CLOUD,
    IN_PROCESS,
    READING,

};

class StateHandler
{
public:
    static void init();

    static void setState(SystemState state);

    static SystemState getState();

    static String getStateString();

private:
    static SystemState estadoAtual;
};