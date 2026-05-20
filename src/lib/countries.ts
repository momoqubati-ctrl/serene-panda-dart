export type CountryOption = {
  code: string;
  name: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "SA", name: "السعودية" },
  { code: "YE", name: "اليمن" },
  { code: "EG", name: "مصر" },
  { code: "KW", name: "الكويت" },
  { code: "AE", name: "الإمارات" },
  { code: "QA", name: "قطر" },
  { code: "BH", name: "البحرين" },
  { code: "OM", name: "عمان" },
  { code: "JO", name: "الأردن" },
  { code: "IQ", name: "العراق" },
  { code: "SY", name: "سوريا" },
  { code: "LB", name: "لبنان" },
  { code: "PS", name: "فلسطين" },
  { code: "MA", name: "المغرب" },
  { code: "DZ", name: "الجزائر" },
  { code: "TN", name: "تونس" },
  { code: "LY", name: "ليبيا" },
  { code: "SD", name: "السودان" },
  { code: "SO", name: "الصومال" },
  { code: "TR", name: "تركيا" },
  { code: "US", name: "الولايات المتحدة" },
  { code: "GB", name: "بريطانيا" },
  { code: "DE", name: "ألمانيا" },
  { code: "FR", name: "فرنسا" },
  { code: "NL", name: "هولندا" },
  { code: "SE", name: "السويد" },
  { code: "IT", name: "إيطاليا" },
  { code: "ES", name: "إسبانيا" },
  { code: "CA", name: "كندا" },
  { code: "AU", name: "أستراليا" },
];

export const normalizeCountryCode = (value?: string) => {
  const code = String(value || "").trim().toUpperCase();
  return COUNTRY_OPTIONS.some((country) => country.code === code) ? code : "SA";
};

export const getCountryName = (value?: string) => {
  const code = normalizeCountryCode(value);
  return COUNTRY_OPTIONS.find((country) => country.code === code)?.name || code;
};

export const getCountryFlagSrc = (value?: string) => `/flag/${normalizeCountryCode(value).toLowerCase()}.png`;
