import { useState, useMemo } from "react";

export type Grade = "Green" | "Amber" | "Red";

export interface SqiRecord {
  id: string;
  cycle: number;
  ts: string;
  score: number;
  grade: Grade;
  failureMode: string | null;
}

export interface PqiRecord {
  id: string;
  cycle: number;
  ts: string;
  score: number;
  grade: Grade;
  deocGrade: Grade;
}

export interface TqiRecord {
  id: string;
  cycle: number;
  ts: string;
  score: number;
  grade: Grade;
  frontDelta: number;
  rearDelta: number;
}

export interface HistorianState {
  dateFrom: string; setDateFrom: (d: string) => void;
  dateTo: string; setDateTo: (d: string) => void;
  gradeFilter: "All" | Grade; setGradeFilter: (g: "All" | Grade) => void;
  page: number; setPage: (p: number) => void;
  sqiPage: SqiRecord[]; sqiTotal: number;
  pqiPage: PqiRecord[]; pqiTotal: number;
  tqiPage: TqiRecord[]; tqiTotal: number;
  sqiCounts: GradeCounts;
  pqiCounts: GradeCounts;
  tqiCounts: GradeCounts;
}

export interface GradeCounts { total: number; green: number; amber: number; red: number }

export const PAGE_SIZE = 10;

const FAILURE_MODES = ["LOW_DWELL", "TEMP_DRIFT", "PRESSURE_LOW", "GRADIENT_OOL", null, null, null, null];

function scoreToGrade(s: number): Grade {
  if (s >= 0.75) return "Green";
  if (s >= 0.60) return "Amber";
  return "Red";
}

function rng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function seedSqi(n: number): SqiRecord[] {
  const rand = rng(42);
  const now = new Date("2026-04-29T08:00:00");
  return Array.from({ length: n }, (_, i) => {
    const r = rand();
    const score = r < 0.10 ? rand() * 0.60 : r < 0.35 ? 0.60 + rand() * 0.15 : 0.75 + rand() * 0.25;
    const grade = scoreToGrade(score);
    const ts = new Date(now.getTime() - i * 90000);
    return {
      id: `sqi-${i}`,
      cycle: 80030 + n - i,
      ts: ts.toISOString(),
      score: +score.toFixed(3),
      grade,
      failureMode: grade !== "Green" ? FAILURE_MODES[Math.floor(rand() * 4)] : null,
    };
  });
}

function seedPqi(n: number): PqiRecord[] {
  const rand = rng(77);
  const now = new Date("2026-04-29T08:00:00");
  return Array.from({ length: n }, (_, i) => {
    const r = rand();
    const score = r < 0.10 ? rand() * 0.60 : r < 0.35 ? 0.60 + rand() * 0.15 : 0.75 + rand() * 0.25;
    const grade = scoreToGrade(score);
    const dr = rand();
    const deocScore = dr < 0.08 ? rand() * 0.60 : dr < 0.30 ? 0.60 + rand() * 0.15 : 0.75 + rand() * 0.25;
    const ts = new Date(now.getTime() - i * 90000);
    return {
      id: `pqi-${i}`,
      cycle: 80030 + n - i,
      ts: ts.toISOString(),
      score: +score.toFixed(3),
      grade,
      deocGrade: scoreToGrade(deocScore),
    };
  });
}

function seedTqi(n: number): TqiRecord[] {
  const rand = rng(13);
  const now = new Date("2026-04-29T08:00:00");
  return Array.from({ length: n }, (_, i) => {
    const r = rand();
    const score = r < 0.10 ? rand() * 0.60 : r < 0.35 ? 0.60 + rand() * 0.15 : 0.75 + rand() * 0.25;
    const grade = scoreToGrade(score);
    const ts = new Date(now.getTime() - i * 90000);
    return {
      id: `tqi-${i}`,
      cycle: 80030 + n - i,
      ts: ts.toISOString(),
      score: +score.toFixed(3),
      grade,
      frontDelta: +(rand() * 6 - 3).toFixed(1),
      rearDelta: +(rand() * 6 - 3).toFixed(1),
    };
  });
}

const ALL_SQI = seedSqi(100);
const ALL_PQI = seedPqi(100);
const ALL_TQI = seedTqi(100);

function counts(records: { grade: Grade }[]): GradeCounts {
  return {
    total: records.length,
    green: records.filter((r) => r.grade === "Green").length,
    amber: records.filter((r) => r.grade === "Amber").length,
    red: records.filter((r) => r.grade === "Red").length,
  };
}

function today() { return new Date().toISOString().slice(0, 10); }
function thirtyDaysAgo() {
  const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10);
}

export function useHistorianState(): HistorianState {
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo());
  const [dateTo, setDateTo] = useState(today());
  const [gradeFilter, setGradeFilter] = useState<"All" | Grade>("All");
  const [page, setPage] = useState(1);

  const sqiFiltered = useMemo(() =>
    ALL_SQI.filter((r) => {
      const d = r.ts.slice(0, 10);
      return d >= dateFrom && d <= dateTo && (gradeFilter === "All" || r.grade === gradeFilter);
    }), [dateFrom, dateTo, gradeFilter]);

  const pqiFiltered = useMemo(() =>
    ALL_PQI.filter((r) => {
      const d = r.ts.slice(0, 10);
      return d >= dateFrom && d <= dateTo && (gradeFilter === "All" || r.grade === gradeFilter);
    }), [dateFrom, dateTo, gradeFilter]);

  const tqiFiltered = useMemo(() =>
    ALL_TQI.filter((r) => {
      const d = r.ts.slice(0, 10);
      return d >= dateFrom && d <= dateTo && (gradeFilter === "All" || r.grade === gradeFilter);
    }), [dateFrom, dateTo, gradeFilter]);

  const start = (page - 1) * PAGE_SIZE;

  return {
    dateFrom, setDateFrom,
    dateTo, setDateTo,
    gradeFilter, setGradeFilter,
    page, setPage,
    sqiPage: sqiFiltered.slice(start, start + PAGE_SIZE),
    sqiTotal: sqiFiltered.length,
    pqiPage: pqiFiltered.slice(start, start + PAGE_SIZE),
    pqiTotal: pqiFiltered.length,
    tqiPage: tqiFiltered.slice(start, start + PAGE_SIZE),
    tqiTotal: tqiFiltered.length,
    sqiCounts: counts(sqiFiltered),
    pqiCounts: counts(pqiFiltered),
    tqiCounts: counts(tqiFiltered),
  };
}
