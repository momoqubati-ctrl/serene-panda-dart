import { dbPool } from "../db";
import { getIO } from "../socket";

export type FilterAction = "block" | "watch" | "allow";

interface FilterResult {
  originalText: string;
  filteredText: string;
  hasMatch: boolean;
  action: FilterAction | null;
  matchedWords: string[];
}

/**
 * يقوم بفحص النص مقابل قواعد الفلتر
 */
export const processText = async (params: {
  text: string;
  source: string;
  user: { username: string; topic: string; ip: string };
  target?: string;
}): Promise<FilterResult> => {
  const { text, source, user, target } = params;
  
  if (!text) return { originalText: "", filteredText: "", hasMatch: false, action: null, matchedWords: [] };

  // 1. جلب القواعد من قاعدة البيانات
  const rulesResult = await dbPool.query("SELECT v, path FROM notext");
  const rules = rulesResult.rows;

  const bmsgs = rules.filter(r => r.path === 'bmsgs').map(r => String(r.v || "").trim()).filter(Boolean);
  const wmsgs = rules.filter(r => r.path === 'wmsgs').map(r => String(r.v || "").trim()).filter(Boolean);
  const amsgs = rules.filter(r => r.path === 'amsgs').map(r => String(r.v || "").trim()).filter(Boolean);

  let filteredText = text;
  let hasBlockMatch = false;
  let hasWatchMatch = false;
  const matchedWords: string[] = [];

  // التحقق من الكلمات المسموحة أولاً (تجاوز)
  for (const word of amsgs) {
    if (text.includes(word)) return { originalText: text, filteredText: text, hasMatch: false, action: "allow", matchedWords: [] };
  }

  // أولاً: فحص الكلمات الممنوعة (يتم تشفيرها)
  for (const word of bmsgs) {
    if (text.includes(word)) {
      hasBlockMatch = true;
      if (!matchedWords.includes(word)) matchedWords.push(word);
      
      // استبدال الكلمة بنجوم في النص الذي سيظهر للناس
      const mask = "*".repeat(word.length);
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filteredText = filteredText.replace(new RegExp(escapedWord, 'g'), mask);
    }
  }

  // ثانياً: فحص الكلمات المراقبة (لا يتم تشفيرها، ترسل كما هي)
  for (const word of wmsgs) {
    if (text.includes(word)) {
      hasWatchMatch = true;
      if (!matchedWords.includes(word)) matchedWords.push(word);
      // ملاحظة: لا نقوم بتغيير filteredText هنا
    }
  }

  // تحديد الإجراء النهائي للسجل (المنع له أولوية على المراقبة في السجل)
  const finalAction: FilterAction | null = hasBlockMatch ? "block" : hasWatchMatch ? "watch" : null;

  if (finalAction) {
    await logDetection({
      v: matchedWords.join(", "),
      msg: text,
      source,
      target: target || "",
      user,
      action: finalAction
    });

    // إرسال تنبيه للمشرفين
    const io = getIO();
    if (io) {
      io.to("moderators_alerts").emit("filter_alert", {
        type: finalAction,
        word: matchedWords[0],
        user: user.topic,
        source,
        text
      });
    }
  }

  return { 
    originalText: text, 
    filteredText, // يحتوي على النجوم للكلمات الممنوعة فقط
    hasMatch: !!finalAction, 
    action: finalAction, 
    matchedWords 
  };
};

/**
 * تسجيل الحركة في سجل الرصد (histletter)
 */
async function logDetection(data: any) {
  try {
    await dbPool.query(
      `INSERT INTO histletter (ip, msg, topic, v, "time", target, source, path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        data.user.ip,
        data.msg,
        data.user.topic,
        data.v,
        String(Date.now()),
        data.target,
        data.source,
        data.action === "block" ? "bmsgs" : "wmsgs"
      ]
    );

    // تنظيف السجل (آخر 100)
    const countRes = await dbPool.query("SELECT count(*)::int as total FROM histletter");
    if (countRes.rows[0].total > 100) {
      await dbPool.query("DELETE FROM histletter WHERE id IN (SELECT id FROM histletter ORDER BY id ASC LIMIT 10)");
    }
  } catch (err) {
    console.error("Filter logging failed:", err);
  }
}