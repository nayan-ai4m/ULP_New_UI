import { useMemo } from "react";
import { useWsTopics } from "@/hooks/useWsTopics";
import {
  useLiveStore,
  selLatestCycle,
  selCycleHistory,
  selAlarms,
  selLatestStatus,
  selWsConnected,
} from "@/data/liveStore";
import type { WsTopic, AlarmRecord } from "@/data/types";
import { TopBar } from "@/components/cockpit/TopBar";
import { IndexCard } from "@/components/cockpit/IndexCard";
import { CameraTile } from "@/components/cockpit/CameraTile";
import { AlertRail } from "@/components/cockpit/AlertRail";
import type { TrendPoint } from "@/lib/mock/dashboard";

const DASHBOARD_TOPICS: readonly WsTopic[] = [
  "mc26/live/cycle",
  "mc26/live/status",
  "mc26/alarm",
];

const TREND_WINDOW = 30;

const Index = () => {
  useWsTopics(DASHBOARD_TOPICS);

  const latest = useLiveStore(selLatestCycle);
  const history = useLiveStore(selCycleHistory);
  const status = useLiveStore(selLatestStatus);
  const alarms = useLiveStore(selAlarms);
  const wsConnected = useLiveStore(selWsConnected);

  // Derive trend arrays for IndexCards
  const sqiTrend: TrendPoint[] = useMemo(
    () => history.slice(-TREND_WINDOW).map((r) => ({ ts: r.ts_ms, value: r.sqi })),
    [history],
  );
  const pqiTrend: TrendPoint[] = useMemo(
    () => history.slice(-TREND_WINDOW).map((r) => ({ ts: r.ts_ms, value: r.pqi })),
    [history],
  );
  const tqiTrend: TrendPoint[] = useMemo(
    () =>
      history
        .slice(-TREND_WINDOW)
        .map((r) => ({ ts: r.ts_ms, value: r.tqi == null ? NaN : r.tqi })),
    [history],
  );
  // VQI not implemented — pass empty trend
  const vqiTrend: TrendPoint[] = useMemo(
    () => history.slice(-TREND_WINDOW).map((r) => ({ ts: r.ts_ms, value: 0 })),
    [history],
  );

  // Derive machine context for TopBar
  const machine = useMemo(
    () => ({
      id: "MC-26",
      state: (status?.running ? "Running" : latest?.running ? "Running" : "Stopped") as
        | "Running"
        | "Idle"
        | "Stopped"
        | "Fault",
      cycle: latest?.cycle_id ?? 0,
      sku: status?.sku ?? latest?.sku ?? "—",
      qbomRev: "—",
      laminate: "—",
      shift: "—",
      operator: "—",
    }),
    [latest, status],
  );

  // Map alarms for AlertRail
  const alertEvents = useMemo(
    () =>
      alarms.map((a: AlarmRecord) => ({
        id: a.id,
        ts: a.ts_ms,
        index: "sqi" as const,
        grade: a.severity === "critical" ? ("critical" as const) : ("warn" as const),
        reason: a.message,
        action: a.acknowledged ? "Acknowledged" : "Investigating…",
      })),
    [alarms],
  );

  return (
    <div className="max-h-screen flex flex-col overflow-auto">
      <TopBar machine={machine} />

      <main className="flex-1 grid gap-4 p-4 lg:p-5 grid-cols-12">
        {/* Left + center column: KPIs */}
        <section className="col-span-12 xl:col-span-9 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4">
            <IndexCard
              title="SQI · Seal Quality Index"
              score={latest?.sqi}
              trend={sqiTrend}
            />
            <IndexCard
              title="PQI · Physics Quality Index"
              score={latest?.pqi}
              trend={pqiTrend}
            />
            <IndexCard
              title="TQI · Thermal Quality Index"
              score={latest?.tqi ?? undefined}
              trend={tqiTrend}
            />
            <IndexCard
              title="VQI · Visual Quality Index"
              score={latest?.vqi ?? undefined}
              trend={vqiTrend}
              comingSoon
            />
          </div>
        </section>

        {/* Right column: cameras + alerts */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
            <CameraTile name="Thermal Cam 1" streamUrl="/api/tqi/stream/1" />
            <CameraTile name="Thermal Cam 2" streamUrl="/api/tqi/stream/2" />
          </div>
          <div className="flex-1 min-h-[420px] xl:min-h-0">
            <AlertRail alerts={alertEvents} />
          </div>
        </aside>
      </main>

      <footer className="border-t border-border px-5 py-2 flex flex-wrap items-center justify-between text-[11px] text-foreground-dim">
        <span>AI4M Technology Pvt Ltd</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className={`status-dot ${wsConnected ? "bg-good animate-pulse-soft" : "bg-critical"}`}
            />
            <span className="font-mono">
              {wsConnected ? "LIVE" : "OFFLINE"}
            </span>
          </span>
          <span className="font-mono">Unilever Philippines</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
