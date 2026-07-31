#pragma once
#include <time.h>

class Time{
    public:

    static void init();

    static bool is_sync();

    static void update();

    private:

    static void configurarNTP();

    static bool sync_status;
    static bool sincronizando;

    static char* ntp_server;
    static long gmtOffset;
    static int dayLightOffset;

};