import { cn } from "@/lib/utils";
import type { ConfigState } from "@/lib/mock/config";

interface Props {
  state: ConfigState;
}

function SectionHeader({ label, accentColor }: { label: string; accentColor: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="h-4 w-1 rounded-full" style={{ background: accentColor }} />
      <h3 className="text-[14px] font-semibold text-foreground">{label}</h3>
    </div>
  );
}

function ConfigField({
  label,
  sublabel,
  value,
  unit,
  onChange,
  step,
}: {
  label: string;
  sublabel: string;
  value: number;
  unit?: string;
  onChange: (v: string) => void;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
          {label}
        </span>
        {unit && <span className="text-[10px] text-foreground-dim">{unit}</span>}
      </div>
      <p className="text-[10px] text-foreground-muted">{sublabel}</p>
      <input
        type="number"
        step={step ?? "any"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-2))]
                   px-3 py-2 font-mono text-[13px] text-foreground
                   focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
      />
    </div>
  );
}

export function BulkSettings({ state }: Props) {
  const { bulk, updateBulk } = state;
  const sum = +(bulk.sealA + bulk.sealB + bulk.sealC).toFixed(4);
  const sumOk = Math.abs(sum - 1) < 0.001;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* PQI Component Weights */}
      <div className="panel p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-1 rounded-full bg-primary" />
            <h3 className="text-[14px] font-semibold text-foreground">PQI Component Weights</h3>
          </div>
          <div className={cn(
            "font-mono text-[12px] font-medium px-2 py-0.5 rounded",
            sumOk
              ? "text-good bg-[hsl(var(--status-good-soft))]"
              : "text-warn bg-[hsl(var(--status-warn-soft))]",
          )}>
            a + b + c = {sum.toFixed(4)}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <ConfigField
            label="seal_a"
            sublabel="Heat component weight · 0 – 1"
            value={bulk.sealA}
            onChange={(v) => updateBulk({ sealA: +v })}
            step="0.01"
          />
          <ConfigField
            label="seal_b"
            sublabel="Torque component weight · 0 – 1"
            value={bulk.sealB}
            onChange={(v) => updateBulk({ sealB: +v })}
            step="0.01"
          />
          <ConfigField
            label="seal_c"
            sublabel="Dwell component weight · 0 – 1"
            value={bulk.sealC}
            onChange={(v) => updateBulk({ sealC: +v })}
            step="0.01"
          />
        </div>

        {!sumOk && (
          <p className="mt-3 text-[11px] text-warn">
            Weights must sum to exactly 1.0 before saving.
          </p>
        )}
      </div>

      {/* Compute Scalars */}
      <div className="panel p-5">
        <SectionHeader label="Compute Scalars" accentColor="hsl(270 70% 65%)" />
        <div className="grid grid-cols-2 gap-4">
          <ConfigField
            label="area_a"
            sublabel="Seal contact area (m²)"
            value={bulk.areaA}
            onChange={(v) => updateBulk({ areaA: +v })}
            step="0.0001"
          />
          <ConfigField
            label="alpha"
            sublabel="Heat transfer coefficient"
            value={bulk.alpha}
            onChange={(v) => updateBulk({ alpha: +v })}
            step="0.1"
          />
          <ConfigField
            label="beta"
            sublabel="Torque coefficient"
            value={bulk.beta}
            onChange={(v) => updateBulk({ beta: +v })}
            step="0.1"
          />
          <ConfigField
            label="const_c"
            sublabel="Compensation constant"
            value={bulk.constC}
            onChange={(v) => updateBulk({ constC: +v })}
            step="0.01"
          />
          <ConfigField
            label="t_eff"
            sublabel="Effective temperature (°C)"
            unit="°C"
            value={bulk.tEff}
            onChange={(v) => updateBulk({ tEff: +v })}
            step="1"
          />
          <ConfigField
            label="s2_threshold"
            sublabel="S² quality threshold"
            value={bulk.s2Threshold}
            onChange={(v) => updateBulk({ s2Threshold: +v })}
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
}
