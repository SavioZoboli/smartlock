#pragma once
#include <time.h>

class Time{
    public:

    static void init();

    static bool is_sync();

    static void update();

    static unsigned long getUnixTimestamp();

    private:

    static void iniciarNTP();

    static bool sync_status;
    static bool ntp_iniciado;
    static unsigned long ultimaChecagemMs;
    static unsigned long ultimaConfigMs;

    static const char* ntp_server;
    static long gmtOffset;
    static int dayLightOffset;

};