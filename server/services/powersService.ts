import { db } from "../db/index";
import { moderationEvents, userProfiles, users, rooms } from "../db/schema";
import { eq, and } from "drizzle-orm";

export type PowerAction = "kick" | "ban" | "alert" | "mute" | "delmsg" | "clear_room";

export interface UserPower {
  rank: number;
  name: string;
  canKick: boolean;
  canBan: boolean;
  canAlert: boolean;
  canMute: boolean;
  canDelMsg: boolean;
  canClearRoom: boolean;
}

// 1. Guest (زائر)
// 2. Member (عضو)
// 3. Moderator (مراقب)
// 4. Admin (أدمن)
// 5. Owner (مالك)
export const POWERS_MAP: Record<string, UserPower> = {
  owner: {
    rank: 100000,
    name: "مالك",
    canKick: true,
    canBan: true,
    canAlert: true,
    canMute: true,
    canDelMsg: true,
    canClearRoom: true,
  },
  admin: {
    rank: 9000,
    name: "مدير",
    canKick: true,
    canBan: true,
    canAlert: true,
    canMute: true,
    canDelMsg: true,
    canClearRoom: true,
  },
  moderator: {
    rank: 5000,
    name: "مراقب",
    canKick: true,
    canBan: false, // Maybe only ban from room, not site
    canAlert: true,
    canMute: true,
    canDelMsg: true,
    canClearRoom: false,
  },
  member: {
    rank: 1000,
    name: "عضو",
    canKick: false,
    canBan: false,
    canAlert: false,
    canMute: false,
    canDelMsg: false,
    canClearRoom: false,
  },
  guest: {
    rank: 0,
    name: "زائر",
    canKick: false,
    canBan: false,
    canAlert: false,
    canMute: false,
    canDelMsg: false,
    canClearRoom: false,
  },
};

export const getPowerLevel = (role: string): UserPower => {
  return POWERS_MAP[role] || POWERS_MAP["guest"];
};

export const canExecuteAction = (actorRole: string, targetRole: string, action: PowerAction): boolean => {
  const actorPower = getPowerLevel(actorRole);
  const targetPower = getPowerLevel(targetRole);

  // You cannot perform an action on someone with a higher or equal rank
  if (actorPower.rank <= targetPower.rank && targetPower.rank > 0) {
    return false;
  }

  switch (action) {
    case "kick":
      return actorPower.canKick;
    case "ban":
      return actorPower.canBan;
    case "alert":
      return actorPower.canAlert;
    case "mute":
      return actorPower.canMute;
    case "delmsg":
      return actorPower.canDelMsg;
    case "clear_room":
      return actorPower.canClearRoom;
    default:
      return false;
  }
};

export const logModerationEvent = async (params: {
  actorId?: string;
  targetUserId?: string;
  roomId?: string;
  eventType: string;
  reason?: string;
  metadata?: any;
}) => {
  try {
    await db.insert(moderationEvents).values({
      actorId: params.actorId || null,
      targetUserId: params.targetUserId || null,
      roomId: params.roomId || null,
      eventType: params.eventType,
      reason: params.reason || "",
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error("Error logging moderation event:", err);
  }
};
