import { randomUUID } from "node:crypto";
import type {
  DomainEventPayload,
  DomainEventType,
  EventActor,
  EventMetadata,
  EventPriority,
  EventStreamName,
  EventTarget,
} from "./EventTypes";

export type EventEnvelope<TPayload extends DomainEventPayload = DomainEventPayload> = {
  id: string;
  type: DomainEventType;
  stream: EventStreamName;
  version: number;
  occurredAt: string;
  actor?: EventActor;
  target?: EventTarget;
  payload: TPayload;
  metadata: EventMetadata;
  priority: EventPriority;
  replayable: boolean;
};

export type EventInput<TPayload extends DomainEventPayload = DomainEventPayload> = {
  type: DomainEventType;
  stream: EventStreamName;
  actor?: EventActor;
  target?: EventTarget;
  payload?: TPayload;
  metadata?: EventMetadata;
  priority?: EventPriority;
  replayable?: boolean;
  version?: number;
};

export function createEventEnvelope<TPayload extends DomainEventPayload>(
  input: EventInput<TPayload>
): EventEnvelope<TPayload> {
  return {
    id: randomUUID(),
    type: input.type,
    stream: input.stream,
    version: input.version ?? 1,
    occurredAt: new Date().toISOString(),
    actor: input.actor,
    target: input.target,
    payload: input.payload ?? ({} as TPayload),
    metadata: {
      correlationId: input.metadata?.correlationId ?? randomUUID(),
      source: input.metadata?.source ?? "server",
      ...input.metadata,
    },
    priority: input.priority ?? "normal",
    replayable: input.replayable ?? true,
  };
}
