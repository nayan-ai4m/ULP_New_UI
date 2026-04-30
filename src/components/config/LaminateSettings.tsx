import { ChevronDown } from "lucide-react";
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
  value: number | string;
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

export function LaminateSettings({ state }: Props) {
  const { laminates, activeSku, setActiveSku, updateLaminate } = state;
  const profile = laminates[activeSku];
  const skus = Object.keys(laminates);

  function patch(field: Parameters<typeof updateLaminate>[1]) {
    updateLaminate(activeSku, field);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* SKU Selector */}
      <div className="panel p-4 flex items-center gap-4">
        <span className="text-[12px] uppercase tracking-[0.15em] text-foreground-muted font-medium">
          Laminate
        </span>
        <div className="relative">
          <select
            value={activeSku}
            onChange={(e) => setActiveSku(e.target.value)}
            className="appearance-none rounded-[var(--radius)] border border-border
                       bg-[hsl(var(--surface-2))] pl-3 pr-8 py-1.5
                       font-mono text-[13px] text-foreground
                       focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {skus.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-dim" />
        </div>
      </div>

      {/* 2×2 Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Layer Dimensions */}
        <div className="panel p-5">
          <SectionHeader label="Layer Dimensions" accentColor="hsl(192 90% 55%)" />
          <div className="grid grid-cols-3 gap-4">
            <ConfigField
              label="Outer Layer (d₁)"
              sublabel="Thickness in metres"
              unit="m"
              value={profile.d1}
              onChange={(v) => patch({ d1: +v })}
              step="0.000001"
            />
            <ConfigField
              label="Mid Layer (d₂)"
              sublabel="Thickness in metres"
              unit="m"
              value={profile.d2}
              onChange={(v) => patch({ d2: +v })}
              step="0.000001"
            />
            <ConfigField
              label="Inner Layer (d₃)"
              sublabel="Thickness in metres"
              unit="m"
              value={profile.d3}
              onChange={(v) => patch({ d3: +v })}
              step="0.000001"
            />
          </div>
        </div>

        {/* Thermal Conductivity */}
        <div className="panel p-5">
          <SectionHeader label="Thermal Conductivity" accentColor="hsl(192 90% 55%)" />
          <div className="grid grid-cols-3 gap-4">
            <ConfigField
              label="Layer A (k_a)"
              sublabel="Thermal conductivity"
              value={profile.k_a}
              onChange={(v) => patch({ k_a: +v })}
              step="0.01"
            />
            <ConfigField
              label="Layer B (k_b)"
              sublabel="Thermal conductivity"
              value={profile.k_b}
              onChange={(v) => patch({ k_b: +v })}
              step="0.01"
            />
            <ConfigField
              label="Layer C (k_c)"
              sublabel="Thermal conductivity"
              value={profile.k_c}
              onChange={(v) => patch({ k_c: +v })}
              step="0.01"
            />
          </div>
        </div>

        {/* Process Targets */}
        <div className="panel p-5">
          <SectionHeader label="Process Targets" accentColor="hsl(38 92% 55%)" />
          <div className="grid grid-cols-3 gap-4">
            <ConfigField
              label="SIT Threshold"
              sublabel="Seal initiation temperature"
              unit="°C"
              value={profile.sit}
              onChange={(v) => patch({ sit: +v })}
              step="1"
            />
            <ConfigField
              label="Pressure Target"
              sublabel="Target jaw pressure"
              unit="units"
              value={profile.pressureTarget}
              onChange={(v) => patch({ pressureTarget: +v })}
              step="1"
            />
            <ConfigField
              label="Time Target"
              sublabel="Target dwell time"
              unit="s"
              value={profile.timeTarget}
              onChange={(v) => patch({ timeTarget: +v })}
              step="0.01"
            />
          </div>
        </div>

        {/* Diffusivity */}
        <div className="panel p-5">
          <SectionHeader label="Diffusivity" accentColor="hsl(175 70% 48%)" />
          <div className="grid grid-cols-3 gap-4">
            <ConfigField
              label="PE Diffusivity"
              sublabel="α PE — thermal diffusivity"
              value={profile.alphaPE}
              onChange={(v) => patch({ alphaPE: +v })}
              step="1e-9"
            />
            <ConfigField
              label="VM-PET Diffusivity"
              sublabel="α VM-PET diffusivity"
              value={profile.alphaVMPET}
              onChange={(v) => patch({ alphaVMPET: +v })}
              step="1e-9"
            />
            <ConfigField
              label="PET Diffusivity"
              sublabel="α PET diffusivity"
              value={profile.alphaPET}
              onChange={(v) => patch({ alphaPET: +v })}
              step="1e-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
