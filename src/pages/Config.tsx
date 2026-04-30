import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLiveDashboard } from "@/lib/mock/dashboard";
import { useConfigState } from "@/lib/mock/config";
import { TopBar } from "@/components/cockpit/TopBar";
import { LaminateSettings } from "@/components/config/LaminateSettings";
import { BulkSettings } from "@/components/config/BulkSettings";
import { MachineIdentity } from "@/components/config/MachineIdentity";

type Tab = "laminate" | "bulk" | "machine";

const TABS: { id: Tab; label: string }[] = [
  { id: "laminate", label: "Laminate Settings" },
  { id: "bulk",     label: "Bulk Settings" },
  { id: "machine",  label: "Machine Identity" },
];

const Config = () => {
  const dash = useLiveDashboard();
  const config = useConfigState();
  const [tab, setTab] = useState<Tab>("laminate");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

      {/* Tab content */}
      <main className="flex-1 p-5 overflow-y-auto">
        {tab === "laminate" && <LaminateSettings state={config} />}
        {tab === "bulk"     && <BulkSettings     state={config} />}
        {tab === "machine"  && <MachineIdentity  state={config} />}
      </main>

      {/* Footer with Save */}
      <footer className="border-t border-border px-5 py-3 flex items-center justify-between">
        <span className="text-[11px] text-foreground-dim">
          Dark Cascade Framework · AI4M-FRS-2604-001 · Edge AI Gateway
        </span>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-[12px] text-good animate-flash">
              Configuration saved
            </span>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-[var(--radius)] bg-primary text-primary-foreground
                       text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Config;
