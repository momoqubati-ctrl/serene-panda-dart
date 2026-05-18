import type { EventEnvelope } from "../core/events/EventEnvelope";
import { workerRuntime, type WorkerDefinition } from "./WorkerRuntime";
import { metrics } from "../observability/Metrics";
import { updatePresenceV2 } from "../services/presenceIntelligence";
import { rankFeedEvent } from "../services/feedRankingEngine";
import { updateReputationFromEvent } from "../services/reputationEngine";
import { inspectModerationSignals } from "../services/moderationIntelligence";
import { updateRecommendationSignals } from "../services/recommendationEngine";
import { projectRoomActivity } from "../projections/RoomActivityProjection";

async function analyticsHandler(event: EventEnvelope): Promise<void> {
  await metrics.increment("events.total", 1, { stream: event.stream, type: event.type });
}

export const workers: WorkerDefinition[] = [
  {
    name: "moderation-worker",
    consumes: ["message.sent", "wall.posted", "moderation.flagged"],
    concurrency: 4,
    handler: inspectModerationSignals,
  },
  {
    name: "analytics-worker",
    consumes: ["message.sent", "room.joined", "room.left", "gift.sent", "profile.viewed", "voice.started", "voice.ended", "presence.updated"],
    concurrency: 8,
    handler: analyticsHandler,
  },
  {
    name: "feed-worker",
    consumes: ["message.sent", "room.joined", "wall.posted", "reaction.created", "gift.sent"],
    concurrency: 4,
    handler: async (event) => {
      await rankFeedEvent(event);
      await projectRoomActivity(event);
    },
  },
  {
    name: "recommendation-worker",
    consumes: ["room.joined", "user.followed", "profile.viewed", "message.sent", "reputation.recalculated"],
    concurrency: 4,
    handler: updateRecommendationSignals,
  },
  {
    name: "notification-worker",
    consumes: ["gift.sent", "punishment.applied", "user.followed"],
    concurrency: 4,
    handler: analyticsHandler,
  },
  {
    name: "reputation-worker",
    consumes: ["message.sent", "moderation.flagged", "punishment.applied", "reaction.created", "gift.sent"],
    concurrency: 3,
    handler: updateReputationFromEvent,
  },
  {
    name: "presence-worker",
    consumes: ["room.joined", "room.left", "voice.started", "voice.ended", "presence.updated"],
    concurrency: 8,
    handler: async (event) => {
      const userId = event.actor?.id;
      if (!userId) return;
      await updatePresenceV2(userId, {
        roomId: event.target?.roomId ?? event.metadata.roomId,
        signal: event.type,
        interactionDepth: event.type === "message.sent" ? 0.8 : 0.35,
      });
    },
  },
  {
    name: "cleanup-worker",
    consumes: ["worker.failed"],
    concurrency: 1,
    handler: analyticsHandler,
  },
];

let bootstrapped = false;

export function bootstrapWorkers(): void {
  if (bootstrapped) return;
  for (const worker of workers) workerRuntime.register(worker);
  bootstrapped = true;
}
