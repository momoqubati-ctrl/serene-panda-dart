import { db } from "../db";
import { userProfiles, users, profileVisits, socialEdges } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { redis } from "./redis";

export class ProfileService {
  /**
   * Record a profile visit and cache the view count.
   */
  static async recordVisit(visitorId: string, profileId: string, hidden: boolean = false) {
    if (visitorId === profileId) return; // Don't count self-views

    await db.insert(profileVisits).values({
      visitorId,
      profileId,
      hiddenVisit: hidden,
    });

    if (!hidden) {
      await redis.client?.hincrby(`profile:stats:${profileId}`, "views", 1);
      // We could also broadcast real-time presence/visit here, but socket will handle it.
    }
  }

  /**
   * Get cached stats (views, followers, etc.)
   */
  static async getProfileStats(profileId: string) {
    const cachedStats = await redis.client?.hgetall(`profile:stats:${profileId}`);
    
    if (!cachedStats || Object.keys(cachedStats).length === 0) {
      // Fallback: sync from DB (simplified version)
      const profileInfo = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, profileId),
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
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) return null;

    try {
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, userId),
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
