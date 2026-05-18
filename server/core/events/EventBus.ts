import { dbPool } from "../../db";
import { redis } from "../../services/redis";
import { eventDispatcher } from "./EventDispatcher";
import { createEventEnvelope, type EventEnvelope, type EventInput } from "./EventEnvelope";

const REDIS_STREAM_MAXLEN = Number(process.env.EVENT_STREAM_MAXLEN ?? 100000);
const REDIS_PUBLISH_RETRIES = Number(process.env.EVENT_REDIS_RETRIES ?? 3);
const REDIS_RETRY_DELAY_MS = Number(process.env.EVENT_REDIS_RETRY_DELAY_MS ?? 150);

export class EventBus {
  async publish(input: EventInput): Promise<EventEnvelope> {
    const event = createEventEnvelope(input);

    // 1) Durability first: DB is the source of truth.
    const persistResult = await this.persistOrThrow(event);
    if (!persistResult.inserted) {
      // Idempotency guard: event already exists, skip side effects.
      return event;
    }

    // 2) Secondary delivery: Redis failures must not invalidate DB durability.
    await this.publishToRedisWithRetry(event);

    // 3) In-process dispatch after persistence.
    await eventDispatcher.dispatch(event);

    return event;
  }

  private async persistOrThrow(event: EventEnvelope): Promise<{ inserted: boolean }> {
    const result = await dbPool.query(
      `INSERT INTO event_store (id, type, stream, actor_id, target_id, payload, metadata, occurred_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'published')
       ON CONFLICT (id) DO NOTHING
       RETURNING id`,
      [
        event.id,
        event.type,
        event.stream,
        event.actor?.id ?? null,
        event.target?.id ?? null,
        JSON.stringify(event.payload),
        JSON.stringify(event.metadata),
        event.occurredAt,
      ]
    );

    return { inserted: (result.rowCount ?? 0) > 0 };
  }

  private async publishToRedisWithRetry(event: EventEnvelope): Promise<void> {
    const payload = JSON.stringify(event);
    let lastError: unknown = null;

    for (let attempt = 1; attempt <= REDIS_PUBLISH_RETRIES; attempt += 1) {
      try {
        await Promise.all([
          redis.publish(`events:${event.stream}`, payload),
          redis.xadd(`stream:${event.stream}`, "MAXLEN", "~", REDIS_STREAM_MAXLEN, "*", "event", payload),
          redis.xadd("stream:all", "MAXLEN", "~", REDIS_STREAM_MAXLEN, "*", "event", payload),
        ]);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < REDIS_PUBLISH_RETRIES) {
          await this.sleep(REDIS_RETRY_DELAY_MS * attempt);
        }
      }
    }

    await this.recordRedisFailure(event, lastError);
  }

  private async recordRedisFailure(event: EventEnvelope, error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : String(error);
    const failureMeta = {
      redisPublishFailed: true,
      failedAt: new Date().toISOString(),
      error: message,
    };

    console.error(`[EventBus] Redis publish failed for event ${event.id}: ${message}`);

    await Promise.allSettled([
      dbPool.query(
        `UPDATE event_store
         SET status = 'redis_failed',
             metadata = metadata || $2::jsonb
         WHERE id = $1`,
        [event.id, JSON.stringify(failureMeta)]
      ),
      redis.lpush(
        "queue:redis-failures",
        JSON.stringify({
          eventId: event.id,
          stream: event.stream,
          type: event.type,
          error: message,
          failedAt: failureMeta.failedAt,
        })
      ),
      redis.expire("queue:redis-failures", 86400 * 14),
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const eventBus = new EventBus();
