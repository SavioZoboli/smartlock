import LogSmartlockController from "../controllers/logSmartlock.controller";
import SmartlockController from "../controllers/smartlock.controller";

export const roteiaMqttSistema = async (rota: string, mac: string, payload: any) => {
    const status = payload && typeof payload === "object" ? payload.status : undefined;
    console.log(`A rota ${rota} foi publicada pelo mac ${mac} com o payload ${status}`);

    switch (rota) {
        case 'status':
            if (typeof status !== 'string' || status.trim().length === 0) {
                console.warn(`[MQTT Sistema] Payload inválido em status de ${mac}`);
                return;
            }
            await LogSmartlockController.gravarLog(mac, status);
            break;
        case 'discover':
            await SmartlockController.whoami(mac);
            break;
    }
};