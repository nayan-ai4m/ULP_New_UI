import type { ThermalComponent } from "@/lib/mock/tqi";
import { cn } from "@/lib/utils";

function deviationColor(dev: number): string {
  const abs = Math.abs(dev);
  if (abs <= 1) return "text-good";
  if (abs <= 3) return "text-warn";
  return "text-critical";
}

function JawRow({ component }: { component: ThermalComponent }) {
  const sign = component.deviation >= 0 ? "+" : "";
  const devColor = deviationColor(component.deviation);
  const isFront = component.key === "front";

  return (
    <div className={cn(
      "rounded-md border p-3",
      isFront
        ? "border-sky-500/30 bg-sky-500/5"
        : "border-violet-500/30 bg-violet-500/5",
    )}>
      <div className={cn(
        "text-[10px] uppercase tracking-[0.15em] font-medium mb-2",
        isFront ? "text-sky-400" : "text-violet-400",
      )}>
        {component.label}
      </div>
      <div className="grid grid-cols-3 gap-1 text-center">
        <div>
          <div className="text-[9px] uppercase text-foreground mb-0.5">Setpoint</div>
          <div className="font-mono text-[15px] font-semibold text-foreground">{component.setpoint}°C</div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-foreground mb-0.5">Actual</div>
          <div className="font-mono text-[15px] font-semibold text-foreground">{component.actual}°C</div>
        </div>
        <div>
          <div className="text-[9px] uppercase text-foreground mb-0.5">Delta</div>
          <div className={cn("font-mono text-[15px] font-semibold", devColor)}>
            {sign}{component.deviation.toFixed(1)}°
          </div>
        </div>
      </div>
    </div>
  );
}

export function JawReadings({ components }: { components: ThermalComponent[] }) {
  const front = components.find((c) => c.key === "front")!;
  const rear = components.find((c) => c.key === "rear")!;
  const unif = components.find((c) => c.key === "uniformity")!;
  const gradColor = deviationColor(unif.deviation);

  return (
    <div className="panel p-4 flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Jaw Readings</h3>
      <JawRow component={front} />
      <JawRow component={rear} />
      <div className="rounded-md border border-border bg-[hsl(var(--surface-2))] p-3">
        <div className="text-[10px] uppercase tracking-[0.15em] text-foreground mb-2">Cross-Jaw Delta</div>
        <div className="flex items-center justify-between">
          <div className="text-[12px] text-foreground">
            |Front − Rear| = <span className="font-mono text-foreground">{unif.actual}°C</span>
          </div>
          <div className={cn("font-mono text-[13px] font-semibold", gradColor)}>
            {unif.deviation >= 0 ? "+" : ""}{unif.deviation.toFixed(1)}° from ideal
          </div>
        </div>
      </div>
    </div>
  );
}
