#pragma once
#include <Arduino.h>

class HardwareIOHandler {
public:
    // Configura os pinos do relé e do sensor (Chamar no setup)
    static void init();

    // Maestro assíncrono: gerencia o tempo do relé e o filtro de ruído do sensor (Chamar no loop)
    static void update();

    // Destranca a porta e inicia o timer de 5 segundos
    static void unlockDoor();

    // Tranca a porta imediatamente (Pode ser chamado manualmente se necessário)
    static void lockDoor();

    // Retorna o estado atual da porta (true = Aberta, false = Fechada)
    static bool isDoorOpen();

    // Gatilho: Retorna 'true' APENAS no exato momento em que a porta acabou de ser fechada
    static bool doorJustClosed();
};