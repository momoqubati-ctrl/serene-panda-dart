import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
});

/**
 * مفاتيح Redis الموحدة
 */
export const KEYS = {
  presence: (userId: string) => `presence:${userId}`,
  roomState: (roomId: string) => `room:state:${roomId}`,
  roomMembers: (roomId: string) => `room:members:${roomId}`,
  typing: (roomId: string) => `typing:${roomId}`,
  socialGraph: (userId: string) => `social:graph:${userId}`,
  counters: (type: string) => `counters:${type}`,
  feedCache: (userId: string) => `feed:cache:${userId}`,
};

/**
 * تحديث الحضور الذكي
 */
export const updatePresence = async (userId: string, data: {
  status: string;
  activity?: string;
  roomId?: string;
  device?: string;
}) => {
  const key = KEYS.presence(userId);
  await redis.hset(key, {
    ...data,
    lastSeen: Date.now(),
  });
  await redis.expire(key, 300); // تنتهي الصلاحية بعد 5 دقائق من الخمول
};

/**
 * جلب حالة الغرفة اللحظية
 */
export const getRoomLiveState = async (roomId: string) => {
  const key = KEYS.roomState(roomId);
  return await redis.hgetall(key);
};

export default redis;