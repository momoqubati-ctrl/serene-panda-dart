import { getSocket } from "@/lib/socket";

/**
 * Presence manager for client side.
 * - Tracks user interaction to detect idle (2 minutes).
 * - Allows manual status (busy/away) that persists for the session.
 * - Emits status updates to the server via socket.io.
 * - Calls a callback whenever the displayed status changes.
 */
export class PresenceManager {
  private idleTimeoutMs = 2 * 60 * 1000; // 2 minutes
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private manualStatus: string | null = null; // "busy" | "away" | null
  private currentStatus: string = "online"; // "online" | "idle"
  private statusCallback: ((status: string) => void) | null = null;

  constructor() {
    // Load persisted manual status for the session (stored in localStorage)
    const stored = localStorage.getItem("manualStatus");
    if (stored === "busy" || stored === "away") {
      this.manualStatus = stored;
    }
    this.setupInteractionListeners();
    this.updateStatusBasedOnActivity();
  }

  /** Register a callback to receive status changes */
  onStatusChange(cb: (status: string) => void) {
    this.statusCallback = cb;
    // Emit initial status
    cb(this.getEffectiveStatus());
  }

  /** Get the status that should be displayed */
  getEffectiveStatus(): string {
    if (this.manualStatus) {
      return this.manualStatus; // busy or away
    }
    return this.currentStatus; // online or idle
  }

  /** Set a manual status; persists for this session */
  setManualStatus(status: "busy" | "away" | null) {
    if (status) {
      this.manualStatus = status;
      localStorage.setItem("manualStatus", status);
    } else {
      this.manualStatus = null;
      localStorage.removeItem("manualStatus");
    }
    this.emitStatus();
  }

  /** Reset to automatic detection (clears manual status) */
  clearManualStatus() {
    this.setManualStatus(null);
  }

  /** Internal: start / restart idle timer */
  private restartIdleTimer() {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => this.setIdle(), this.idleTimeoutMs);
  }

  private setActive() {
    if (this.manualStatus) return; // manual overrides
    if (this.currentStatus !== "online") {
      this.currentStatus = "online";
      this.emitStatus();
    }
    this.restartIdleTimer();
  }

  private setIdle() {
    if (this.manualStatus) return; // manual overrides
    if (this.currentStatus !== "idle") {
      this.currentStatus = "idle";
      this.emitStatus();
    }
  }

  private emitStatus() {
    const effective = this.getEffectiveStatus();
    // Notify UI via callback
    this.statusCallback?.(effective);
    // Emit to server for other users (optional, backend should handle "status_update")
    try {
      const socket = getSocket();
      socket.emit("status_update", { status: effective });
    } catch (e) {
      // socket may not be ready yet; ignore
    }
  }

  /** Interaction listeners to detect activity */
  private setupInteractionListeners() {
    const activityEvents = ["mousemove", "keydown", "click", "touchstart"];
    activityEvents.forEach((ev) => {
      window.addEventListener(ev, () => this.handleActivity());
    });
    // Start timer initially
    this.restartIdleTimer();
  }

  private handleActivity() {
    this.setActive();
  }

  /** Called when server triggers a status refresh (e.g., after reconnection) */
  updateStatusBasedOnActivity() {
    this.setActive();
  }
}

// Export a singleton for easy import
export const presenceManager = new PresenceManager();
