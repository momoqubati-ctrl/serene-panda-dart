import { deadLetterQueue } from "./DeadLetterQueue";
import type { EventEnvelope } from "./EventEnvelope";
import type { DomainEventType } from "./EventTypes";

export type EventHandler = (event: EventEnvelope) => Promise<void> | void;

type HandlerRegistration = {
  worker: string;
  handler: EventHandler;
};

export class EventDispatcher {
  private handlers = new Map<DomainEventType, HandlerRegistration[]>();

  on(type: DomainEventType, worker: string, handler: EventHandler): void {
    const existing = this.handlers.get(type) ?? [];
    existing.push({ worker, handler });
    this.handlers.set(type, existing);
  }

  async dispatch(event: EventEnvelope): Promise<void> {
    const handlers = this.handlers.get(event.type) ?? [];
    await Promise.all(
      handlers.map(async ({ worker, handler }) => {
        try {
          await handler(event);
        } catch (error: any) {
          await deadLetterQueue.push({
            event,
            worker,
            error: error?.message ?? String(error),
            failedAt: new Date().toISOString(),
            attempts: Number(event.metadata.retryCount ?? 0) + 1,
          });
        }
      })
    );
  }
}

export const eventDispatcher = new EventDispatcher();
