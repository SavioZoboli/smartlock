#include "time_handler.h"
#include "wifi_handler.h"
#include <Arduino.h>

const char *Time::ntp_server = "pool.ntp.org";
long Time::gmtOffset = -3 * 3600;
int Time::dayLightOffset = 0;

bool Time::sync_status = false;
bool Time::ntp_iniciado = false;
unsigned long Time::ultimaChecagemMs = 0;
unsigned long Time::ultimaConfigMs = 0;

namespace
{
    const unsigned long NTP_CHECK_INTERVAL_MS = 5000;
    const unsigned long NTP_RECONFIG_INTERVAL_MS = 60000;
}

void Time::init()
{
    sync_status = false;
    ntp_iniciado = false;
    ultimaChecagemMs = 0;
    ultimaConfigMs = 0;

    if (WiFiHandler::isConnected())
    {
        iniciarNTP();
    }
}

void Time::iniciarNTP()
{
    Serial.println("[NTP] Solicitando sincronização assíncrona...");
    configTime(gmtOffset, dayLightOffset, ntp_server);
    ntp_iniciado = true;
    ultimaConfigMs = millis();
    ultimaChecagemMs = millis();
}

void Time::update()
{
    if (sync_status || !WiFiHandler::isConnected())
    {
        return;
    }

    unsigned long agora = millis();

    if (!ntp_iniciado || (agora - ultimaConfigMs >= NTP_RECONFIG_INTERVAL_MS))
    {
        iniciarNTP();
    }

    if (agora - ultimaChecagemMs >= NTP_CHECK_INTERVAL_MS)
    {
        ultimaChecagemMs = agora;
        struct tm timeinfo;
        // Timeout 0ms: verificação totalmente não bloqueante
        if (getLocalTime(&timeinfo, 0))
        {
            sync_status = true;
            Serial.println("[NTP] Relógio sincronizado com sucesso!");
            Serial.println(&timeinfo, "[NTP] Data/Hora atual: %d/%m/%Y %H:%M:%S");
        }
    }
}

bool Time::is_sync()
{
    return sync_status;
}

unsigned long Time::getUnixTimestamp()
{
    if (!sync_status)
    {
        return 0;
    }
    time_t now = time(nullptr);
    return now > 0 ? static_cast<unsigned long>(now) : 0;
}