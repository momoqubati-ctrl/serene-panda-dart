import { db, dbPool } from "../db";
import { userProfiles, users, profileVisits } from "../db/schema";
import { eq } from "drizzle-orm";
import { redis } from "./redis";

export class ProfileService {
  private static async resolveActualUserId(userId: string) {
    if (!userId) return null;

    const normalized = String(userId).trim();
    if (!normalized) return null;

    const query = `
      SELECT id
      FROM users
      WHERE id = $1
        OR uid = $1
        OR idreg::text = $1
        OR CONCAT('#', idreg::text) = $1
        OR lower(username) = lower($1)
      LIMIT 1
    `;

    try {
      const result = await dbPool.query(query, [normalized]);
      return result.rows[0]?.id ?? null;
    } catch (error) {
      console.warn('[ProfileService] fallback user lookup failed, trying direct id', error?.message || error);
      return normalized;
    }
  }

  /**
   * Record a profile visit and cache the view count.
   */
  static async recordVisit(visitorId: string, profileId: string, hidden: boolean = false) {
    if (visitorId === profileId) return; // Don't count self-views

    try {
      const [resolvedVisitorId, resolvedProfileId] = await Promise.all([
        ProfileService.resolveActualUserId(visitorId),
        ProfileService.resolveActualUserId(profileId),
      ]);

      if (!resolvedVisitorId) {
        console.warn(`[ProfileService] visitor ${visitorId} could not be resolved; skipping visit record`);
        return;
      }
      if (!resolvedProfileId) {
        console.warn(`[ProfileService] profile ${profileId} could not be resolved; skipping visit record`);
        return;
      }

      await db.insert(profileVisits).values({
        visitorId: resolvedVisitorId,
        profileId: resolvedProfileId,
        hiddenVisit: hidden,
      });

      if (!hidden) {
        await redis.client?.hincrby(`profile:stats:${resolvedProfileId}`, "views", 1);
      }
    } catch (err) {
      console.error('[ProfileService] recordVisit error', err);
    }
  }

  /**
   * Get cached stats (views, followers, etc.)
   */
  static async getProfileStats(profileId: string) {
    const resolvedProfileId = await ProfileService.resolveActualUserId(profileId) || profileId;
    const cachedStats = await redis.client?.hgetall(`profile:stats:${resolvedProfileId}`);
    
    if (!cachedStats || Object.keys(cachedStats).length === 0) {
      // Fallback: sync from DB (simplified version)
      const profileInfo = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, resolvedProfileId),
      });
      return {
        views: profileInfo?.rep || 0,
        likes: profileInfo?.wallPostLikes || 0,
        coins: profileInfo?.coins || 0,
        evaluation: profileInfo?.evaluation || 0,
      };
    }
    
    return {
      views: parseInt(cachedStats.views || "0", 10),
      likes: parseInt(cachedStats.likes || "0", 10),
      coins: parseInt(cachedStats.coins || "0", 10),
      evaluation: parseInt(cachedStats.evaluation || "0", 10),
    };
  }

  /**
   * Fetch a full user profile for display.
   */
  static async getFullProfile(userId: string) {
    const resolvedUserId = await ProfileService.resolveActualUserId(userId);
    if (!resolvedUserId) return null;

    const user = await db.query.users.findFirst({
      where: eq(users.id, resolvedUserId),
    });

    if (!user) return null;

    try {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, resolvedUserId),
      });
      return { ...user, profile };
    } catch (error: any) {
      if (error?.code === "42P01" || (typeof error?.message === "string" && error.message.includes("user_profiles"))) {
        console.error("[ProfileService] user_profiles table missing, returning base user data only.");
        return { ...user, profile: null };
      }
      throw error;
    }
  }
}
