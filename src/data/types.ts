/**
 * Wire payload types for the WebSocket data pipeline.
 *
 * These interfaces mirror the JSON shapes emitted by the backend's
 * ws.py live loop.  No Zod — we use plain TS interfaces + runtime
 * typeof guards in the ws-client.
 */

/* ── Topic union ── */

export type WsTopic =
  | "mc26/live/cycle"
  | "mc26/live/status"
  | "mc26/alarm"
  | "mc26/live/pqi/detail"
  | "mc26/live/tqi/detail"
  | "mc26/live/profile"
  | "mc26/live/sit";

/* ── WebSocket envelope ── */

export interface WsEnvelope<T = unknown> {
  topic: string;
  ts_ms: number;
  cycle_id: number;
  payload: T;
}

/* ── Payloads ── */

export type Grade = "green" | "amber" | "red";

export interface LiveCyclePayload {
  sqi: number;
  pqi: number;
  tqi: number | null;
  vqi: number | null;
  grade: Grade;
  sku: string;
  cycle_id: number;
  running: boolean;
}

export interface StatusPayload {
  running: boolean;
  cpm: number;
  sku: string;
}

export interface AlarmPayload {
  id: string;
  severity: "info" | "warn" | "critical";
  message: string;
  acknowledged: boolean;
  shelved_until: number | null;
}

export interface PqiDetailPayload {
  r_sit: number;
  r_trq: number;
  r_time: number;
  t_inner_c: number;
  avg_torque: number;
  dwell_ms: number;
  jaw_temp_c: number;
  tailing_index: number;
  tailing_status: string;
}

export interface TqiDetailPayload {
  tqi: number | null;
  fill_score: number | null;
  contamination_score: number | null;
  uniformity_score: number | null;
  status: string | null;
  defect_description: string | null;
}

export interface ProfilePayload {
  degrees: number[];
  position: number[];
  torque: number[];
}

export interface SitPayload {
  time_ms: number[];
  t_inner_c: number[];
}

export interface PqiHistoryRow {
  cycle_id: number;
  ts_ms: number;
  r_sit: number;
  r_trq: number;
  r_time: number;
  dwell_ms: number;
  tailing_index: number;
}

export interface TqiHistoryRow {
  cycle_id: number;
  ts_ms: number;
  fill_score: number;
  contamination_score: number;
  uniformity_score: number;
  tqi: number;
}

/* ── Validated frame (after parsing the envelope) ── */

export interface ValidFrame {
  topic: string;
  ts_ms: number;
  cycle_id: number;
  payload: unknown;
}

/* ── Store types ── */

export type WsState =
  | "idle"
  | "connecting"
  | "connected"
  | "subscribed"
  | "stale"
  | "backoff"
  | "closed";

export interface HistoryRow {
  cycle_id: number;
  ts_ms: number;
  sqi: number;
  pqi: number;
  tqi: number | null;
  grade: Grade;
}

export interface AlarmRecord {
  id: string;
  ts_ms: number;
  severity: "info" | "warn" | "critical";
  message: string;
  acknowledged: boolean;
}
