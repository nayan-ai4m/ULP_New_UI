import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import {
  useLiveStore,
  selWsConnected,
  selLatestCycle,
  selLatestStatus,
} from "@/data/liveStore";
import { TopBar } from "@/components/cockpit/TopBar";

const AppLayout = () => {
  const cycle = useLiveStore(selLatestCycle);
  const status = useLiveStore(selLatestStatus);
  const wsConnected = useLiveStore(selWsConnected);

  const machine = useMemo(
    () => ({
      id: "MC-26",
      state: (cycle?.running ?? status?.running ?? false)
        ? ("Running" as const)
        : ("Stopped" as const),
      cycle: cycle?.cycle_id ?? 0,
      sku: cycle?.sku ?? status?.sku ?? "—",
      qbomRev: "—",
      laminate: "—",
      shift: "—",
      operator: "—",
    }),
    [cycle, status],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar machine={machine} />

      <Outlet />

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

export default AppLayout;
