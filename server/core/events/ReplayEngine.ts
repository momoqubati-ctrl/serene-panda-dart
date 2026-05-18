import { dbPool } from "../../db";
import { eventDispatcher } from "./EventDispatcher";
import type { EventEnvelope } from "./EventEnvelope";
import type { DomainEventType } from "./EventTypes";

export type ReplayOptions = {
  types?: DomainEventType[];
  from?: string;
  to?: string;
  limit?: number;
  dryRun?: boolean;
};

export class ReplayEngine {
  async replay(options: ReplayOptions = {}): Promise<{ replayed: number }> {
    const filters: string[] = [];
    const values: unknown[] = [];

    if (options.types?.length) {
      values.push(options.types);
      filters.push(`type = ANY($${values.length})`);
    }
    if (options.from) {
      values.push(options.from);
      filters.push(`occurred_at >= $${values.length}`);
    }
    if (options.to) {
      values.push(options.to);
      filters.push(`occurred_at <= $${values.length}`);
    }

    values.push(options.limit ?? 1000);
    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const result = await dbPool.query(
      `SELECT * FROM event_store ${where} ORDER BY occurred_at ASC LIMIT $${values.length}`,
      values
    );

    if (!options.dryRun) {
      for (const row of result.rows) {
        await eventDispatcher.dispatch({
          id: row.id,
          type: row.type,
          stream: row.stream,
          version: row.version ?? 1,
          occurredAt: row.occurred_at?.toISOString?.() ?? String(row.occurred_at),
          actor: row.actor_id ? { id: row.actor_id } : undefined,
          target: row.target_id ? { id: row.target_id } : undefined,
          payload: row.payload ?? {},
          metadata: { ...(row.metadata ?? {}), replayed: true },
          priority: "normal",
          replayable: true,
        } satisfies EventEnvelope);
      }
    }

    return { replayed: result.rowCount ?? 0 };
  }
}

export const replayEngine = new ReplayEngine();
