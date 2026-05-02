/**
 * WebSocket client singleton — manages the connection to /ws.
 *
 * Features:
 * - Exponential backoff reconnect (1s → 2s → 5s → 10s → 15s cap)
 * - 150ms coalesce window — batches rapid frames before flushing
 * - Topic ref-counting — multiple components can subscribe safely
 * - Stale detection — no frame for 2.4s → "stale" state
 * - Auto-resubscribe on reconnect
 *
 * Adapted from ULP_Cavite's ws-client.ts (removed Zod, simplified).
 */

import type { ValidFrame, WsState, WsTopic } from "./types";

type FrameListener = (frames: ValidFrame[]) => void;
type StateListener = (s: WsState) => void;

const BACKOFF_SCHEDULE = [1000, 2000, 5000, 10_000, 15_000];
const COALESCE_MS = 150;
const STALE_MS = 2400;

function deriveWsUrl(): string {
  // Env var takes priority
  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl) return envUrl;
  // Derive from current page location
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

class WsClient {
  private ws: WebSocket | null = null;
  private state: WsState = "idle";
  private backoffIdx = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private staleTimer: ReturnType<typeof setTimeout> | null = null;

  // Coalesce buffer
  private buffer: ValidFrame[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  // Topic refcount
  private topicRefs = new Map<string, number>();

  // Listeners
  private frameListeners = new Set<FrameListener>();
  private stateListeners = new Set<StateListener>();

  private url: string;

  constructor() {
    this.url = deriveWsUrl();
  }

  /* ── Public API ── */

  connect(): void {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    this.setState("connecting");
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.backoffIdx = 0;
      this.setState("connected");
      // Re-subscribe to any active topics
      const topics = Array.from(this.topicRefs.keys());
      if (topics.length > 0) {
        this.sendJson({ action: "subscribe", topics });
        this.setState("subscribed");
      }
      this.resetStaleTimer();
    };

    this.ws.onmessage = (ev) => {
      this.resetStaleTimer();
      try {
        const data = JSON.parse(ev.data);
        if (typeof data === "object" && data !== null && "topic" in data) {
          const frame: ValidFrame = {
            topic: data.topic,
            ts_ms: data.ts_ms ?? Date.now(),
            cycle_id: data.cycle_id ?? 0,
            payload: data.payload,
          };
          this.buffer.push(frame);
          this.scheduleFlush();
        }
      } catch {
        // malformed frame — silently drop
      }
    };

    this.ws.onclose = () => {
      this.clearStaleTimer();
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  subscribe(topics: readonly WsTopic[]): void {
    const newTopics: string[] = [];
    for (const t of topics) {
      const count = this.topicRefs.get(t) ?? 0;
      this.topicRefs.set(t, count + 1);
      if (count === 0) newTopics.push(t);
    }
    if (newTopics.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.sendJson({ action: "subscribe", topics: newTopics });
      this.setState("subscribed");
    }
  }

  unsubscribe(topics: readonly WsTopic[]): void {
    const dropTopics: string[] = [];
    for (const t of topics) {
      const count = this.topicRefs.get(t) ?? 0;
      if (count <= 1) {
        this.topicRefs.delete(t);
        dropTopics.push(t);
      } else {
        this.topicRefs.set(t, count - 1);
      }
    }
    if (dropTopics.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      this.sendJson({ action: "unsubscribe", topics: dropTopics });
    }
  }

  onFrames(fn: FrameListener): () => void {
    this.frameListeners.add(fn);
    return () => this.frameListeners.delete(fn);
  }

  onState(fn: StateListener): () => void {
    this.stateListeners.add(fn);
    return () => this.stateListeners.delete(fn);
  }

  /* ── Internals ── */

  private sendJson(obj: unknown): void {
    try {
      this.ws?.send(JSON.stringify(obj));
    } catch {
      // connection dead — reconnect will handle it
    }
  }

  private setState(s: WsState): void {
    if (this.state === s) return;
    this.state = s;
    for (const fn of this.stateListeners) fn(s);
  }

  private scheduleFlush(): void {
    if (this.flushTimer !== null) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      if (this.buffer.length === 0) return;
      const batch = this.buffer;
      this.buffer = [];
      for (const fn of this.frameListeners) fn(batch);
    }, COALESCE_MS);
  }

  private scheduleReconnect(): void {
    this.setState("backoff");
    const delay = BACKOFF_SCHEDULE[Math.min(this.backoffIdx, BACKOFF_SCHEDULE.length - 1)];
    this.backoffIdx++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private resetStaleTimer(): void {
    this.clearStaleTimer();
    this.staleTimer = setTimeout(() => {
      if (this.state === "subscribed" || this.state === "connected") {
        this.setState("stale");
      }
    }, STALE_MS);
  }

  private clearStaleTimer(): void {
    if (this.staleTimer !== null) {
      clearTimeout(this.staleTimer);
      this.staleTimer = null;
    }
  }
}

/* ── Singleton ── */

let _instance: WsClient | null = null;

export function getWsClient(): WsClient {
  if (!_instance) _instance = new WsClient();
  return _instance;
}
