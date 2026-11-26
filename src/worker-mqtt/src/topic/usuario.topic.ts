import usuarioService from "../services/usuario.service";

export const usuarioRoutesMQTT = async (route: string, mac: string, payload: any) => {
    switch (route) {
        case 'login_request':
            if (!payload || typeof payload.uid !== 'string' || payload.uid.trim().length === 0) {
                console.warn(`[MQTT Usuario] Payload inválido em login_request de ${mac}`);
                return;
            }
            await usuarioService.loginRequest(mac, payload.uid);
            break;
        case 'sync_request':
            await usuarioService.syncList(mac);
            break;
    }
};
