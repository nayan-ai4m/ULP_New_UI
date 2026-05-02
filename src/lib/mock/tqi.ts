import { useEffect, useRef, useState } from "react";

export interface JawPoint { ts: number; actual: number; setpoint: number }
export interface GradientPoint { ts: number; delta: number }
export interface TrendPoint { ts: number; value: number }

export interface ThermalComponent {
  key: "front" | "rear" | "uniformity";
  label: string;
  weight: number;
  actual: number;       // °C
  setpoint: number;     // °C
  deviation: number;    // actual - setpoint (signed)
  normalized: number;   // 0..1 — how close to setpoint
  weighted: number;     // weight * normalized
}

export interface TqiSnapshot {
  tqi: number;
  grade: "green" | "amber" | "red";
  components: ThermalComponent[];
  front: { series: JawPoint[]; setpoint: number };
  rear: { series: JawPoint[]; setpoint: number };
  gradient: { series: GradientPoint[]; tolerance: number; nominal: number };
  tqiTrend: TrendPoint[];
  status: string | null;
  defect_description: string | null;
}

export interface JawSnapshot {
  front: { series: JawPoint[]; setpoint: number };
  rear: { series: JawPoint[]; setpoint: number };
  gradient: { series: GradientPoint[]; tolerance: number; nominal: number };
}

const FRONT_SP = 158;   // front jaw setpoint °C
const REAR_SP = 161;   // rear jaw setpoint °C
const GRAD_TOL = 2;     // ±°C cross-jaw tolerance around nominal delta

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

function seedJaw(setpoint: number, n = 60): JawPoint[] {
  const now = Date.now();
  const out: JawPoint[] = [];
  let v = setpoint + (Math.random() - 0.5) * 2;
  for (let i = n - 1; i >= 0; i--) {
    v = clamp(v + (Math.random() - 0.5) * 0.6, setpoint - 5, setpoint + 5);
    out.push({ ts: now - i * 1500, actual: +v.toFixed(2), setpoint });
  }
  return out;
}

function seedGradient(frontSeries: JawPoint[], rearSeries: JawPoint[]): GradientPoint[] {
  return frontSeries.map((f, i) => ({
    ts: f.ts,
    delta: +Math.abs(f.actual - rearSeries[i].actual).toFixed(2),
  }));
}

function seedTrend(base: number, n = 90): TrendPoint[] {
  const now = Date.now();
  const out: TrendPoint[] = [];
  let v = base;
  for (let i = n - 1; i >= 0; i--) {
    v = clamp(v + (Math.random() - 0.5) * 0.05, 0.4, 0.98);
    out.push({ ts: now - i * 1500, value: +v.toFixed(3) });
  }
  return out;
}

function computeComponents(
  frontActual: number,
  rearActual: number,
): ThermalComponent[] {
  // Normalize: 1.0 = on setpoint, 0 = 5°C off
  const frontNorm = clamp(1 - Math.abs(frontActual - FRONT_SP) / 5, 0, 1);
  const rearNorm = clamp(1 - Math.abs(rearActual - REAR_SP) / 5, 0, 1);
  // Uniformity: ideal delta = REAR_SP - FRONT_SP = 3°C
  const actualDelta = rearActual - frontActual;
  const idealDelta = REAR_SP - FRONT_SP;
  const uniformNorm = clamp(1 - Math.abs(actualDelta - idealDelta) / 4, 0, 1);

  return [
    {
      key: "front", label: "Fill", weight: 0.40,
      actual: +frontActual.toFixed(1), setpoint: FRONT_SP,
      deviation: +(frontActual - FRONT_SP).toFixed(1),
      normalized: frontNorm, weighted: +(0.40 * frontNorm).toFixed(3),
    },
    {
      key: "rear", label: "Contamination", weight: 0.40,
      actual: +rearActual.toFixed(1), setpoint: REAR_SP,
      deviation: +(rearActual - REAR_SP).toFixed(1),
      normalized: rearNorm, weighted: +(0.40 * rearNorm).toFixed(3),
    },
    {
      key: "uniformity", label: "Uniformity", weight: 0.20,
      actual: +Math.abs(actualDelta).toFixed(1), setpoint: +(idealDelta),
      deviation: +(actualDelta - idealDelta).toFixed(1),
      normalized: uniformNorm, weighted: +(0.20 * uniformNorm).toFixed(3),
    },
  ];
}

function initial(): TqiSnapshot {
  const frontSeries = seedJaw(FRONT_SP);
  const rearSeries = seedJaw(REAR_SP);
  const frontActual = frontSeries[frontSeries.length - 1].actual;
  const rearActual = rearSeries[rearSeries.length - 1].actual;
  const components = computeComponents(frontActual, rearActual);
  const tqi = +components.reduce((s, c) => s + c.weighted, 0).toFixed(2);

  return {
    tqi,
    grade: "green",
    components,
    front: { series: frontSeries, setpoint: FRONT_SP },
    rear: { series: rearSeries, setpoint: REAR_SP },
    gradient: {
      series: seedGradient(frontSeries, rearSeries),
      tolerance: GRAD_TOL,
      nominal: REAR_SP - FRONT_SP,
    },
    tqiTrend: seedTrend(tqi),
    status: null,
    defect_description: null,
  };
}

export function useLiveTqi(): TqiSnapshot {
  const [snap, setSnap] = useState<TqiSnapshot>(() => initial());
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      setSnap((prev) => {
        const now = Date.now();

        // Drift front jaw
        const lastFront = prev.front.series[prev.front.series.length - 1].actual;
        const newFront = clamp(lastFront + (Math.random() - 0.5) * 0.8, FRONT_SP - 5, FRONT_SP + 5);
        const frontSeries = [
          ...prev.front.series.slice(-59),
          { ts: now, actual: +newFront.toFixed(2), setpoint: FRONT_SP },
        ];

        // Drift rear jaw
        const lastRear = prev.rear.series[prev.rear.series.length - 1].actual;
        const newRear = clamp(lastRear + (Math.random() - 0.5) * 0.8, REAR_SP - 5, REAR_SP + 5);
        const rearSeries = [
          ...prev.rear.series.slice(-59),
          { ts: now, actual: +newRear.toFixed(2), setpoint: REAR_SP },
        ];

        const gradientSeries = [
          ...prev.gradient.series.slice(-59),
          { ts: now, delta: +Math.abs(newFront - newRear).toFixed(2) },
        ];

        const components = computeComponents(newFront, newRear);
        const tqi = +components.reduce((s, c) => s + c.weighted, 0).toFixed(2);
        const tqiTrend = [...prev.tqiTrend.slice(-89), { ts: now, value: tqi }];

        return {
          tqi,
          grade: prev.grade,
          components,
          front: { ...prev.front, series: frontSeries },
          rear: { ...prev.rear, series: rearSeries },
          gradient: { ...prev.gradient, series: gradientSeries },
          tqiTrend,
          status: null,
          defect_description: null,
        };
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return snap;
}

/** Jaw-temperature mock only — used by FrontJawChart/RearJawChart/CrossGradientChart
 *  while the backend has no jaw-temp TQI endpoint. */
export function useMockJawData(): JawSnapshot {
  const snap = useLiveTqi();
  return { front: snap.front, rear: snap.rear, gradient: snap.gradient };
}
