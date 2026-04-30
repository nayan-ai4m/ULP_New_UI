import { useEffect, useRef, useState } from "react";

export type IndexKey = "sqi" | "pqi" | "tqi" | "vqi";

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
  action: string;
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

function seedSqiTrend(pqiTrend: TrendPoint[], tqiTrend: TrendPoint[], vqiTrend: TrendPoint[]): TrendPoint[] {
  return pqiTrend.map((p, i) => ({
    ts: p.ts,
    value: clamp(p.value * tqiTrend[i].value * vqiTrend[i].value),
  }));
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
  const pqiTrend = seedTrend(0.87);
  const tqiTrend = seedTrend(0.9);
  const vqiTrend = seedTrend(0.88);
  const sqiTrend = seedSqiTrend(pqiTrend, tqiTrend, vqiTrend);
  const pqi = 0.87, tqi = 0.9, vqi = 0.88;
  const sqi = clamp(pqi * tqi);

  return {
    machine: {
      id: "MC-26",
      state: "Running",
      cycle: 200015,
      sku: "Clear Men Blue",
      qbomRev: "v3.2",
      laminate: "PET12 / Met-PET12 / LDPE60",
      shift: "B",
      operator: "Nikki",
    },
    scores: { sqi, pqi, tqi, vqi },
    trends: { sqi: sqiTrend, pqi: pqiTrend, tqi: tqiTrend, vqi: vqiTrend },
    oee: { availability: 0.96, performance: 0.92, quality: 0.991, rejectPct: 0.4, throughput: 142 },
    sachets: seedSachets(),
    alerts: [
      {
        id: "a1",
        ts: Date.now() - 42_000,
        index: "tqi",
        grade: "warn",
        reason: "TQI dipped to 0.62 — jaw temperature drift on Loop-3",
        action: "Increased rear jaw setpoint +3°C (158→161°C). Monitoring for 30 cycles.",
      },
      {
        id: "a2",
        ts: Date.now() - 6 * 60_000,
        index: "DEOC",
        grade: "critical",
        reason: "Red sachet S-199987 — defect class: cold-seal (conf 0.94)",
        action: "Machine stopped. Rear jaw heater element flagged for inspection.",
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

        // Drift PQI, TQI, VQI independently; compute SQI as their product
        const newScores = { ...prev.scores };
        const newTrends = { ...prev.trends };
        (["pqi", "tqi", "vqi"] as const).forEach((k) => {
          const drift = (Math.random() - 0.5) * 0.05;
          const dip = Math.random() < 0.04 ? -0.18 : 0;
          const v = clamp(prev.scores[k] + drift + dip, 0.45, 0.98);
          newScores[k] = v;
          newTrends[k] = [...prev.trends[k].slice(-(TREND_POINTS - 1)), { ts: now, value: v }];
        });
        // SQI = PQI × TQI × VQI
        newScores.sqi = clamp(newScores.pqi * newScores.tqi * newScores.vqi);
        newTrends.sqi = [...prev.trends.sqi.slice(-(TREND_POINTS - 1)), { ts: now, value: newScores.sqi }];
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
          const idx: IndexKey = (["sqi", "pqi", "tqi", "vqi"] as const)[Math.floor(Math.random() * 4)];
          const grade: "warn" | "critical" = Math.random() < 0.25 ? "critical" : "warn";
          const reasons: Record<IndexKey, string> = {
            sqi: "SQI composite dropped below threshold",
            pqi: "Film tension band drifted above tolerance",
            tqi: "Front jaw temp gradient crossed amber band",
            vqi: "Visual anomaly detected in sachet print region",
          };
          const actions: Record<IndexKey, { warn: string; critical: string }> = {
            sqi: {
              warn: "Adjusted sub-index parameters. Monitoring composite recovery.",
              critical: "Machine stopped. SQI composite critically low — manual inspection required.",
            },
            pqi: {
              warn: "Reduced film tension setpoint by 2 N. Monitoring for skew.",
              critical: "Machine stopped. Film tension out of safe operating range.",
            },
            tqi: {
              warn: "Increased front jaw setpoint +2°C. Holding for 60 cycles.",
              critical: "Machine stopped. Thermal profile critically outside envelope.",
            },
            vqi: {
              warn: "Adjusted camera exposure. Re-calibrating print registration.",
              critical: "Machine stopped. Persistent visual defects detected.",
            },
          };
          next.alerts = [
            {
              id: `a${Date.now()}`,
              ts: now,
              index: idx,
              grade,
              reason: reasons[idx],
              action: actions[idx][grade],
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
