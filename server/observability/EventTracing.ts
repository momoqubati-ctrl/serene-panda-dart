import type { EventEnvelope } from "../core/events/EventEnvelope";
import { redis } from "../services/redis";

export async function traceEvent(event: EventEnvelope, stage: string): Promise<void> {
  const key = `trace:event:${event.metadata.correlationId ?? event.id}`;
  await redis.rpush(
    key,
    JSON.stringify({
      eventId: event.id,
      type: event.type,
      stream: event.stream,
      stage,
      at: new Date().toISOString(),
    })
  ).catch(() => undefined);
  await redis.expire(key, 3600).catch(() => undefined);
}
