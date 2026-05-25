import { db, dbPool } from "../db";
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
        // Fetch required NOT NULL columns for users (without defaults) once and cache.
        try {
          const requiredColsRes = await dbPool.query(
            `SELECT column_name, data_type
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'users'
               AND is_nullable = 'NO' AND column_default IS NULL AND column_name <> 'id'`
          );
          const required = requiredColsRes.rows || [];
          const cols = ['id'];
          const vals: any[] = [visitorId];
          const placeholders: string[] = ['$1'];
          let idx = 2;
          for (const r of required) {
            const col = r.column_name;
            const dt = r.data_type;
            // generate a safe default based on column name / type
            let def: any = '';
            const short = visitorId.replace(/-/g, '').substring(0, 8);
            if (col.toLowerCase().includes('username')) def = `guest_${short}`;
            else if (col.toLowerCase().includes('display') || col.toLowerCase().includes('name')) def = `Guest ${short}`;
            else if (col.toLowerCase().includes('role')) def = 'member';
            else if (col.toLowerCase().includes('status')) def = 'active';
            else if (col.toLowerCase().includes('presence')) def = 'online';
            else if (dt && dt.includes('timestamp')) def = new Date().toISOString();
            else if (dt && (dt.includes('int') || dt.includes('numeric'))) def = 0;
            else if (dt && dt.includes('boolean')) def = false;
            // push
            cols.push(`"${col}"`);
            vals.push(def);
            placeholders.push(`$${idx}`);
            idx++;
          }

          const sql = `INSERT INTO users (${cols.join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT (id) DO NOTHING`;
          try {
            await dbPool.query(sql, vals);
          } catch (e) {
            // If insertion fails, log and continue; profile visit insert will show the real error.
            console.error('[ProfileService] unable to insert stub user', e?.message || e);
          }
        } catch (e) {
          console.error('[ProfileService] error fetching user columns', e?.message || e);
        }
      }
    } catch (err) {
      console.error('[ProfileService] Error checking/creating visitor user:', err);
    }

    // Ensure the profile owner exists as well (profileId) to satisfy FK on profile_visits.profile_id
    try {
      const profileExists = await db.query.users.findFirst({ where: eq(users.id, profileId) });
      if (!profileExists) {
        try {
          const requiredColsRes = await dbPool.query(
            `SELECT column_name, data_type
             FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'users'
               AND is_nullable = 'NO' AND column_default IS NULL AND column_name <> 'id'`
          );
          const required = requiredColsRes.rows || [];
          const cols = ['id'];
          const vals: any[] = [profileId];
          const placeholders: string[] = ['$1'];
          let idx = 2;
          for (const r of required) {
            const col = r.column_name;
            const dt = r.data_type;
            let def: any = '';
            const short = profileId.replace(/-/g, '').substring(0, 8);
            if (col.toLowerCase().includes('username')) def = `guest_${short}`;
            else if (col.toLowerCase().includes('display') || col.toLowerCase().includes('name')) def = `Guest ${short}`;
            else if (col.toLowerCase().includes('role')) def = 'member';
            else if (col.toLowerCase().includes('status')) def = 'active';
            else if (col.toLowerCase().includes('presence')) def = 'online';
            else if (dt && dt.includes('timestamp')) def = new Date().toISOString();
            else if (dt && (dt.includes('int') || dt.includes('numeric'))) def = 0;
            else if (dt && dt.includes('boolean')) def = false;
            cols.push(`"${col}"`);
            vals.push(def);
            placeholders.push(`$${idx}`);
            idx++;
          }
          const sql = `INSERT INTO users (${cols.join(',')}) VALUES (${placeholders.join(',')}) ON CONFLICT (id) DO NOTHING`;
          try {
            await dbPool.query(sql, vals);
          } catch (e) {
            console.error('[ProfileService] unable to insert stub profile user', e?.message || e);
          }
        } catch (e) {
          console.error('[ProfileService] error fetching user columns for profileId', e?.message || e);
        }
      }
    } catch (err) {
      console.error('[ProfileService] Error checking/creating profile user:', err);
    }

    await db.insert(profileVisits).values({
      visitorId,
      try {
        const [visitor, profile] = await Promise.all([
          db.query.users.findFirst({ where: eq(users.id, visitorId) }),
          db.query.users.findFirst({ where: eq(users.id, profileId) }),
        ]);

        if (!visitor) {
          console.warn(`[ProfileService] visitor ${visitorId} missing; skipping visit record`);
          return;
        }
        if (!profile) {
          console.warn(`[ProfileService] profile ${profileId} missing; skipping visit record`);
          return;
        }

        await db.insert(profileVisits).values({
          visitorId,
          profileId,
          hiddenVisit: hidden,
        });

        if (!hidden) {
          await redis.client?.hincrby(`profile:stats:${profileId}`, "views", 1);
        }
      } catch (err) {
        console.error('[ProfileService] recordVisit error', err);
      }
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
