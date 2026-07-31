#pragma once
#include <Arduino.h>

enum class SystemState
{
    INITIALIZING,
    IDLE,
    AWAITING_CLOUD,
    IN_PROCESS,
    READING,
    PROVISIONANDO
};

struct Unidade
{
    int codigo;
    String nome;
};

class System
{
public:
    static void init();

    static bool isProvisionado();

    static void setWifiOnline(bool is_online);
    static void setMqttOnline(bool is_online);

    static void setState(SystemState state);

    static SystemState getState();

    static String getStateString();

    static String getSystemTitle();

    static void updateProvisionamento();

    static bool salvarConfiguracao(int codigo, String apelido, int codUnidade, String nomeUnidade);

private:
    static int _codigo;
    static String _apelido;
    static bool _wifi_online;
    static bool _mqtt_online;
    static SystemState _estadoAtual;
    static Unidade _unidade;
    static bool _is_provisionado;

    static void iniciarProvisionamento();
};