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
  
  // 1. جلب القواعد من قاعدة البيانات (notext)
  const rulesResult = await dbPool.query("SELECT v, path FROM notext");
  const rules = rulesResult.rows;

  const bmsgs = rules.filter(r => r.path === 'bmsgs').map(r => r.v);
  const wmsgs = rules.filter(r => r.path === 'wmsgs').map(r => r.v);
  const amsgs = rules.filter(r => r.path === 'amsgs').map(r => r.v);

  let filteredText = text;
  let hasMatch = false;
  let action: FilterAction | null = null;
  const matchedWords: string[] = [];

  // التحقق من الكلمات المسموحة أولاً (تجاوز)
  for (const word of amsgs) {
    if (text.includes(word)) return { originalText: text, filteredText: text, hasMatch: false, action: "allow", matchedWords: [] };
  }

  // فحص الكلمات الممنوعة (bmsgs)
  for (const word of bmsgs) {
    if (text.includes(word)) {
      hasMatch = true;
      action = "block";
      matchedWords.push(word);
      // "تشفير" الكلمة (استبدالها بنجوم)
      const mask = "*".repeat(word.length);
      filteredText = filteredText.split(word).join(mask);
    }
  }

  // فحص الكلمات المراقبة (wmsgs) إذا لم تكن ممنوعة بالفعل
  if (action !== "block") {
    for (const word of wmsgs) {
      if (text.includes(word)) {
        hasMatch = true;
        action = "watch";
        matchedWords.push(word);
      }
    }
  }

  // إذا تم الرصد، قم بالتسجيل وإرسال التنبيهات
  if (hasMatch && action) {
    await logDetection({
      v: matchedWords.join(", "),
      msg: text,
      source,
      target: target || "",
      user,
      action
    });

    // إرسال تنبيه للمشرفين عبر Socket.io
    if (action === "block" || action === "watch") {
      const io = getIO();
      if (io) {
        io.to("moderators_alerts").emit("filter_alert", {
          type: action,
          word: matchedWords[0],
          user: user.topic,
          source,
          text
        });
      }
    }
  }

  return { originalText: text, filteredText, hasMatch, action, matchedWords };
};

/**
 * تسجيل الحركة في سجل الرصد (histletter) مع التنظيف التلقائي
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

    // التنظيف التلقائي: إذا تجاوز 35 سجلاً، احذف الأقدم
    const countRes = await dbPool.query("SELECT count(*)::int as total FROM histletter");
    if (countRes.rows[0].total > 35) {
      await dbPool.query("DELETE FROM histletter WHERE id IN (SELECT id FROM histletter ORDER BY id ASC LIMIT 5)");
    }
  } catch (err) {
    console.error("Filter logging failed:", err);
  }
}