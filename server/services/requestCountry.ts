import { getRequestHeader, H3Event } from "h3";
import { normalizeCountryCode } from "./countries";

const COUNTRY_HEADER_KEYS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-country-code",
  "x-app-country",
];

export const detectCountryCode = (event: H3Event) => {
  for (const key of COUNTRY_HEADER_KEYS) {
    const value = getRequestHeader(event, key);
    if (value) return normalizeCountryCode(value);
  }

  const acceptLanguage = getRequestHeader(event, "accept-language") || "";
  const localeCountry = acceptLanguage.match(/[-_]([A-Za-z]{2})(?:[,;]|$)/)?.[1];
  return normalizeCountryCode(localeCountry);
};

export function getSocketIp(socket: any): string {
  const headers = socket.handshake.headers || {};
  
  const cfConnectingIp = headers["cf-connecting-ip"];
  if (typeof cfConnectingIp === "string" && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  const xForwardedFor = headers["x-forwarded-for"];
  if (typeof xForwardedFor === "string" && xForwardedFor.trim()) {
    const parts = xForwardedFor.split(",");
    if (parts.length > 0 && parts[0].trim()) {
      return parts[0].trim();
    }
  }

  const xRealIp = headers["x-real-ip"];
  if (typeof xRealIp === "string" && xRealIp.trim()) {
    return xRealIp.trim();
  }

  return socket.handshake.address || "";
}

export async function lookupCountryCodeByIp(ip: string): Promise<string> {
  let cleanIp = ip.trim();
  if (cleanIp.startsWith("::ffff:")) {
    cleanIp = cleanIp.substring(7);
  }
  if (
    !cleanIp || 
    cleanIp === "127.0.0.1" || 
    cleanIp === "localhost" || 
    cleanIp === "::1" || 
    cleanIp.startsWith("10.") || 
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("172.16.") ||
    cleanIp.startsWith("172.17.") ||
    cleanIp.startsWith("172.18.") ||
    cleanIp.startsWith("172.19.") ||
    cleanIp.startsWith("172.20.") ||
    cleanIp.startsWith("172.21.") ||
    cleanIp.startsWith("172.22.") ||
    cleanIp.startsWith("172.23.") ||
    cleanIp.startsWith("172.24.") ||
    cleanIp.startsWith("172.25.") ||
    cleanIp.startsWith("172.26.") ||
    cleanIp.startsWith("172.27.") ||
    cleanIp.startsWith("172.28.") ||
    cleanIp.startsWith("172.29.") ||
    cleanIp.startsWith("172.30.") ||
    cleanIp.startsWith("172.31.")
  ) {
    try {
      const res = await fetch("https://freeipapi.com/api/json");
      if (res.ok) {
        const data = await res.json();
        if (data && data.countryCode) {
          return normalizeCountryCode(data.countryCode);
        }
      }
    } catch (e) {
      console.error("[GeoIP] Local IP fallback query failed:", e);
    }
    return "SA";
  }

  try {
    const res = await fetch(`https://freeipapi.com/api/json/${cleanIp}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.countryCode) {
        return normalizeCountryCode(data.countryCode);
      }
    }
  } catch (e) {
    console.error(`[GeoIP] Failed to lookup country for IP ${cleanIp}:`, e);
  }

  return "SA";
}

