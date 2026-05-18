import { redis } from "../services/redis";

export type MetricTags = Record<string, string | number | boolean | undefined>;

function tagSuffix(tags?: MetricTags): string {
  if (!tags) return "";
  return Object.entries(tags)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}:${String(value)}`)
    .join("|");
}

export class Metrics {
  async increment(name: string, value = 1, tags?: MetricTags): Promise<void> {
    const suffix = tagSuffix(tags);
    const key = suffix ? `metrics:${name}:${suffix}` : `metrics:${name}`;
    await redis.incrby(key, value).catch(() => undefined);
    await redis.expire(key, 86400).catch(() => undefined);
  }

  async timing(name: string, durationMs: number, tags?: MetricTags): Promise<void> {
    const suffix = tagSuffix(tags);
    const key = suffix ? `metrics:${name}:${suffix}` : `metrics:${name}`;
    await redis.lpush(key, String(Math.max(0, Math.round(durationMs)))).catch(() => undefined);
    await redis.ltrim(key, 0, 999).catch(() => undefined);
    await redis.expire(key, 86400).catch(() => undefined);
  }
}

export const metrics = new Metrics();
