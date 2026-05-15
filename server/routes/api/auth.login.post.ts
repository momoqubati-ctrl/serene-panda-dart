import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { loginMember } from "../../services/authService";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;

    if (typeof username !== "string" || typeof password !== "string" || !username.trim() || !password.trim()) {
      setResponseStatus(event, 400);
      return {
        success: false,
        code: "INVALID_LOGIN_INPUT",
        message: "اسم المستخدم وكلمة المرور مطلوبان",
      };
    }

    const result = await loginMember({ username, password });
    if (!result.ok) {
      setResponseStatus(event, 401);
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
    console.error("Login error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      code: "LOGIN_FAILED",
      message: "حدث خطأ أثناء تسجيل الدخول",
    };
  }
});
