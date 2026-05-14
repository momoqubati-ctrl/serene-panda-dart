import { defineEventHandler, readBody } from "h3";
import { db } from "~/server/db";

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { username, password } = body;

    // Simple validation
    if (!username || !password) {
      return {
        success: false,
        message: "اسم المستخدم وكلمة المرور مطلوبان",
      };
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return {
        success: false,
        message: "اسم المستخدم غير صحيح",
      };
    }

    // In a real app, you would compare hashed passwords
    // For now, we'll do a simple comparison (NOT SECURE - for demo only)
    if (user.password !== password) {
      return {
        success: false,
        message: "كلمة المرور غير صحيحة",
      };
    }

    // Return user data (excluding password)
    const { password: _, ...userWithoutPassword } = user;

    return {
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      user: userWithoutPassword,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "حدث خطأ أثناء تسجيل الدخول",
    };
  }
});