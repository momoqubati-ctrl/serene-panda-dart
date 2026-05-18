import type { EventEnvelope } from "../core/events/EventEnvelope";
import { dbPool } from "../db";

export type ReputationScore = {
  trustScore: number;
  toxicityScore: number;
  influenceScore: number;
  spamProbability: number;
  harassmentProbability: number;
  fakeEngagementProbability: number;
};

export function calculateReputationDelta(event: EventEnvelope): Partial<ReputationScore> {
  if (event.type === "moderation.flagged") {
    return { toxicityScore: 8, spamProbability: 0.05, trustScore: -4 };
  }
  if (event.type === "punishment.applied") {
    return { toxicityScore: 15, harassmentProbability: 0.08, trustScore: -10 };
  }
  if (event.type === "gift.sent" || event.type === "reaction.created") {
    return { influenceScore: 2, trustScore: 1 };
  }
  if (event.type === "message.sent") {
    return { influenceScore: 1 };
  }
  return {};
}

export async function updateReputationFromEvent(event: EventEnvelope): Promise<void> {
  const userId = event.actor?.id;
  if (!userId) return;
  const delta = calculateReputationDelta(event);

  await dbPool.query(
    `INSERT INTO behavior_scores (user_id, trust_score, toxicity_score, influence_score, spam_probability, last_recalculated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     ON CONFLICT (user_id) DO UPDATE SET
       trust_score = LEAST(100, GREATEST(0, behavior_scores.trust_score + $2)),
       toxicity_score = LEAST(100, GREATEST(0, behavior_scores.toxicity_score + $3)),
       influence_score = GREATEST(0, behavior_scores.influence_score + $4),
       spam_probability = LEAST(1, GREATEST(0, behavior_scores.spam_probability + $5::numeric)),
       last_recalculated_at = now()`,
    [
      userId,
      delta.trustScore ?? 0,
      delta.toxicityScore ?? 0,
      delta.influenceScore ?? 0,
      delta.spamProbability ?? 0,
    ]
  ).catch((error) => console.error("Reputation update failed:", error));
}
