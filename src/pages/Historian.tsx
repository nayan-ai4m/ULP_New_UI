import { useState } from "react";
import { cn } from "@/lib/utils";
import { useHistorianState } from "@/lib/mock/historian";
import { HistorianFilters } from "@/components/historian/HistorianFilters";
import { SummaryStrip } from "@/components/historian/SummaryStrip";
import { HistoryTable } from "@/components/historian/HistoryTable";

type Tab = "sqi" | "pqi" | "tqi";

const TABS: { id: Tab; label: string }[] = [
  { id: "sqi", label: "SQI History" },
  { id: "pqi", label: "PQI History" },
  { id: "tqi", label: "TQI History" },
];

const Historian = () => {
  const hist = useHistorianState();
  const [tab, setTab] = useState<Tab>("sqi");

  function switchTab(t: Tab) {
    setTab(t);
    hist.setPage(1);
  }

  const counts =
    tab === "sqi"
      ? hist.sqiCounts
      : tab === "pqi"
        ? hist.pqiCounts
        : hist.tqiCounts;

  return (
    <>

      {/* Sub-tab bar */}
      <div className="border-b border-border bg-[hsl(var(--surface-1))]/60 px-5 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm transition-colors whitespace-nowrap",
                active
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground",
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
        <HistorianFilters state={hist} />
        <SummaryStrip counts={counts} />
        <HistoryTable tab={tab} state={hist} />
      </main>

    </>
  );
};

export default Historian;
