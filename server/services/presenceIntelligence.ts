import { redis, KEYS } from "./redis";
import { getIO } from "../socket";

export type DetailedStatus = 'online' | 'idle' | 'lurking' | 'active' | 'multitasking' | 'speaking';

/**
 * تحديث حالة المستخدم مع تحليل السلوك
 */
export const setPresenceState = async (userId: string, state: {
  status: DetailedStatus;
  roomId?: string;
  activity?: string;
}) => {
  const key = KEYS.presence(userId);
  const timestamp = Date.now();

  const presenceData = {
    ...state,
    lastSeen: timestamp,
  };

  await redis.hset(key, presenceData);
  await redis.expire(key, 600); // 10 minutes

  // بث التحديث للمشتركين (الأصدقاء أو أعضاء الغرفة)
  const io = getIO();
  if (io) {
    io.emit('presence:update', { userId, ...presenceData });
    
    if (state.roomId) {
      io.to(`room:${state.roomId}`).emit('room:presence', { userId, status: state.status });
    }
  }

  return presenceData;
};

/**
 * رصد المستخدمين الخاملين تلقائياً
 */
export const cleanupInactiveUsers = async () => {
  // سيتم تنفيذ هذا عبر Cron Job أو Worker
  // يقوم بفحص الـ TTL في Redis وإرسال أحداث 'offline'
};