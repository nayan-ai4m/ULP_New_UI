import { useEffect, useRef, useState } from "react";

export type IndexKey = "sqi" | "pqi" | "tqi";

export interface TrendPoint {
  ts: number;
  value: number;
}

export interface DashboardSnapshot {
  machine: {
    id: string;
    state: "Running" | "Idle" | "Stopped" | "Fault";
    cycle: number;
    sku: string;
    qbomRev: string;
    laminate: string;
    shift: string;
    operator: string;
  };
  scores: Record<IndexKey, number>;
  trends: Record<IndexKey, TrendPoint[]>;
  oee: { availability: number; performance: number; quality: number; rejectPct: number; throughput: number };
  sachets: { id: string; grade: "good" | "warn" | "critical"; defects?: string[] }[];
  alerts: AlertEvent[];
}

export interface AlertEvent {
  id: string;
  ts: number;
  index: IndexKey | "DEOC";
  grade: "warn" | "critical";
  reason: string;
  prescription: string;
  applied?: boolean;
}

const TREND_POINTS = 60;

function clamp(n: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, n));
}

function seedTrend(base: number): TrendPoint[] {
  const now = Date.now();
  const out: TrendPoint[] = [];
  let v = base;
  for (let i = TREND_POINTS - 1; i >= 0; i--) {
    v = clamp(v + (Math.random() - 0.5) * 0.04, 0.5, 0.98);
    out.push({ ts: now - i * 1000, value: v });
  }
  return out;
}

const DEFECT_CLASSES = ["wrinkle", "contam", "mis-seal", "edge-burn", "cold-seal"];

function seedSachets(): DashboardSnapshot["sachets"] {
  return Array.from({ length: 24 }, (_, i) => {
    const r = Math.random();
    const grade: "good" | "warn" | "critical" = r > 0.92 ? "critical" : r > 0.78 ? "warn" : "good";
    return {
      id: `S-${200000 + i}`,
      grade,
      defects: grade === "good" ? undefined : [DEFECT_CLASSES[Math.floor(Math.random() * DEFECT_CLASSES.length)]],
    };
  });
}

function initial(): DashboardSnapshot {
  return {
    machine: {
      id: "MC-26",
      state: "Running",
      cycle: 200015,
      sku: "SKU-A · Knorr Chicken 8g",
      qbomRev: "v3.2",
      laminate: "PET12 / Met-PET12 / LDPE60",
      shift: "B",
      operator: "Bhushan K.",
    },
    scores: { sqi: 0.86, pqi: 0.87, tqi: 0.9 },
    trends: { sqi: seedTrend(0.86), pqi: seedTrend(0.87), tqi: seedTrend(0.9) },
    oee: { availability: 0.96, performance: 0.92, quality: 0.991, rejectPct: 0.4, throughput: 142 },
    sachets: seedSachets(),
    alerts: [
      {
        id: "a1",
        ts: Date.now() - 42_000,
        index: "tqi",
        grade: "warn",
        reason: "TQI dipped to 0.62 — jaw temperature drift on Loop-3",
        prescription: "Increase rear jaw setpoint +3°C (158→161°C). Re-evaluate in 30 cycles.",
      },
      {
        id: "a2",
        ts: Date.now() - 6 * 60_000,
        index: "DEOC",
        grade: "critical",
        reason: "Red sachet S-199987 — defect class: cold-seal (conf 0.94)",
        prescription: "Inspect rear jaw heater element. Trigger reject pulse confirmed.",
        applied: true,
      },
    ],
  };
}

export function useLiveDashboard(): DashboardSnapshot {
  const [snap, setSnap] = useState<DashboardSnapshot>(() => initial());
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      setSnap((prev) => {
        const next: DashboardSnapshot = { ...prev };
        const now = Date.now();

        // Drift each score and append to trend
        const newScores = { ...prev.scores };
        const newTrends = { ...prev.trends };
        (Object.keys(newScores) as IndexKey[]).forEach((k) => {
          const drift = (Math.random() - 0.5) * 0.05;
          // occasional dip
          const dip = Math.random() < 0.04 ? -0.18 : 0;
          const v = clamp(prev.scores[k] + drift + dip, 0.45, 0.98);
          newScores[k] = v;
          newTrends[k] = [...prev.trends[k].slice(-(TREND_POINTS - 1)), { ts: now, value: v }];
        });
        next.scores = newScores;
        next.trends = newTrends;

        next.machine = { ...prev.machine, cycle: prev.machine.cycle + 1 };

        // Sachet feed: shift in a new one occasionally
        if (tick.current % 2 === 0) {
          const r = Math.random();
          const grade: "good" | "warn" | "critical" = r > 0.93 ? "critical" : r > 0.8 ? "warn" : "good";
          const newSachet = {
            id: `S-${200000 + prev.machine.cycle}`,
            grade,
            defects: grade === "good" ? undefined : [DEFECT_CLASSES[Math.floor(Math.random() * DEFECT_CLASSES.length)]],
          };
          next.sachets = [newSachet, ...prev.sachets].slice(0, 24);
        }

        // Occasional new alert
        if (Math.random() < 0.05) {
          const idx: IndexKey = (["sqi", "pqi", "tqi"] as const)[Math.floor(Math.random() * 3)];
          const grade: "warn" | "critical" = Math.random() < 0.25 ? "critical" : "warn";
          const reasons: Record<IndexKey, string> = {
            sqi: "Seal pressure variance over 3-cycle window",
            pqi: "Film tension band drifted above tolerance",
            tqi: "Front jaw temp gradient crossed amber band",
          };
          const rx: Record<IndexKey, string> = {
            sqi: "Trim seal dwell -10ms. Re-evaluate in 20 cycles.",
            pqi: "Reduce film tension setpoint -2 N. Verify no skew.",
            tqi: "Increase front jaw setpoint +2°C. Hold 60 cycles.",
          };
          next.alerts = [
            {
              id: `a${Date.now()}`,
              ts: now,
              index: idx,
              grade,
              reason: reasons[idx],
              prescription: rx[idx],
            },
            ...prev.alerts,
          ].slice(0, 8);
        }

        // OEE jitter
        next.oee = {
          ...prev.oee,
          performance: clamp(prev.oee.performance + (Math.random() - 0.5) * 0.005, 0.8, 0.99),
          rejectPct: clamp(prev.oee.rejectPct + (Math.random() - 0.5) * 0.05, 0, 3),
          throughput: 140 + Math.floor(Math.random() * 8),
        };

        return next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return snap;
}

export function applyPrescription(_id: string) {
  // Stub — real impl will REQUEST 'plc' WRITE through Cerebro broker.
}
