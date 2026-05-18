import type { DomainEventType, EventStreamName } from "./EventTypes";

export type EventDefinition = {
  type: DomainEventType;
  stream: EventStreamName;
  description: string;
  replayable: boolean;
  consumers: string[];
};

const definitions = new Map<DomainEventType, EventDefinition>();

export class EventRegistry {
  register(definition: EventDefinition): void {
    definitions.set(definition.type, definition);
  }

  get(type: DomainEventType): EventDefinition | undefined {
    return definitions.get(type);
  }

  all(): EventDefinition[] {
    return Array.from(definitions.values());
  }
}

export const eventRegistry = new EventRegistry();

[
  ["message.sent", "messages", "A room or private message was accepted.", ["moderation-worker", "feed-worker", "analytics-worker", "reputation-worker"]],
  ["room.joined", "rooms", "A socket/user joined a room.", ["presence-worker", "analytics-worker", "recommendation-worker"]],
  ["room.left", "rooms", "A socket/user left a room.", ["presence-worker", "analytics-worker"]],
  ["user.followed", "social", "A user followed another user.", ["feed-worker", "recommendation-worker", "reputation-worker"]],
  ["gift.sent", "gifts", "A gift was sent to a user or room.", ["feed-worker", "analytics-worker", "reputation-worker"]],
  ["profile.viewed", "social", "A profile was viewed.", ["recommendation-worker", "analytics-worker"]],
  ["voice.started", "voice", "A user started speaking.", ["presence-worker", "analytics-worker"]],
  ["voice.ended", "voice", "A user stopped speaking.", ["presence-worker", "analytics-worker"]],
  ["moderation.flagged", "moderation", "Content or behavior was flagged.", ["moderation-worker", "reputation-worker"]],
  ["punishment.applied", "moderation", "A moderation punishment was applied.", ["moderation-worker", "reputation-worker", "notification-worker"]],
  ["reaction.created", "social", "A reaction was created.", ["feed-worker", "reputation-worker"]],
  ["wall.posted", "feeds", "A wall post was created.", ["feed-worker", "recommendation-worker", "moderation-worker"]],
  ["presence.updated", "presence", "Presence intelligence state changed.", ["presence-worker", "analytics-worker"]],
  ["feed.ranked", "feeds", "A feed item received a ranking score.", ["analytics-worker"]],
  ["recommendation.generated", "recommendations", "Recommendations were generated.", ["analytics-worker"]],
  ["reputation.recalculated", "reputation", "Behavioral reputation changed.", ["moderation-worker", "recommendation-worker"]],
  ["worker.failed", "observability", "A worker failed while handling an event.", ["cleanup-worker"]],
].forEach(([type, stream, description, consumers]) => {
  eventRegistry.register({
    type: type as DomainEventType,
    stream: stream as EventStreamName,
    description: description as string,
    replayable: true,
    consumers: consumers as string[],
  });
});
