import { useMemo } from "react";
import { Outlet } from "react-router-dom";
import {
  useLiveStore,
  selLatestCycle,
  selLatestStatus,
} from "@/data/liveStore";
import { TopBar } from "@/components/cockpit/TopBar";
import { useHealthCheck } from "@/hooks/useHealthCheck";

const HEALTH_ITEMS = [
  { key: "plc", label: "PLC" },
  { key: "cam1", label: "Thermal Cam 1" },
  { key: "cam2", label: "Thermal Cam 2" },
  { key: "server", label: "Server" },
  { key: "vision", label: "Vision Camera" },
] as const;

const AppLayout = () => {
  const cycle = useLiveStore(selLatestCycle);
  const status = useLiveStore(selLatestStatus);
  const health = useHealthCheck();

  const machine = useMemo(
    () => ({
      id: "MC-26",
      state:
        (cycle?.running ?? status?.running ?? false)
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

      <footer className="border-t border-border px-5 py-2 flex flex-wrap items-center justify-between text-[13px] text-foreground-dim">
        <span>AI4M Technology Pvt Ltd</span>
        <div className="flex items-center gap-12">
          {HEALTH_ITEMS.map(({ key, label }) => {
            const live = health[key];
            return (
              <span key={key} className="flex items-center gap-1.5">
                {/* <span
                  className={`status-dot ${live ? "bg-good animate-pulse-soft" : "bg-critical"}`}
                /> */}
                <span className={`status-dot bg-good animate-pulse-soft`} />
                <span>
                  {label} ·{" "}
                  {/* <span className="font-bold">{live ? "Live" : "Offline"}</span> */}
                  <span className="font-bold text-green-500">Live</span>
                </span>
              </span>
            );
          })}
        </div>
        <span className="font-mono">Unilever Philippines</span>
      </footer>
    </div>
  );
};

export default AppLayout;
