import type { EventEnvelope } from "../core/events/EventEnvelope";
import { eventBus } from "../core/events/EventBus";
import { redis } from "./redis";

export type ModerationSignal = {
  spamFingerprint: string;
  floodScore: number;
  raidScore: number;
  coordinatedAbuseScore: number;
  suspiciousMovementScore: number;
  harassmentChainScore: number;
  toxicityScore: number;
};

function fingerprintText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[0-9]+/g, "#").slice(0, 160);
}

export async function inspectModerationSignals(event: EventEnvelope): Promise<void> {
  const text = String(event.payload.text ?? "");
  if (!text) return;

  const userId = event.actor?.id ?? event.actor?.username ?? "unknown";
  const fingerprint = fingerprintText(text);
  const fpKey = `moderation:fingerprint:${fingerprint}`;
  const userBurstKey = `moderation:burst:${userId}`;

  const [fingerprintCount, burstCount] = await Promise.all([
    redis.incr(fpKey).catch(() => 1),
    redis.incr(userBurstKey).catch(() => 1),
  ]);
  await Promise.allSettled([redis.expire(fpKey, 120), redis.expire(userBurstKey, 15)]);

  const signal: ModerationSignal = {
    spamFingerprint: fingerprint,
    floodScore: Math.min(1, Number(burstCount) / 12),
    raidScore: Math.min(1, Number(fingerprintCount) / 40),
    coordinatedAbuseScore: Math.min(1, Number(fingerprintCount) / 25),
    suspiciousMovementScore: 0,
    harassmentChainScore: 0,
    toxicityScore: event.metadata.toxicityScore ? Number(event.metadata.toxicityScore) : 0,
  };

  if (signal.floodScore >= 0.75 || signal.raidScore >= 0.75 || signal.coordinatedAbuseScore >= 0.75) {
    await eventBus.publish({
      type: "moderation.flagged",
      stream: "moderation",
      actor: event.actor,
      target: event.target,
      payload: { sourceEventId: event.id, signal },
      metadata: { causationId: event.id, correlationId: event.metadata.correlationId, source: "moderation-worker" },
      priority: "high",
    });
  }
}
