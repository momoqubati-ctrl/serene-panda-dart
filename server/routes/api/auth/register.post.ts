import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { registerMember } from "../../../services/authService";
import { detectCountryCode } from "../../../services/requestCountry";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;
    const countryCode = detectCountryCode(event);

    if (typeof username !== "string" || username.trim().length < 3) {
      setResponseStatus(event, 400);
      return {
        success: false,
        code: "INVALID_USERNAME",
        message: "اسم المستخدم يجب أن يكون 3 أحرف على الأقل",
      };
    }

    if (typeof password !== "string" || password.length < 6) {
      setResponseStatus(event, 400);
      return {
        success: false,
        code: "INVALID_PASSWORD",
        message: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      };
    }

    const result = await registerMember({ username, password, countryCode });
    if (!result.ok) {
      setResponseStatus(event, 409);
      return {
        success: false,
        code: result.code,
        message: result.message,
      };
    }

    return {
      success: true,
      ...result.session,
    };
  } catch (error) {
    console.error("Register error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      code: "REGISTER_FAILED",
      message: "حدث خطأ أثناء إنشاء الحساب",
    };
  }
});
