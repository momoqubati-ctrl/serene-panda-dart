import { redis } from "../services/redis";

export async function getRoomFeedQuery(roomId: string, limit = 50): Promise<string[]> {
  return redis.zrevrange(`ranking:feed:room:${roomId}`, 0, Math.max(0, limit - 1)).catch(() => []);
}
