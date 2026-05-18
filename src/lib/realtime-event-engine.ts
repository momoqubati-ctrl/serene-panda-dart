type RealtimeEvent = {
  id?: string;
  type: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
};

type RealtimeListener = (event: RealtimeEvent) => void;

class RealtimeEventEngine {
  private listeners = new Map<string, Set<RealtimeListener>>();
  private pending: RealtimeEvent[] = [];
  private flushTimer: number | null = null;

  on(type: string, listener: RealtimeListener): () => void {
    const listeners = this.listeners.get(type) ?? new Set<RealtimeListener>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.listeners.delete(type);
    };
  }

  enqueue(event: RealtimeEvent): void {
    this.pending.push({ ...event, occurredAt: event.occurredAt ?? new Date().toISOString() });
    if (this.flushTimer !== null) return;
    this.flushTimer = window.setTimeout(() => this.flush(), 16);
  }

  applyOptimistic(event: RealtimeEvent): void {
    this.dispatch({ ...event, payload: { ...(event.payload ?? {}), optimistic: true } });
  }

  private flush(): void {
    const batch = this.pending.splice(0, this.pending.length);
    this.flushTimer = null;
    for (const event of batch) this.dispatch(event);
  }

  private dispatch(event: RealtimeEvent): void {
    this.listeners.get(event.type)?.forEach((listener) => listener(event));
    this.listeners.get("*")?.forEach((listener) => listener(event));
  }
}

export const realtimeEventEngine = new RealtimeEventEngine();
