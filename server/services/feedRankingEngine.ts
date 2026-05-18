import type { EventEnvelope } from "../core/events/EventEnvelope";
import { redis } from "./redis";

export type FeedScoreInput = {
  recencyMs: number;
  affinity: number;
  engagement: number;
  trustScore: number;
  toxicityScore: number;
  roomPopularity: number;
  interactionDepth: number;
};

export function calculateFeedScore(input: FeedScoreInput): number {
  const recency = Math.max(0, 1 - input.recencyMs / 86_400_000);
  const trust = Math.min(1, Math.max(0, input.trustScore / 100));
  const toxicityPenalty = Math.min(1, Math.max(0, input.toxicityScore / 100));
  return Number((
    recency * 0.22 +
    input.affinity * 0.2 +
    input.engagement * 0.18 +
    trust * 0.15 +
    input.roomPopularity * 0.12 +
    input.interactionDepth * 0.13 -
    toxicityPenalty * 0.35
  ).toFixed(4));
}

export async function rankFeedEvent(event: EventEnvelope): Promise<void> {
  const roomId = event.target?.roomId ?? event.metadata.roomId;
  const score = calculateFeedScore({
    recencyMs: Date.now() - new Date(event.occurredAt).getTime(),
    affinity: 0.5,
    engagement: event.type === "message.sent" ? 0.35 : 0.5,
    trustScore: Number(event.metadata.trustScore ?? 50),
    toxicityScore: Number(event.metadata.toxicityScore ?? 0),
    roomPopularity: Number(event.metadata.roomPopularity ?? 0.2),
    interactionDepth: Number(event.metadata.interactionDepth ?? 0.4),
  });

  await redis.zadd("ranking:feed:global", score, event.id).catch(() => undefined);
  if (roomId) {
    await redis.zadd(`ranking:feed:room:${roomId}`, score, event.id).catch(() => undefined);
  }
}
