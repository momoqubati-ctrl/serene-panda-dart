export type DomainEventType =
  | "message.sent"
  | "room.joined"
  | "room.left"
  | "user.followed"
  | "gift.sent"
  | "profile.viewed"
  | "voice.started"
  | "voice.ended"
  | "moderation.flagged"
  | "punishment.applied"
  | "reaction.created"
  | "wall.posted"
  | "presence.updated"
  | "feed.ranked"
  | "recommendation.generated"
  | "reputation.recalculated"
  | "worker.failed";

export type EventPriority = "low" | "normal" | "high" | "critical";

export type EventStreamName =
  | "messages"
  | "rooms"
  | "social"
  | "gifts"
  | "voice"
  | "moderation"
  | "presence"
  | "feeds"
  | "recommendations"
  | "reputation"
  | "observability";

export type EventActor = {
  id?: string;
  username?: string;
  role?: string;
  socketId?: string;
  ip?: string;
};

export type EventTarget = {
  id?: string;
  type?: string;
  roomId?: string;
  userId?: string;
};

export type EventMetadata = {
  requestId?: string;
  correlationId?: string;
  causationId?: string;
  source?: string;
  shardKey?: string;
  socketId?: string;
  roomId?: string;
  retryCount?: number;
  tags?: string[];
  [key: string]: unknown;
};

export type DomainEventPayload = Record<string, unknown>;
