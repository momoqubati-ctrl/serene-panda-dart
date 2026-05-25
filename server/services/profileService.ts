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

    // Ensure the visitor exists in `users` to satisfy the FK on profile_visits.
    // Some environments may generate ephemeral UUIDs for sockets/users that
    // don't yet have a user row. Create a minimal stub user record if missing.
    try {
      const existing = await db.query.users.findFirst({ where: eq(users.id, visitorId) });
      if (!existing) {
        try {
          await db.insert(users).values({
            id: visitorId,
            username: `guest_${visitorId.substring(0, 8)}`,
            displayName: `Guest ${visitorId.substring(0, 8)}`,
          });
        } catch (e) {
          // Ignore insert errors (race conditions or constraints). We'll still
          // attempt to insert the profile visit below and let the DB enforce
          // constraints if something else is wrong.
        }
      }
    } catch (err) {
      // If checking users fails for any reason, log and continue to attempt
      // recording the visit — the insert will surface the real DB error.
      console.error("[ProfileService] Error checking/creating visitor user:", err);
    }

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
