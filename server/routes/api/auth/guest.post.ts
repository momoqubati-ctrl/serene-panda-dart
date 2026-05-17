import { defineEventHandler, readBody } from "h3";
import { createGuestSession } from "../../../services/authService";
import { detectCountryCode } from "../../../services/requestCountry";
import { logAccess } from "../../../services/accessLogger";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const username = typeof body?.username === "string" ? body.username : undefined;
  const countryCode = detectCountryCode(event);

  const session = createGuestSession(username, countryCode);

  // تسجيل دخول زائر
  await logAccess({
    event,
    state: "دخول زائر",
    username: session.user.username,
    topic: session.user.name
  });

  return {
    success: true,
    ...session,
  };
});