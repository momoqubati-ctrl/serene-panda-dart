# Distributed Realtime Social Infrastructure

## Event Flow Architecture

The existing chat flow now emits domain events through `server/core/events/EventBus.ts`.

Current live integrations:
- `message.sent` from `server/services/chatStore.ts`
- `room.joined` from `server/socket/roomHandlers.ts`
- `room.left` from `server/socket/roomHandlers.ts`

Every event is wrapped in an `EventEnvelope` with stream, actor, target, payload, metadata, priority, and replay flags. Events are persisted to `event_store` when the table exists, published to Redis pub/sub channels, appended to Redis streams, and dispatched to registered workers.

## Worker Topology

Workers are registered in `server/workers/index.ts`:
- `moderation-worker`
- `analytics-worker`
- `feed-worker`
- `recommendation-worker`
- `notification-worker`
- `reputation-worker`
- `presence-worker`
- `cleanup-worker`

Each worker consumes domain events through `WorkerRuntime`, records metrics, emits traces, and sends failed jobs to the dead letter queue.

## Redis Strategy

Redis is used for:
- event pub/sub: `events:<stream>`
- event streams: `stream:<stream>` and `stream:all`
- dead letters: `queue:dead-letter`
- presence: `presence:<userId>`
- presence signals: `presence:signals:<userId>`
- socket state: `socket:state:<socketId>`
- room and feed ranking: `ranking:*`
- recommendation caches: `recommendation:*`
- observability metrics: `metrics:*`

## CQRS Flow

Commands live in `server/commands/`:
- `SendMessageCommand`
- `JoinRoomCommand`
- `FollowUserCommand`

Queries live in `server/queries/`:
- `GetRoomFeedQuery`
- `GetUserProfileQuery`
- `GetTrendingRoomsQuery`

Projections live in `server/projections/` and can be rebuilt from `event_store` with `ReplayEngine`.

## Presence Intelligence Design

`server/services/presenceIntelligence.ts` now supports V2 states:
- `active`
- `idle`
- `lurking`
- `passive_watching`
- `multitasking`
- `speaking`
- `focused`
- `hidden_watching`

The engine calculates attention from focus, interaction depth, typing frequency, speaking frequency, passive viewing, and hidden mode.

## Feed Ranking Logic

`server/services/feedRankingEngine.ts` ranks feed events using:
- recency
- affinity
- engagement
- trust score
- toxicity suppression
- room popularity
- interaction depth

Scores are written to Redis sorted sets for global and room feeds.

## Recommendation Logic

`server/services/recommendationEngine.ts` consumes social and room events to update room/user recommendation signals in Redis. It is designed to be extended with social graph, interaction graph, room affinity, behavior similarity, and realtime engagement.

## Reputation Calculations

`server/services/reputationEngine.ts` updates `behavior_scores` from realtime events. It adjusts trust, toxicity, influence, and spam probability. The values are designed to influence moderation, feed ranking, and recommendations.

## Socket Scaling Strategy

`server/socket/SocketGateway.ts` adds shard-aware socket state. `server/socket/SocketChannels.ts` centralizes channels:
- room channels
- social channels
- moderation channels
- notification channels
- admin channels

This keeps the existing Socket.IO flow working while preparing for Redis adapter and horizontal scaling.

## Moderation Pipelines

`server/services/moderationIntelligence.ts` provides AI-ready hooks without adding AI models. It calculates spam fingerprints, burst/flood score, raid score, and coordinated abuse score, then emits `moderation.flagged` when thresholds are crossed.

## Event Replay Architecture

`server/core/events/ReplayEngine.ts` reads from `event_store` and redispatches events by type/time range. `event_snapshots` and `event_replays` were added to the Drizzle schema and SQL foundation.

## Distributed Scaling Plan

The current phase prepares the system for:
- append-only event persistence
- independent workers
- Redis streams/pubsub
- shard-ready socket channels
- CQRS read models
- replayable projections

Next scaling step: add the official Socket.IO Redis adapter and run workers as separate Node processes using the same `WorkerRuntime` definitions.

## Observability Architecture

`server/observability/` includes:
- metrics counters/timings in Redis
- event tracing by correlation id
- worker latency tracking
- socket connect/disconnect metrics

## Realtime Security Design

`server/services/realtimeSecurity.ts` provides hooks for:
- socket abuse rate limits
- anti automation signals
- privilege check logging
- future anti replay and fake engagement checks

The security path is intentionally hook-based so it can be inserted into socket handlers and admin permission checks incrementally.
