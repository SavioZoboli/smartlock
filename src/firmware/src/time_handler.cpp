#include "time_handler.h"
#include "wifi_handler.h"

char *Time::ntp_server = "pool.ntp.org";
long Time::gmtOffset = -3 * 3600;
int Time::dayLightOffset = 0;

bool Time::sincronizando = false;
bool Time::sync_status = false;

void Time::init()
{
    sincronizando = false;
    if (WiFiHandler::isConnected())
    {
        configurarNTP();
    }
}

void Time::update()
{
    if (!Time::sync_status && WiFiHandler::isConnected() && !sincronizando)
    {
        configurarNTP();
    }
}

void Time::configurarNTP()
{
    Serial.print("[NTP] Iniciando a sincronizacao");
    sincronizando = true;
    configTime(gmtOffset, dayLightOffset, ntp_server);
    struct tm timeinfo;
    int tentativas = 0;
    while (!getLocalTime(&timeinfo) && tentativas < 10)
    {
        Serial.print(".");
        delay(1000);
        tentativas++;
    }
    Serial.println();

    sincronizando = false;

    if (tentativas < 10)
    {
        Serial.println("[NTP] Relogio sincronizado com sucesso!");
        // Imprime a hora só para você ver no Monitor Serial se deu certo
        Serial.println(&timeinfo, "[NTP] Data/Hora atual: %d/%m/%Y %H:%M:%S");
        sync_status = true;
    }
    else
    {
        Serial.println("[NTP] ERRO: Falha ao sincronizar o relogio.");
    }
}

bool Time::is_sync(){
    return sync_status;
}