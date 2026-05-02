import { useMemo } from "react";
import { PqiHero } from "@/components/pqi/PqiHero";
import { WeightedContribution } from "@/components/pqi/WeightedContribution";
import { HeatChart } from "@/components/pqi/HeatChart";
import { PressureChart } from "@/components/pqi/PressureChart";
import { DwellTrendChart } from "@/components/pqi/DwellTrendChart";
import { TailingIndexChart } from "@/components/pqi/TailingIndexChart";
import { PqiTrendMini } from "@/components/pqi/PqiTrendMini";
import { RawTailingIndex } from "@/components/pqi/RawTailingIndex";
import { useWsTopics } from "@/hooks/useWsTopics";
import {
  useLiveStore,
  selLatestCycle,
  selLatestPqiDetail,
  selLatestProfile,
  selLatestSit,
  selPqiHistory,
} from "@/data/liveStore";
import type { WsTopic } from "@/data/types";
import type {
  WeightedComponent,
  TrendPoint,
  HeatPoint,
  PressurePoint,
  DwellPoint,
} from "@/lib/mock/pqi";

/* ── Topics the PQI page needs ── */

const PQI_WS_TOPICS: readonly WsTopic[] = [
  "mc26/live/cycle",
  "mc26/live/pqi/detail",
  "mc26/live/profile",
  "mc26/live/sit",
];

/* ── PQI component weights (match backend seal_a/b/c) ── */
const W_SIT = 0.35;
const W_TRQ = 0.4;
const W_TIME = 0.25;

const Pqi = () => {
  useWsTopics(PQI_WS_TOPICS);

  const cycle = useLiveStore(selLatestCycle);
  const pqiDetail = useLiveStore(selLatestPqiDetail);
  const profile = useLiveStore(selLatestProfile);
  const sit = useLiveStore(selLatestSit);
  const pqiHistory = useLiveStore(selPqiHistory);

  // Compute PQI score from the detail payload
  const pqiScore = useMemo(() => {
    if (!pqiDetail) return cycle?.pqi ?? 0;
    return (
      W_SIT * pqiDetail.r_sit +
      W_TRQ * pqiDetail.r_trq +
      W_TIME * pqiDetail.r_time
    );
  }, [pqiDetail, cycle?.pqi]);

  // Build weighted contribution items
  const weighted: WeightedComponent[] = useMemo(() => {
    if (!pqiDetail) {
      return [
        {
          key: "heat",
          label: "Heat",
          weight: W_SIT,
          raw: 0,
          rawUnit: "°C",
          rawLabel: "T_inner",
          normalized: 0,
          weighted: 0,
        },
        {
          key: "pressure",
          label: "Pressure",
          weight: W_TRQ,
          raw: 0,
          rawUnit: "kg",
          rawLabel: "Avg Torque",
          normalized: 0,
          weighted: 0,
        },
        {
          key: "dwell",
          label: "Dwell",
          weight: W_TIME,
          raw: 0,
          rawUnit: "ms",
          rawLabel: "Dwell",
          normalized: 0,
          weighted: 0,
        },
      ];
    }
    return [
      {
        key: "heat",
        label: "Heat",
        weight: W_SIT,
        raw: pqiDetail.t_inner_c,
        rawUnit: "°C",
        rawLabel: "T_inner",
        normalized: pqiDetail.r_sit,
        weighted: W_SIT * pqiDetail.r_sit,
      },
      {
        key: "pressure",
        label: "Pressure",
        weight: W_TRQ,
        raw: pqiDetail.avg_torque,
        rawUnit: "Nm",
        rawLabel: "Avg Torque",
        normalized: pqiDetail.r_trq,
        weighted: W_TRQ * pqiDetail.r_trq,
      },
      {
        key: "dwell",
        label: "Dwell",
        weight: W_TIME,
        raw: pqiDetail.dwell_ms,
        rawUnit: "ms",
        rawLabel: "Dwell",
        normalized: pqiDetail.r_time,
        weighted: W_TIME * pqiDetail.r_time,
      },
    ];
  }, [pqiDetail]);

  // Build PQI trend series from history
  const pqiTrend: TrendPoint[] = useMemo(
    () =>
      pqiHistory.map((r) => ({
        ts: r.ts_ms,
        value: W_SIT * r.r_sit + W_TRQ * r.r_trq + W_TIME * r.r_time,
      })),
    [pqiHistory],
  );

  // Build tailing trend series from history (clamped to 0–1)
  const tailingTrend: TrendPoint[] = useMemo(
    () =>
      pqiHistory.map((r) => ({
        ts: r.ts_ms,
        value: Math.min(Math.max(r.tailing_index, 0), 1),
      })),
    [pqiHistory],
  );

  // Raw tailing index (clamped to 0–1)
  const rawTailing = Math.min(Math.max(pqiDetail?.tailing_index ?? 0, 0), 1);

  // Heat chart data from SIT payload
  const heatData = useMemo(() => {
    if (!sit) {
      return {
        series: [] as HeatPoint[],
        sitThreshold: 108,
        tJawCurrent: pqiDetail?.jaw_temp_c ?? 147,
      };
    }
    const series: HeatPoint[] = sit.time_ms.map((ms, i) => ({
      t: ms / 1000,
      tInner: sit.t_inner_c[i],
      tJaw: pqiDetail?.jaw_temp_c ?? 147,
    }));
    return {
      series,
      sitThreshold: 108,
      tJawCurrent: pqiDetail?.jaw_temp_c ?? 147,
    };
  }, [sit, pqiDetail?.jaw_temp_c]);

  // Pressure chart data from profile payload
  const pressureData = useMemo(() => {
    if (!profile) {
      return {
        series: [] as PressurePoint[],
        sealStartDeg: 55,
        sealEndDeg: 140,
        pressureAvg: pqiDetail?.avg_torque ?? 0,
      };
    }
    const series: PressurePoint[] = profile.degrees.map((deg, i) => ({
      camDeg: deg,
      position: profile.position[i],
      pressure: profile.torque[i],
    }));
    return {
      series,
      sealStartDeg: 55,
      sealEndDeg: 140,
      pressureAvg: pqiDetail?.avg_torque ?? 0,
      torqueTarget: 500,
    };
  }, [profile, pqiDetail?.avg_torque]);

  // Dwell trend from PQI history
  const dwellSeries: DwellPoint[] = useMemo(
    () => pqiHistory.map((r) => ({ ts: r.ts_ms, dwellMs: r.dwell_ms })),
    [pqiHistory],
  );

  return (
    <main className="flex-1 grid gap-4 p-4 lg:p-5 grid-cols-12">
      {/* Left rail */}
      <aside className="col-span-12 xl:col-span-3 flex flex-col gap-4">
        <PqiHero score={pqiScore} />
        <WeightedContribution items={weighted} pqi={pqiScore} />
        <PqiTrendMini series={pqiTrend} />
        <RawTailingIndex value={rawTailing} />
      </aside>

      {/* Main grid */}
      <section className="col-span-12 xl:col-span-9 flex flex-col gap-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[40vh]">
          <HeatChart
            series={heatData.series}
            sitThreshold={heatData.sitThreshold}
            tJawCurrent={heatData.tJawCurrent}
          />
          <PressureChart
            series={pressureData.series}
            sealStartDeg={pressureData.sealStartDeg}
            sealEndDeg={pressureData.sealEndDeg}
            pressureAvg={pressureData.pressureAvg}
            torqueTarget={pressureData.torqueTarget}
          />
          <DwellTrendChart series={dwellSeries} targetMs={220} />
        </div>
        <TailingIndexChart series={tailingTrend} />
      </section>
    </main>
  );
};

export default Pqi;
