import { Socket, Server as SocketIOServer } from "socket.io";
import { ProfileService } from "../services/profileService";
import { db } from "../db";
import { users, userProfiles } from "../db/schema";
import { eq } from "drizzle-orm";
import { hasPermission } from "../services/permissionEngine";

export function registerProfileHandlers(io: SocketIOServer, socket: Socket) {
  const userId = socket.data?.user?.id;

  // View Profile
  socket.on("profile:view", async (data: { profileId: string; hidden?: boolean }, callback) => {
    try {
      if (!userId) return callback?.({ error: "Unauthorized" });
      
      const { profileId, hidden } = data;
      const isHiddenVisit = hidden && socket.data.user?.permissions?.stealth_view;
      
      await ProfileService.recordVisit(userId, profileId, !!isHiddenVisit);
      
      const profile = await ProfileService.getFullProfile(profileId);
      if (!profile) {
        return callback?.({ error: "Profile not found" });
      }

      const stats = await ProfileService.getProfileStats(profileId);
      
      // Notify the target user that their profile was viewed
      if (userId !== profileId && !isHiddenVisit) {
        io.to(`user:${profileId}`).emit("profile:viewed", {
          visitorId: userId,
          timestamp: Date.now(),
        });
      }
      
      callback?.({ success: true, profile, stats });
    } catch (err) {
      console.error("[ProfileView] Error:", err);
      callback?.({ error: "Failed to view profile" });
    }
  });

  // Admin: Update Profile fields
  socket.on("profile:adminUpdate", async (data: { profileId: string; updates: any }, callback) => {
    try {
      if (!userId) return callback?.({ error: "Unauthorized" });
      
      // Simplified check - full check would use permission engine
      const hasPerm = await hasPermission(userId, "edituser");
      if (!hasPerm) return callback?.({ error: "Permission denied" });
      
      const { profileId, updates } = data;
      
      await db.update(userProfiles)
        .set(updates)
        .where(eq(userProfiles.userId, profileId));
        
      io.to(`user:${profileId}`).emit("profile:updated", updates);
      // Also broadcast globally if needed, e.g. name change
      
      callback?.({ success: true });
    } catch (err) {
      console.error("[ProfileAdminUpdate] Error:", err);
      callback?.({ error: "Failed to update profile" });
    }
  });

  // Follow
  socket.on("profile:follow", async (data: { profileId: string }, callback) => {
    try {
      if (!userId) return callback?.({ error: "Unauthorized" });
      
      const { profileId } = data;
      if (userId === profileId) return callback?.({ error: "Cannot follow yourself" });
      
      // Handle follow logic in social edges
      
      io.to(`user:${profileId}`).emit("user:followed", {
        followerId: userId,
      });
      
      callback?.({ success: true });
    } catch (err) {
      console.error("[ProfileFollow] Error:", err);
      callback?.({ error: "Failed to follow" });
    }
  });
}
