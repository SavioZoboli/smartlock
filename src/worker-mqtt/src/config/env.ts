import dotenv from "dotenv";

dotenv.config();

export const MQTT_PREFIX = (process.env.MQTT_PREFIX || "smartlock").trim();
export const URL_API = (process.env.URL_API || "").trim();
