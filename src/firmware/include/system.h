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

    // Chamado a cada loop() — trata sync em background pendente
    static void update();

    static bool isProvisionado();

    static void setWifiOnline(bool is_online);
    static void setMqttOnline(bool is_online);

    static void setState(SystemState state);

    static SystemState getState();

    static String getStateString();

    static String getSystemTitle();

    static void updateProvisionamento();

    // Usado no fluxo de PROVISIONANDO (primeira config, sem dado local ainda)
    static bool salvarConfiguracao(int codigo, String apelido, int codUnidade, String nomeUnidade);

    // Usado na sincronização em background (já tem config local, só revalida)
    static bool atualizarConfiguracao(int codigo, String apelido, int codUnidade, String nomeUnidade);

private:
    static int _codigo;
    static String _apelido;
    static bool _wifi_online;
    static bool _mqtt_online;
    static SystemState _estadoAtual;
    static Unidade _unidade;
    static bool _is_provisionado;

    // Fica true quando um pedido de sync em background precisa ser (re)enviado
    static bool _sync_pendente;

    static void iniciarProvisionamento();
    static void solicitarSincronizacaoBackground();

    // Função interna compartilhada: só grava em disco + RAM, não mexe em estado
    static bool persistirConfiguracao(int codigo, String apelido, int codUnidade, String nomeUnidade);
};