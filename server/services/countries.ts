const SUPPORTED_COUNTRIES = new Set([
  "SA",
  "YE",
  "EG",
  "KW",
  "AE",
  "QA",
  "BH",
  "OM",
  "JO",
  "IQ",
  "SY",
  "LB",
  "PS",
  "MA",
  "DZ",
  "TN",
  "LY",
  "SD",
  "SO",
  "TR",
  "US",
  "GB",
  "DE",
  "FR",
  "NL",
  "SE",
  "IT",
  "ES",
  "CA",
  "AU",
]);

export const normalizeCountryCode = (value?: string) => {
  const code = String(value || "").trim().toUpperCase();
  return SUPPORTED_COUNTRIES.has(code) ? code : "SA";
};
