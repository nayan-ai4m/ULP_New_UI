import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLiveDashboard } from "@/lib/mock/dashboard";
import { useSettingsState } from "@/lib/mock/settings";
import { TopBar } from "@/components/cockpit/TopBar";
import { MachineRuntime } from "@/components/settings/MachineRuntime";
import { AlertPreferences } from "@/components/settings/AlertPreferences";
import { SystemHealth } from "@/components/settings/SystemHealth";

type Tab = "runtime" | "alerts" | "system";

const TABS: { id: Tab; label: string }[] = [
  { id: "runtime", label: "Machine Runtime" },
  { id: "alerts",  label: "Alert & Notifications" },
  { id: "system",  label: "System & Connectivity" },
];

const Settings = () => {
  const dash = useLiveDashboard();
  const settings = useSettingsState();
  const [tab, setTab] = useState<Tab>("runtime");
  const [applied, setApplied] = useState(false);

  function handleApply() {
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar machine={dash.machine} />

      {/* Sub-tab bar */}
      <div className="border-b border-border bg-[hsl(var(--surface-1))]/60 px-5 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm transition-colors whitespace-nowrap",
                active ? "text-foreground" : "text-foreground-muted hover:text-foreground",
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col gap-4 p-5 overflow-y-auto">
        {tab === "runtime" && <MachineRuntime state={settings} />}
        {tab === "alerts"  && <AlertPreferences state={settings} />}
        {tab === "system"  && <SystemHealth state={settings} />}
      </main>

      <footer className="border-t border-border px-5 py-3 flex items-center justify-between">
        <span className="text-[11px] text-foreground-dim">
          Dark Cascade Framework · AI4M-FRS-2604-001 · Edge AI Gateway
        </span>
        {tab === "runtime" && (
          <div className="flex items-center gap-3">
            {applied && (
              <span className="text-[12px] text-good">Setpoints queued for next PLC cycle</span>
            )}
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-4 py-1.5 rounded-[var(--radius)] bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity"
            >
              Apply Changes
            </button>
          </div>
        )}
      </footer>
    </div>
  );
};

export default Settings;
