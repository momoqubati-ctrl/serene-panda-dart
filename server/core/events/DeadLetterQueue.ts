import { dbPool } from "../../db";
import { redis } from "../../services/redis";
import type { EventEnvelope } from "./EventEnvelope";

export type DeadLetterEntry = {
  event: EventEnvelope;
  worker: string;
  error: string;
  failedAt: string;
  attempts: number;
};

export class DeadLetterQueue {
  async push(entry: DeadLetterEntry): Promise<void> {
    const payload = JSON.stringify(entry);
    await Promise.allSettled([
      redis.lpush("queue:dead-letter", payload),
      dbPool.query(
        `INSERT INTO event_store (id, type, stream, actor_id, target_id, payload, metadata, occurred_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'dead_letter')
         ON CONFLICT (id) DO UPDATE SET status = 'dead_letter', metadata = event_store.metadata || $7::jsonb`,
        [
          entry.event.id,
          entry.event.type,
          entry.event.stream,
          entry.event.actor?.id ?? null,
          entry.event.target?.id ?? null,
          JSON.stringify(entry.event.payload),
          JSON.stringify({ ...entry.event.metadata, deadLetter: { worker: entry.worker, error: entry.error, attempts: entry.attempts } }),
          entry.event.occurredAt,
        ]
      ),
    ]);
  }
}

export const deadLetterQueue = new DeadLetterQueue();
