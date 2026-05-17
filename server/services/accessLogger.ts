import { dbPool } from "../db";
import { H3Event, getRequestHeader } from "h3";
import { detectCountryCode } from "./requestCountry";

export type LogState = 
  | "دخول" 
  | "خروج" 
  | "تخمين باسورد" 
  | "دخول زائر" 
  | "تسجيل عضوية" 
  | "محاولة دخول محظور"
  | "تغيير اسم";

interface LogParams {
  event: H3Event;
  state: LogState;
  username: string;
  topic?: string;
  isin?: string; // المصدر أو الغرفة
}

/**
 * يقوم بتسجيل حركة في جدول logs القديم
 */
export const logAccess = async (params: LogParams) => {
  const { event, state, username, topic, isin } = params;
  
  try {
    const ip = getRequestHeader(event, "x-forwarded-for") || 
               getRequestHeader(event, "x-real-ip") || 
               "127.0.0.1";
    
    const countryCode = detectCountryCode(event);
    const userAgent = getRequestHeader(event, "user-agent") || "Unknown";
    
    // تنظيف الـ User Agent ليكون أقصر (كما في النظام القديم)
    const device = userAgent.split(')')[0].replace('Mozilla/5.0 (', '').slice(0, 255);

    await dbPool.query(
      `INSERT INTO logs (state, topic, username, ip, code, device, isin, "time")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        state,
        topic || username,
        username,
        ip,
        countryCode,
        device,
        isin || "1", // 1 تعني الموقع بشكل عام في النظام القديم
        String(Date.now())
      ]
    );

    // الحفاظ على آخر 150 سجل فقط (اختياري، لكنه يحاكي سلوك النظام القديم)
    // سنتركه للـ Cron job أو عملية تنظيف دورية لاحقاً لضمان الأداء
  } catch (error) {
    console.error("Failed to write access log:", error);
  }
};