import { useEffect, useRef, useState } from "react";

export interface HeatPoint { t: number; tInner: number; tJaw: number }
export interface PressurePoint { camDeg: number; position: number; pressure: number }
export interface DwellPoint { ts: number; dwellMs: number }
export interface TrendPoint { ts: number; value: number }

export interface WeightedComponent {
  key: "heat" | "pressure" | "dwell";
  label: string;
  weight: number;        // e.g. 0.45
  raw: number;           // raw measurement
  rawUnit: string;       // °C, kg, ms
  rawLabel: string;      // "T_inner", "Pressure", "Dwell"
  normalized: number;    // 0..1 — how close raw is to ideal
  weighted: number;      // weight * normalized
}

export interface PqiSnapshot {
  pqi: number;
  weighted: WeightedComponent[];
  heat: { series: HeatPoint[]; sitThreshold: number; tJawCurrent: number };
  pressure: { series: PressurePoint[]; sealStartDeg: number; sealEndDeg: number; pressureAvg: number };
  dwell: { series: DwellPoint[]; targetMs: number };
  pqiTrend: TrendPoint[];
  tailing: TrendPoint[];
  rawTailing: number;
}

const SIT = 108;
const T_JAW = 147.8;
const DWELL_TARGET = 220;
const SEAL_START = 55;
const SEAL_END = 140;

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function rand(lo: number, hi: number) { return lo + Math.random() * (hi - lo); }

function seedHeat(): HeatPoint[] {
  // T_inner asymptotic toward T_jaw across 0..0.15s
  const out: HeatPoint[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * 0.15;
    const tInner = 30 + (T_JAW - 30) * (1 - Math.exp(-t / 0.04));
    out.push({ t, tInner: +tInner.toFixed(2), tJaw: T_JAW });
  }
  return out;
}

function seedPressure(): PressurePoint[] {
  const out: PressurePoint[] = [];
  for (let deg = 0; deg <= 360; deg += 2) {
    const position = 50 + 50 * Math.sin((deg * Math.PI) / 180);
    let pressure = 0;
    if (deg >= SEAL_START && deg <= SEAL_END) {
      // Plateau ~ 540 with mild noise + ramp at edges
      const edge = Math.min(deg - SEAL_START, SEAL_END - deg);
      const ramp = clamp(edge / 8, 0, 1);
      pressure = ramp * (530 + Math.random() * 25);
    }
    out.push({ camDeg: deg, position: +position.toFixed(1), pressure: +pressure.toFixed(1) });
  }
  return out;
}

function seedDwell(): DwellPoint[] {
  const out: DwellPoint[] = [];
  const now = Date.now();
  let v = DWELL_TARGET;
  for (let i = 60; i >= 0; i--) {
    v = clamp(DWELL_TARGET + (Math.random() - 0.5) * 30, 175, 230);
    out.push({ ts: now - i * 1000, dwellMs: Math.round(v) });
  }
  return out;
}

function seedTrend(base: number, n = 90): TrendPoint[] {
  const out: TrendPoint[] = [];
  const now = Date.now();
  let v = base;
  for (let i = n - 1; i >= 0; i--) {
    v = clamp(v + (Math.random() - 0.5) * 0.06, 0.4, 0.98);
    out.push({ ts: now - i * 1000, value: +v.toFixed(3) });
  }
  return out;
}

function computeWeighted(heatRaw: number, pressureAvg: number, dwellRaw: number): WeightedComponent[] {
  // Normalize: 1.0 = ideal, 0 = far off.
  const heatNorm = clamp(1 - Math.abs(heatRaw - 110) / 40, 0, 1);     // ideal 110°C
  const pressNorm = clamp(1 - Math.abs(pressureAvg - 540) / 200, 0, 1); // ideal 540
  const dwellNorm = clamp(1 - Math.abs(dwellRaw - DWELL_TARGET) / 60, 0, 1); // ideal 220

  return [
    { key: "heat",     label: "Heat",     weight: 0.45, raw: +heatRaw.toFixed(1),     rawUnit: "°C", rawLabel: "T_inner",  normalized: heatNorm,  weighted: +(0.45 * heatNorm).toFixed(3) },
    { key: "pressure", label: "Pressure", weight: 0.35, raw: +pressureAvg.toFixed(1), rawUnit: "kg", rawLabel: "Avg Press", normalized: pressNorm, weighted: +(0.35 * pressNorm).toFixed(3) },
    { key: "dwell",    label: "Dwell",    weight: 0.20, raw: Math.round(dwellRaw),    rawUnit: "ms", rawLabel: "Dwell",    normalized: dwellNorm, weighted: +(0.20 * dwellNorm).toFixed(3) },
  ];
}

function initial(): PqiSnapshot {
  const heatSeries = seedHeat();
  const pressureSeries = seedPressure();
  const dwellSeries = seedDwell();
  const heatRaw = 111.2;
  const pressureAvg = 532.4;
  const dwellRaw = dwellSeries[dwellSeries.length - 1].dwellMs;
  const weighted = computeWeighted(heatRaw, pressureAvg, dwellRaw);
  const pqi = +weighted.reduce((s, w) => s + w.weighted, 0).toFixed(2);

  return {
    pqi,
    weighted,
    heat: { series: heatSeries, sitThreshold: SIT, tJawCurrent: T_JAW },
    pressure: { series: pressureSeries, sealStartDeg: SEAL_START, sealEndDeg: SEAL_END, pressureAvg },
    dwell: { series: dwellSeries, targetMs: DWELL_TARGET },
    pqiTrend: seedTrend(pqi),
    tailing: seedTrend(0.55, 60),
    rawTailing: 0.792,
  };
}

export function useLivePqi(): PqiSnapshot {
  const [snap, setSnap] = useState<PqiSnapshot>(() => initial());
  const tick = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 1;
      setSnap((prev) => {
        const now = Date.now();
        // Drift dwell
        const lastDwell = prev.dwell.series[prev.dwell.series.length - 1].dwellMs;
        const newDwell = clamp(lastDwell + (Math.random() - 0.5) * 12, 175, 230);
        const dwellSeries = [...prev.dwell.series.slice(-60), { ts: now, dwellMs: Math.round(newDwell) }];

        // Drift pressure avg slightly
        const pressureAvg = clamp(prev.pressure.pressureAvg + (Math.random() - 0.5) * 6, 480, 580);

        // Drift heat raw
        const heatRaw = clamp(prev.weighted[0].raw + (Math.random() - 0.5) * 1.2, 95, 130);

        const weighted = computeWeighted(heatRaw, pressureAvg, newDwell);
        const pqi = +weighted.reduce((s, w) => s + w.weighted, 0).toFixed(2);

        const pqiTrend = [...prev.pqiTrend.slice(-89), { ts: now, value: pqi }];

        // Tailing index drifts independently in 0.4..0.85, occasional dip
        const lastT = prev.tailing[prev.tailing.length - 1].value;
        const dip = Math.random() < 0.05 ? -0.2 : 0;
        const newT = clamp(lastT + (Math.random() - 0.5) * 0.08 + dip, 0.35, 0.92);
        const tailing = [...prev.tailing.slice(-59), { ts: now, value: +newT.toFixed(3) }];
        const rawTailing = +newT.toFixed(3);

        return {
          ...prev,
          pqi,
          weighted,
          pressure: { ...prev.pressure, pressureAvg },
          dwell: { ...prev.dwell, series: dwellSeries },
          pqiTrend,
          tailing,
          rawTailing,
        };
      });
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return snap;
}
