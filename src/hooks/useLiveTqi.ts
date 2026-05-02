/**
 * Real-time TQI hook — reads from Zustand store fed by WebSocket.
 *
 * Subscribes to mc26/live/cycle and mc26/live/tqi/detail for the lifetime
 * of the calling component.  Returns a TqiSnapshot whose shape is identical
 * to the mock so all existing child components work without modification.
 *
 * The jaw-temperature fields (front, rear, gradient) are still sourced from
 * the mock because the backend has no jaw-temp endpoint for TQI yet.
 */

import { useMemo } from "react";
import { useWsTopics } from "@/hooks/useWsTopics";
import {
  useLiveStore,
  selLatestCycle,
  selLatestTqi,
  selCycleHistory,
  selTqiHistory,
} from "@/data/liveStore";
import { useMockJawData } from "@/lib/mock/tqi";
import type { TqiSnapshot, ThermalComponent } from "@/lib/mock/tqi";
import type { WsTopic } from "@/data/types";

const TQI_TOPICS: readonly WsTopic[] = [
  "mc26/live/cycle",
  "mc26/live/tqi/detail",
];

const GREEN_THRESHOLD = 0.75;
const AMBER_THRESHOLD = 0.6;

function gradeOf(v: number | null): "green" | "amber" | "red" | "pending" {
  if (v == null) return "pending";
  if (v >= GREEN_THRESHOLD) return "green";
  if (v >= AMBER_THRESHOLD) return "amber";
  return "red";
}

export function useLiveTqi(): TqiSnapshot {
  useWsTopics(TQI_TOPICS);

  const cycle = useLiveStore(selLatestCycle);
  const tqiDetail = useLiveStore(selLatestTqi);
  const cycleHistory = useLiveStore(selCycleHistory);
  const tqiHistory = useLiveStore(selTqiHistory);

  // Jaw-temp charts have no backend source yet — keep mock data.
  const jaw = useMockJawData();

  return useMemo<TqiSnapshot>(() => {
    // TQI score fallback: cycle.tqi → walk cycleHistory → tqiDetail.tqi
    let tqi: number | null = cycle?.tqi ?? null;
    if (tqi == null) {
      for (let i = cycleHistory.length - 1; i >= 0; i--) {
        const v = cycleHistory[i]?.tqi;
        if (v != null) { tqi = v; break; }
      }
    }
    if (tqi == null && tqiDetail?.tqi != null) tqi = tqiDetail.tqi;

    const fill = tqiDetail?.fill_score ?? null;
    const contamination = tqiDetail?.contamination_score ?? null;
    const uniformity = tqiDetail?.uniformity_score ?? null;

    // Worst-component grade rule
    const componentGrades = [gradeOf(fill), gradeOf(contamination), gradeOf(uniformity)];
    const compositeGrade = gradeOf(tqi);

    const components: ThermalComponent[] = [
      {
        key: "front",
        label: "Fill",
        weight: 0.4,
        actual: fill != null ? +(fill * 100).toFixed(1) : 0,
        setpoint: 100,
        deviation: fill != null ? +((fill - 1) * 100).toFixed(1) : 0,
        normalized: fill ?? 0,
        weighted: +((fill ?? 0) * 0.4).toFixed(3),
      },
      {
        key: "rear",
        label: "Contamination",
        weight: 0.4,
        actual: contamination != null ? +(contamination * 100).toFixed(1) : 0,
        setpoint: 100,
        deviation: contamination != null ? +((contamination - 1) * 100).toFixed(1) : 0,
        normalized: contamination ?? 0,
        weighted: +((contamination ?? 0) * 0.4).toFixed(3),
      },
      {
        key: "uniformity",
        label: "Uniformity",
        weight: 0.2,
        actual: uniformity != null ? +(uniformity * 100).toFixed(1) : 0,
        setpoint: 100,
        deviation: uniformity != null ? +((uniformity - 1) * 100).toFixed(1) : 0,
        normalized: uniformity ?? 0,
        weighted: +((uniformity ?? 0) * 0.2).toFixed(3),
      },
    ];

    const tqiTrend = tqiHistory.map((r) => ({ ts: r.ts_ms, value: r.tqi }));

    return {
      tqi: tqi ?? 0,
      grade: componentGrades.includes("red")
        ? "red"
        : componentGrades.includes("amber")
          ? "amber"
          : compositeGrade === "pending" || compositeGrade === "green"
            ? (compositeGrade === "pending" ? "green" : compositeGrade)
            : compositeGrade,
      components,
      tqiTrend,
      status: tqiDetail?.status ?? null,
      defect_description: tqiDetail?.defect_description ?? null,
      // Jaw-temp — mock until backend provides this data
      front: jaw.front,
      rear: jaw.rear,
      gradient: jaw.gradient,
    };
  }, [cycle, tqiDetail, cycleHistory, tqiHistory, jaw]);
}
