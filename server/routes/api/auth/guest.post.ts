import { defineEventHandler, readBody } from "h3";
import { createGuestSession } from "../../../services/authService";
import { detectCountryCode } from "../../../services/requestCountry";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const username = typeof body?.username === "string" ? body.username : undefined;
  const countryCode = detectCountryCode(event);

  return {
    success: true,
    ...createGuestSession(username, countryCode),
  };
});
