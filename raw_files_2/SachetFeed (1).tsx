import type { DashboardSnapshot } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

export function SachetFeed({ sachets }: { sachets: DashboardSnapshot["sachets"] }) {
  const counts = sachets.reduce(
    (acc, s) => ({ ...acc, [s.grade]: (acc[s.grade] ?? 0) + 1 }),
    {} as Record<string, number>,
  );

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-foreground-dim">Recent sachets</div>
          <div className="text-sm text-foreground-muted">Last {sachets.length} cycles · DEOC grading</div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <Tally label="Good" count={counts.good ?? 0} color="good" />
          <Tally label="Watch" count={counts.warn ?? 0} color="warn" />
          <Tally label="Reject" count={counts.critical ?? 0} color="critical" />
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
        {sachets.map((s) => (
          <div
            key={s.id}
            title={`${s.id} — ${s.grade}${s.defects ? " · " + s.defects.join(",") : ""}`}
            className={cn(
              "flex-shrink-0 w-12 h-14 rounded-md border flex flex-col items-center justify-end p-1 cursor-pointer transition hover:scale-105",
              s.grade === "good" && "bg-good-soft border-good",
              s.grade === "warn" && "bg-warn-soft border-warn",
              s.grade === "critical" && "bg-critical-soft border-critical",
            )}
          >
            <div className="flex-1 w-full grid place-items-center">
              <span
                className={cn(
                  "status-dot h-1.5 w-1.5",
                  s.grade === "good" && "bg-good",
                  s.grade === "warn" && "bg-warn",
                  s.grade === "critical" && "bg-critical animate-pulse-soft",
                )}
              />
            </div>
            <span className="font-mono text-[9px] text-foreground-muted truncate w-full text-center">
              {s.id.slice(-4)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tally({ label, count, color }: { label: string; count: number; color: "good" | "warn" | "critical" }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("status-dot", `bg-${color}`)} />
      <span className="text-foreground-muted">{label}</span>
      <span className="font-mono font-semibold text-foreground">{count}</span>
    </span>
  );
}
