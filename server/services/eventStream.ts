import { dbPool } from "../db";
import { activityStream } from "../db/schema";
import { redis, KEYS } from "./redis";

export type SystemEvent = {
  actorId: string;
  verb: "joined" | "left" | "followed" | "sent_gift" | "posted" | "reacted" | "spoke";
  objectType: "room" | "user" | "post" | "message";
  objectId: string;
  targetId?: string;
  metadata?: any;
  visibility?: "public" | "friends" | "private";
};

/**
 * تسجيل حدث في النظام وبثه لحظياً
 */
export const emitEvent = async (event: SystemEvent) => {
  try {
    // 1. الحفظ في قاعدة البيانات (Event Sourcing)
    const [savedEvent] = await dbPool.query(
      `INSERT INTO activity_stream (actor_id, verb, object_type, object_id, target_id, metadata, visibility)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        event.actorId,
        event.verb,
        event.objectType,
        event.objectId,
        event.targetId || null,
        JSON.stringify(event.metadata || {}),
        event.visibility || "public"
      ]
    ).then(res => res.rows);

    // 2. النشر في Redis للـ Realtime Workers
    await redis.publish("system_events", JSON.stringify(savedEvent));

    // 3. تحديث الـ Counters اللحظية
    if (event.verb === "sent_gift") {
      await redis.hincrby(KEYS.counters("gifts"), event.targetId || "global", 1);
    }

    return savedEvent;
  } catch (error) {
    console.error("Event Stream Error:", error);
  }
};

/**
 * جلب الـ Feed الخاص بالمستخدم
 */
export const getUserFeed = async (userId: string, limit = 20) => {
  // محاكاة: جلب الأحداث العامة وأحداث الأصدقاء
  const result = await dbPool.query(
    `SELECT as.*, u.display_name as "actorName", u.avatar_url as "actorAvatar"
     FROM activity_stream as
     LEFT JOIN users u ON as.actor_id = u.id
     WHERE as.visibility = 'public'
     ORDER BY as.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
};