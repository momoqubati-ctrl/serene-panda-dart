import { redis } from "./redis";

export type RealtimeSecurityDecision = {
  allowed: boolean;
  reason?: string;
  score: number;
};

export async function inspectSocketAbuse(params: {
  userId: string;
  socketId: string;
  action: string;
  ip?: string;
}): Promise<RealtimeSecurityDecision> {
  const key = `security:socket:${params.userId}:${params.action}`;
  const count = await redis.incr(key).catch(() => 1);
  await redis.expire(key, 10).catch(() => undefined);

  if (Number(count) > 40) {
    return { allowed: false, reason: "rate_limited", score: 95 };
  }

  return { allowed: true, score: Math.min(80, Number(count) * 2) };
}

export async function recordPrivilegeCheck(params: {
  userId: string;
  permission: string;
  granted: boolean;
}): Promise<void> {
  await redis.lpush("security:privilege-checks", JSON.stringify({ ...params, at: new Date().toISOString() })).catch(() => undefined);
  await redis.ltrim("security:privilege-checks", 0, 1000).catch(() => undefined);
}
