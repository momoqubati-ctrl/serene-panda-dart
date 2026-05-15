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
