import type { ConfigState } from "@/lib/mock/config";

interface Props {
  state: ConfigState;
}

function SectionHeader({ label, accentColor, note }: { label: string; accentColor: string; note?: string }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-1 rounded-full" style={{ background: accentColor }} />
        <h3 className="text-[14px] font-semibold text-foreground">{label}</h3>
      </div>
      {note && (
        <span className="text-[10px] text-foreground-dim font-mono">{note}</span>
      )}
    </div>
  );
}

function ReadOnlyField({ label, sublabel, value }: { label: string; sublabel: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">
          {label}
        </span>
        <span className="text-[9px] uppercase tracking-[0.12em] text-foreground-dim border border-border rounded px-1.5 py-0.5">
          Read-only
        </span>
      </div>
      <p className="text-[10px] text-foreground-muted">{sublabel}</p>
      <input
        type="text"
        value={value}
        readOnly
        className="w-full rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-1))]
                   px-3 py-2 font-mono text-[13px] text-foreground-muted
                   cursor-not-allowed opacity-60"
      />
    </div>
  );
}

function ConfigField({
  label,
  sublabel,
  value,
  unit,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  sublabel: string;
  value: string | number;
  unit?: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
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
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-2))]
                   px-3 py-2 font-mono text-[13px] text-foreground
                   focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
      />
    </div>
  );
}

export function MachineIdentity({ state }: Props) {
  const { machine, updateMachine } = state;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Machine Identity */}
      <div className="panel p-5">
        <SectionHeader label="Machine Identity" accentColor="hsl(192 90% 55%)" />
        <div className="flex flex-col gap-4">
          <ReadOnlyField
            label="Machine ID"
            sublabel="Read-only identifier"
            value={machine.machineId}
          />
          <ConfigField
            label="Ambient Temperature"
            sublabel="Baseline reference temperature (°C)"
            unit="°C"
            type="number"
            step="0.01"
            value={machine.ambientTemp}
            onChange={(v) => updateMachine({ ambientTemp: +v })}
          />
        </div>
      </div>

      {/* PLC Tag Mapping */}
      <div className="panel p-5">
        <SectionHeader
          label="PLC Tag Mapping"
          accentColor="hsl(38 92% 55%)"
          note="Allowed: A-Z 0-9 _ . : [ ] / -"
        />
        <div className="grid grid-cols-2 gap-4">
          <ConfigField
            label="Front Jaw Temp"
            sublabel="PLC temperature tag — front jaw"
            value={machine.plcFrontJaw}
            onChange={(v) => updateMachine({ plcFrontJaw: v })}
          />
          <ConfigField
            label="Rear Jaw Temp"
            sublabel="PLC temperature tag — rear jaw"
            value={machine.plcRearJaw}
            onChange={(v) => updateMachine({ plcRearJaw: v })}
          />
          <ConfigField
            label="Torque Signal"
            sublabel="Horizontal sealer torque signal tag"
            value={machine.plcTorque}
            onChange={(v) => updateMachine({ plcTorque: v })}
          />
          <ConfigField
            label="Position Signal"
            sublabel="Horizontal sealer position signal tag"
            value={machine.plcPosition}
            onChange={(v) => updateMachine({ plcPosition: v })}
          />
        </div>
      </div>
    </div>
  );
}
