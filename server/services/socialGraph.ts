import { dbPool } from "../db";
import { redis, KEYS } from "./redis";

/**
 * تحديث قوة الارتباط بين مستخدمين بناءً على التفاعل
 */
export const trackInteraction = async (userId: string, targetId: string, weight = 1) => {
  try {
    // تحديث في قاعدة البيانات
    await dbPool.query(
      `INSERT INTO social_affinity (user_id, related_id, score, interaction_count, last_interaction_at)
       VALUES ($1, $2, $3, 1, now())
       ON CONFLICT (user_id, related_id) DO UPDATE SET
         score = social_affinity.score + $3,
         interaction_count = social_affinity.interaction_count + 1,
         last_interaction_at = now()`,
      [userId, targetId, weight]
    );

    // تحديث الكاش في Redis للاقتراحات السريعة
    const key = KEYS.socialGraph(userId);
    await redis.zincrby(key, weight, targetId);
  } catch (error) {
    console.error("Social Graph Error:", error);
  }
};

/**
 * جلب اقتراحات (أشخاص قد تعرفهم أو تهتم بهم)
 */
export const getRecommendations = async (userId: string) => {
  const key = KEYS.socialGraph(userId);
  const topInteractions = await redis.zrevrange(key, 0, 10);
  
  // جلب بياناتهم من DB
  if (topInteractions.length === 0) return [];
  
  const result = await dbPool.query(
    `SELECT id, display_name, avatar_url, presence 
     FROM users 
     WHERE id = ANY($1) AND status = 'active'`,
    [topInteractions]
  );
  return result.rows;
};