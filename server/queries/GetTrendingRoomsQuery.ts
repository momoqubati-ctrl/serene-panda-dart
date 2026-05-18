import { redis } from "../services/redis";

export async function getTrendingRoomsQuery(limit = 20): Promise<string[]> {
  return redis.zrevrange("ranking:rooms:trending", 0, Math.max(0, limit - 1)).catch(() => []);
}
