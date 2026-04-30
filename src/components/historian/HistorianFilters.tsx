import { useState } from "react";
import { ChevronDown, RefreshCw, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HistorianState, Grade } from "@/lib/mock/historian";

interface Props { state: HistorianState }

const GRADES: ("All" | Grade)[] = ["All", "Green", "Amber", "Red"];

export function HistorianFilters({ state }: Props) {
  const { dateFrom, setDateFrom, dateTo, setDateTo, gradeFilter, setGradeFilter, setPage } = state;
  const [spinning, setSpinning] = useState(false);

  function handleRefresh() {
    setSpinning(true);
    setTimeout(() => setSpinning(false), 800);
    setPage(1);
  }

  function handleGrade(g: "All" | Grade) {
    setGradeFilter(g);
    setPage(1);
  }

  const inputCls = "bg-[hsl(var(--surface-2))] border border-border text-foreground font-mono text-[13px] rounded-[var(--radius)] px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary";

  return (
    <div className="panel p-4 flex flex-wrap items-center gap-3">
      {/* Date range */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-foreground-dim">From</span>
        <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className={inputCls} />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] uppercase tracking-[0.14em] text-foreground-dim">To</span>
        <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className={inputCls} />
      </div>

      {/* Grade filter */}
      <div className="relative">
        <select
          value={gradeFilter}
          onChange={(e) => handleGrade(e.target.value as "All" | Grade)}
          className={cn(inputCls, "appearance-none pr-8 cursor-pointer")}
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>{g === "All" ? "All Grades" : g}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-dim" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] border border-border text-[13px] text-foreground-muted hover:text-foreground transition-colors"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", spinning && "animate-spin")} />
          Refresh
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] border border-primary text-[13px] text-primary hover:bg-primary/10 transition-colors">
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
