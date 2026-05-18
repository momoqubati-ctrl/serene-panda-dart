import { defineEventHandler, readBody, setResponseStatus, getRequestHeader } from "h3";
import { createWallPost } from "../../../services/wallService";
import { processText } from "../../../services/filterService";
import { dbPool } from "../../../db";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { authorId, text, mediaUrl } = body;

  if (!authorId || !text) {
    setResponseStatus(event, 400);
    return { success: false, message: "البيانات ناقصة" };
  }

  try {
    // جلب بيانات العضو للفحص
    const userRes = await dbPool.query("SELECT username, topic FROM users WHERE id = $1 OR idreg = $1 LIMIT 1", [authorId]);
    const user = userRes.rows[0] || { username: authorId, topic: authorId };
    const ip = getRequestHeader(event, "x-forwarded-for") || getRequestHeader(event, "x-real-ip") || "127.0.0.1";

    // --- تطبيق الفلترة ---
    const filterRes = await processText({
      text,
      source: "wall",
      user: { username: user.username, topic: user.topic, ip }
    });

    const post = await createWallPost(authorId, filterRes.filteredText, mediaUrl);
    return { success: true, post };
  } catch (error) {
    console.error("Wall post error:", error);
    setResponseStatus(event, 500);
    return { success: false, message: "تعذر إضافة المنشور" };
  }
});