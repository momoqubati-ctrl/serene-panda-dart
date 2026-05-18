import { eventDispatcher, type EventHandler } from "../core/events/EventDispatcher";
import type { DomainEventType } from "../core/events/EventTypes";
import { traceEvent } from "../observability/EventTracing";
import { metrics } from "../observability/Metrics";
import { dbPool } from "../db";
import redis from "../services/redis";

// Idempotency Manager Module
export class IdempotencyManager {
  private static instance: IdempotencyManager;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): IdempotencyManager {
    if (!IdempotencyManager.instance) {
      IdempotencyManager.instance = new IdempotencyManager();
    }
    return IdempotencyManager.instance;
  }

  public async init() {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = (async () => {
      // Create ENUM type if not exists
      await dbPool.query(`
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'processed_event_status') THEN
                CREATE TYPE processed_event_status AS ENUM ('processing', 'done', 'failed');
            END IF;
        END$$;
      `);

      // Create table if not exists
      await dbPool.query(`
        CREATE TABLE IF NOT EXISTS processed_events (
          event_id TEXT,
          worker_name TEXT,
          status processed_event_status,
          processed_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (event_id, worker_name)
        );
      `);
    })();
    
    return this.initPromise;
  }

  public async checkFastSkip(eventId: string, workerName: string): Promise<boolean> {
    const key = `processed:${workerName}:${eventId}`;
    const val = await redis.get(key);
    return val === 'done';
  }

  public async claimEvent(eventId: string, workerName: string): Promise<boolean> {
    const timeoutMinutes = 5;
    const query = `
      INSERT INTO processed_events (event_id, worker_name, status, processed_at)
      VALUES ($1, $2, 'processing', NOW())
      ON CONFLICT (event_id, worker_name)
      DO UPDATE SET 
        status = 'processing', 
        processed_at = NOW()
      WHERE 
        processed_events.status = 'failed' OR 
        (processed_events.status = 'processing' AND processed_events.processed_at < NOW() - INTERVAL '${timeoutMinutes} minutes')
      RETURNING status;
    `;
    
    const res = await dbPool.query(query, [eventId, workerName]);
    return res.rowCount > 0;
  }

  public async markComplete(eventId: string, workerName: string) {
    const query = `
      UPDATE processed_events 
      SET status = 'done', processed_at = NOW()
      WHERE event_id = $1 AND worker_name = $2;
    `;
    await dbPool.query(query, [eventId, workerName]);
    
    // Update Redis
    const key = `processed:${workerName}:${eventId}`;
    await redis.set(key, 'done', 'EX', 86400); // 1 day TTL
  }

  public async markFailed(eventId: string, workerName: string) {
    const query = `
      UPDATE processed_events 
      SET status = 'failed', processed_at = NOW()
      WHERE event_id = $1 AND worker_name = $2;
    `;
    await dbPool.query(query, [eventId, workerName]);
  }
}

export const idempotencyManager = IdempotencyManager.getInstance();

export type WorkerDefinition = {
  name: string;
  consumes: DomainEventType[];
  concurrency: number;
  handler: EventHandler;
};

export class WorkerRuntime {
  private registered = new Set<string>();

  register(worker: WorkerDefinition): void {
    if (this.registered.has(worker.name)) return;

    for (const eventType of worker.consumes) {
      eventDispatcher.on(eventType, worker.name, async (event) => {
        const startedAt = Date.now();
        
        // Ensure idempotency manager is initialized
        await idempotencyManager.init();

        // STEP 1: CHECK IF PROCESSED (Fast Skip via Redis)
        const shouldSkip = await idempotencyManager.checkFastSkip(event.id, worker.name);
        if (shouldSkip) {
          await metrics.increment("worker.events.skipped", 1, { worker: worker.name, type: event.type });
          return;
        }

        // STEP 2: CLAIM EVENT (Atomic DB Lock)
        const claimed = await idempotencyManager.claimEvent(event.id, worker.name);
        if (!claimed) {
          await metrics.increment("worker.events.conflict", 1, { worker: worker.name, type: event.type });
          return;
        }

        await traceEvent(event, `${worker.name}:started`);

        try {
          // STEP 3: EXECUTE WORKER HANDLER
          await worker.handler(event);
          
          // STEP 4: MARK COMPLETE
          await idempotencyManager.markComplete(event.id, worker.name);
          
          await metrics.increment("worker.events.processed", 1, { worker: worker.name, type: event.type });
          await metrics.timing("worker.events.latency_ms", Date.now() - startedAt, { worker: worker.name });
          await traceEvent(event, `${worker.name}:completed`);
        } catch (error) {
          // STEP 5: ON FAILURE
          await idempotencyManager.markFailed(event.id, worker.name);
          
          await traceEvent(event, `${worker.name}:failed`);
          // Re-throw to let EventDispatcher handle DLQ or retries
          throw error;
        }
      });
    }

    this.registered.add(worker.name);
  }
}

export const workerRuntime = new WorkerRuntime();

