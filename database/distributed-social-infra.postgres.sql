CREATE TABLE IF NOT EXISTS event_store (
  id uuid PRIMARY KEY,
  type varchar(120) NOT NULL,
  stream varchar(80) NOT NULL,
  version integer NOT NULL DEFAULT 1,
  actor_id varchar(128),
  target_id varchar(128),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status varchar(40) NOT NULL DEFAULT 'published',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  persisted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS event_store_type_idx ON event_store(type);
CREATE INDEX IF NOT EXISTS event_store_stream_idx ON event_store(stream);
CREATE INDEX IF NOT EXISTS event_store_occurred_idx ON event_store(occurred_at);

CREATE TABLE IF NOT EXISTS event_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aggregate_type varchar(80) NOT NULL,
  aggregate_id varchar(128) NOT NULL,
  version integer NOT NULL DEFAULT 1,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (aggregate_type, aggregate_id, version)
);

CREATE TABLE IF NOT EXISTS event_replays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NULL REFERENCES users(id) ON DELETE SET NULL,
  status varchar(40) NOT NULL DEFAULT 'pending',
  filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  replayed_count integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120),
  algorithm varchar(80) NOT NULL DEFAULT 'affinity_v1',
  score numeric(10,4) NOT NULL DEFAULT 0,
  members jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS interaction_heat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id varchar(128) NOT NULL,
  target_id varchar(128) NOT NULL,
  scope varchar(40) NOT NULL DEFAULT 'user',
  heat_score numeric(10,4) NOT NULL DEFAULT 0,
  decay_rate numeric(6,4) NOT NULL DEFAULT 0.0500,
  last_interaction_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_id, target_id, scope)
);

CREATE TABLE IF NOT EXISTS influence_scores (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  room_influence numeric(10,4) NOT NULL DEFAULT 0,
  network_influence numeric(10,4) NOT NULL DEFAULT 0,
  trust_propagation numeric(10,4) NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now()
);
