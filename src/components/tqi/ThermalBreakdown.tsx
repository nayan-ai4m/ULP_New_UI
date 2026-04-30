import type { ThermalComponent } from "@/lib/mock/tqi";
import { cn } from "@/lib/utils";

const ACCENT: Record<ThermalComponent["key"], string> = {
  front: "from-sky-500/30 to-sky-500/5 border-sky-500/40 text-sky-300",
  rear: "from-violet-500/30 to-violet-500/5 border-violet-500/40 text-violet-300",
  uniformity: "from-emerald-500/30 to-emerald-500/5 border-emerald-500/40 text-emerald-300",
};

const BAR_COLOR: Record<ThermalComponent["key"], string> = {
  front: "bg-sky-500/80",
  rear: "bg-violet-500/80",
  uniformity: "bg-emerald-500/80",
};

export function ThermalBreakdown({ components, tqi }: { components: ThermalComponent[]; tqi: number }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Thermal Breakdown</h3>
        <span className="text-[10px] font-mono text-foreground-dim">Σ = {tqi.toFixed(2)}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {components.map((c) => {
          const pct = clamp((c.weighted / c.weight) * 100);
          const sign = c.deviation >= 0 ? "+" : "";
          return (
            <div
              key={c.key}
              className={cn(
                "relative overflow-hidden rounded-md border bg-gradient-to-br p-2.5",
                ACCENT[c.key],
              )}
            >
              <div className="text-[12px] uppercase tracking-wider">{c.label}</div>
              <div className="font-mono text-xl font-semibold leading-none mt-1 text-foreground">
                {c.weighted.toFixed(2)}
              </div>
              <div className="text-[15px] text-foreground-muted mt-1 leading-tight">
                of {c.weight.toFixed(2)} cap
              </div>
              <div className="text-[12px] font-mono text-foreground-muted mt-1.5">
                {c.key === "uniformity"
                  ? `Delta ${sign}${c.deviation.toFixed(1)}°C`
                  : `${sign}${c.deviation.toFixed(1)}°C`}
              </div>
              <div className="mt-2 h-1 rounded-full bg-[hsl(var(--surface-3))] overflow-hidden">
                <div
                  className="h-full bg-current opacity-80 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stacked composition bar */}
      <div className="mt-5">
        <div className="text-[13px] uppercase tracking-wider text-foreground mb-1.5">
          TQI composition
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-3))]">
          {components.map((c) => (
            <div
              key={c.key}
              className={cn("h-full", BAR_COLOR[c.key])}
              style={{ width: `${tqi > 0 ? (c.weighted / tqi) * 100 : 0}%` }}
              title={`${c.label}: ${c.weighted.toFixed(3)}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-foreground-dim font-mono mt-1">
          <span>0.00</span><span>0.40</span><span>0.80</span><span>1.00</span>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number) { return Math.max(0, Math.min(100, n)); }
