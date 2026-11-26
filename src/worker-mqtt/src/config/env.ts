import dotenv from "dotenv";

dotenv.config();

export const MQTT_PREFIX = (process.env.MQTT_PREFIX || "smartlock").trim();
export const URL_API = (process.env.URL_API || "").trim();
export const INTERNAL_API_KEY = (process.env.INTERNAL_API_KEY || "").trim();

export function getInternalHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (INTERNAL_API_KEY) {
    headers["x-internal-key"] = INTERNAL_API_KEY;
  }
  return headers;
}
