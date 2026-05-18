import type { EventEnvelope } from "../core/events/EventEnvelope";
import { redis } from "./redis";

export async function updateRecommendationSignals(event: EventEnvelope): Promise<void> {
  const userId = event.actor?.id;
  if (!userId) return;

  const roomId = event.target?.roomId ?? event.metadata.roomId;
  const targetUserId = event.target?.userId;
  const weight = event.type === "user.followed" ? 8 : event.type === "room.joined" ? 4 : 1;

  if (roomId) {
    await redis.zincrby(`recommendation:rooms:${userId}`, weight, String(roomId)).catch(() => undefined);
  }
  if (targetUserId) {
    await redis.zincrby(`recommendation:users:${userId}`, weight, String(targetUserId)).catch(() => undefined);
  }
}
