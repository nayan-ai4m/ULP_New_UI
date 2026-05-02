import type { WeightedComponent } from "@/lib/mock/pqi";
import { cn } from "@/lib/utils";

const ACCENT: Record<WeightedComponent["key"], string> = {
  heat: "from-orange-500/30 to-orange-500/5 border-orange-500/40 text-orange-300",
  pressure: "from-sky-500/30 to-sky-500/5 border-sky-500/40 text-sky-300",
  dwell:
    "from-emerald-500/30 to-emerald-500/5 border-emerald-500/40 text-emerald-300",
};

export function WeightedContribution({
  items,
  pqi,
}: {
  items: WeightedComponent[];
  pqi: number;
}) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Weighted Contribution</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => {
          const pctOfMax = (it.weighted / it.weight) * 100;
          return (
            <div
              key={it.key}
              className={cn(
                "relative overflow-hidden rounded-md border bg-gradient-to-br p-2.5",
                ACCENT[it.key],
              )}
            >
              <div className="text-[12px] uppercase tracking-wider">
                {it.label}
              </div>
              <div className="font-mono text-[20px] font-semibold leading-none mt-1 text-foreground">
                {it.weighted.toFixed(2)}
              </div>
              <div className="text-[15px] text-foreground-muted mt-1 leading-tight">
                of {it.weight.toFixed(2)} cap
              </div>
              <div className="mt-2 h-1 rounded-full bg-[hsl(var(--surface-3))] overflow-hidden">
                <div
                  className="h-full bg-current opacity-80 transition-all"
                  style={{ width: `${clamp(pctOfMax)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stacked bar showing composition of PQI — bar width = PQI score */}
      <div className="mt-4">
        <div className="text-[12px] uppercase tracking-wider text-foreground mb-1.5">
          PQI composition
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-3))]">
          {/* The colored fill only stretches to pqi% of the total bar */}
          <div
            className="absolute left-0 top-0 h-full flex overflow-hidden rounded-full"
            style={{ width: `${clamp(pqi * 100)}%` }}
          >
            {items.map((it) => (
              <div
                key={it.key}
                className={cn(
                  "h-full",
                  it.key === "heat" && "bg-orange-500/80",
                  it.key === "pressure" && "bg-sky-500/80",
                  it.key === "dwell" && "bg-emerald-500/80",
                )}
                style={{ width: `${pqi > 0 ? (it.weighted / pqi) * 100 : 0}%` }}
                title={`${it.label}: ${it.weighted.toFixed(3)}`}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[12px] text-foreground mt-1">
          <span>0</span>
          <span>0.25</span>
          <span>0.50</span>
          <span>0.75</span>
          <span>1.00</span>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}
