/**
 * Zustand global store — the single source of truth for all real-time
 * Dashboard data received via WebSocket.
 *
 * Replaces the mock `useLiveDashboard` hook with ring-buffer history
 * and latest-value snapshots fed by the WsClient.
 */

import { create } from "zustand";
import type {
  AlarmPayload,
  AlarmRecord,
  Grade,
  HistoryRow,
  LiveCyclePayload,
  StatusPayload,
  ValidFrame,
  WsState,
} from "./types";

/* ── Constants ── */

const HISTORY_CAP = 100;
const ALARM_CAP = 50;

/* ── Ring buffer helper ── */

function pushCapped<T>(arr: T[], item: T, cap: number): T[] {
  const next = [...arr, item];
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/* ── State interface ── */

interface LiveState {
  wsState: WsState;
  wsConnected: boolean;

  latest: {
    cycle?: LiveCyclePayload & { ts_ms: number };
    status?: StatusPayload & { ts_ms: number };
  };

  history: {
    cycle: HistoryRow[];
  };

  alarms: AlarmRecord[];

  // Actions
  commitBatch: (frames: ValidFrame[]) => void;
  setWsState: (s: WsState) => void;
  setWsConnected: (v: boolean) => void;
  acknowledgeAlarm: (id: string) => void;
  reset: () => void;
}

/* ── Store ── */

export const useLiveStore = create<LiveState>((set) => ({
  wsState: "idle",
  wsConnected: false,

  latest: {},
  history: { cycle: [] },
  alarms: [],

  commitBatch: (frames) =>
    set((state) => {
      let latest = { ...state.latest };
      let cycleHistory = state.history.cycle;
      let alarms = state.alarms;

      for (const frame of frames) {
        switch (frame.topic) {
          case "mc26/live/cycle": {
            const p = frame.payload as LiveCyclePayload;
            const prev = latest.cycle;

            // Carry-forward: never regress to null once we've had a real value.
            // If the incoming frame has a null score, keep the previous value.
            const sqi = p.sqi ?? prev?.sqi ?? 0;
            const pqi = p.pqi ?? prev?.pqi ?? 0;
            const tqi = p.tqi ?? prev?.tqi ?? null;

            latest = {
              ...latest,
              cycle: { ...p, sqi, pqi, tqi, ts_ms: frame.ts_ms },
            };
            const row: HistoryRow = {
              cycle_id: frame.cycle_id,
              ts_ms: frame.ts_ms,
              sqi,
              pqi,
              tqi,
              grade: p.grade as Grade,
            };
            cycleHistory = pushCapped(cycleHistory, row, HISTORY_CAP);
            break;
          }
          case "mc26/live/status": {
            const p = frame.payload as StatusPayload;
            latest = {
              ...latest,
              status: { ...p, ts_ms: frame.ts_ms },
            };
            break;
          }
          case "mc26/alarm": {
            const p = frame.payload as AlarmPayload;
            const record: AlarmRecord = {
              id: p.id,
              ts_ms: frame.ts_ms,
              severity: p.severity,
              message: p.message,
              acknowledged: p.acknowledged,
            };
            // Upsert by id
            const idx = alarms.findIndex((a) => a.id === record.id);
            if (idx >= 0) {
              alarms = [...alarms];
              alarms[idx] = record;
            } else {
              alarms = pushCapped(alarms, record, ALARM_CAP);
            }
            break;
          }
          // Other topics (pqi/detail, tqi/detail, profile, sit) will be
          // handled here when PQI/TQI pages are integrated.
          default:
            break;
        }
      }

      return {
        latest,
        history: { cycle: cycleHistory },
        alarms,
      };
    }),

  setWsState: (s) =>
    set({
      wsState: s,
      wsConnected: s === "connected" || s === "subscribed",
    }),

  setWsConnected: (v) => set({ wsConnected: v }),

  acknowledgeAlarm: (id) =>
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === id ? { ...a, acknowledged: true } : a,
      ),
    })),

  reset: () =>
    set({
      wsState: "idle",
      wsConnected: false,
      latest: {},
      history: { cycle: [] },
      alarms: [],
    }),
}));

/* ── Selectors (memoize via shallow equality in Zustand) ── */

export const selLatestCycle = (s: LiveState) => s.latest.cycle;
export const selLatestStatus = (s: LiveState) => s.latest.status;
export const selCycleHistory = (s: LiveState) => s.history.cycle;
export const selAlarms = (s: LiveState) => s.alarms;
export const selWsState = (s: LiveState) => s.wsState;
export const selWsConnected = (s: LiveState) => s.wsConnected;
