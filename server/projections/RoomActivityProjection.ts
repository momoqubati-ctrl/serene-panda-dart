import type { EventEnvelope } from "../core/events/EventEnvelope";
import { redis } from "../services/redis";

export async function projectRoomActivity(event: EventEnvelope): Promise<void> {
  const roomId = event.target?.roomId ?? event.metadata.roomId;
  if (!roomId) return;
  const weight = event.type === "message.sent" ? 2 : event.type === "room.joined" ? 3 : 1;
  await redis.zincrby("ranking:rooms:trending", weight, String(roomId)).catch(() => undefined);
}
