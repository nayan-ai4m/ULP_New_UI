import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SettingsState, ActiveMode } from "@/lib/mock/settings";

interface Props { state: SettingsState }

const MODES: ActiveMode[] = ["Production", "Calibration", "Maintenance"];

function Toggle({
  value, onChange, label, onText, offText,
}: {
  value: boolean; onChange: (v: boolean) => void;
  label: string; onText: string; offText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[12px] text-foreground-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-[12px] font-semibold", value ? "text-good" : "text-critical")}>
          {value ? onText : offText}
        </span>
        <button
          onClick={() => onChange(!value)}
          className={cn(
            "relative h-6 w-11 rounded-full border transition-colors",
            value ? "bg-good/20 border-good/40" : "bg-critical/20 border-critical/40",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full transition-transform",
              value ? "translate-x-5 bg-good" : "translate-x-0.5 bg-critical",
            )}
          />
        </button>
      </div>
    </div>
  );
}

function SetpointField({
  label, plcTag, value, unit, onChange,
}: {
  label: string; plcTag: string; value: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-[var(--radius)] bg-[hsl(var(--surface-3))] border border-border">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.12em] text-foreground-dim">{label}</span>
        <span className="text-[9px] font-mono text-foreground-dim">{plcTag}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          step={0.5}
          className="flex-1 bg-[hsl(var(--surface-2))] border border-border text-foreground font-mono text-[13px] rounded-[var(--radius)] px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-[12px] text-foreground-dim font-mono w-6 shrink-0">{unit}</span>
      </div>
    </div>
  );
}

export function MachineRuntime({ state }: Props) {
  const { runtime, updateRuntime } = state;
  const sitInRange = runtime.targetSitC >= 145 && runtime.targetSitC <= 165;

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Operational Control */}
        <div className="panel p-4 relative overflow-hidden flex flex-col gap-4">
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-[hsl(38_92%_55%)]" />
          <div className="pl-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim mb-3">Operational Control</div>
            <div className="flex flex-col gap-3">
              <Toggle
                value={runtime.autoRun}
                onChange={(v) => updateRuntime({ autoRun: v })}
                label="Auto-Run"
                onText="ENABLED"
                offText="DISABLED"
              />
              <Toggle
                value={runtime.closedLoopEnabled}
                onChange={(v) => updateRuntime({ closedLoopEnabled: v })}
                label="Closed-Loop AI"
                onText="Active · Writing to PLC"
                offText="Advisory Only"
              />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] text-foreground-muted">Active Mode</span>
                <div className="flex items-center gap-1">
                  {MODES.map((m) => (
                    <button
                      key={m}
                      onClick={() => updateRuntime({ activeMode: m })}
                      className={cn(
                        "px-2.5 py-1 rounded-[var(--radius)] text-[11px] font-medium border transition-colors",
                        runtime.activeMode === m
                          ? "bg-primary/15 text-primary border-primary/40"
                          : "text-foreground-muted border-border hover:text-foreground",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] text-foreground-muted">Machine CPM</span>
                <span className="font-mono text-[14px] font-semibold text-foreground">{runtime.machineCpm}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active SKU Status */}
        <div className="panel p-4 relative overflow-hidden flex flex-col gap-3">
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-primary" />
          <div className="pl-3 flex flex-col gap-3">
            <div className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">Active SKU</div>
            <div className="flex items-center gap-3">
              <span className="status-dot bg-good animate-pulse-soft" />
              <span className="font-mono text-[22px] font-bold text-foreground">{runtime.activeSku}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-good/15 text-good border border-good/30">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-[0.14em] text-foreground-dim">Last Cycle</span>
                <span className="font-mono text-[14px] font-semibold text-foreground">80,030</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] uppercase tracking-[0.14em] text-foreground-dim">Shift</span>
                <span className="font-mono text-[14px] font-semibold text-foreground">A</span>
              </div>
            </div>
            <p className="text-[11px] text-foreground-dim leading-relaxed">
              Laminate targets below are read from the active Q-BOM. To edit targets, go to Config → Laminate Settings.
            </p>
          </div>
        </div>
      </div>

      {/* Row 2 — Active Laminate Targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Dwell Time */}
        <div className="panel p-4 relative overflow-hidden">
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-[hsl(38_92%_55%)]" />
          <div className="pl-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">Target Dwell Time</span>
              <span className="flex items-center gap-1 text-[9px] text-foreground-dim"><Lock className="h-2.5 w-2.5" /> Read-only</span>
            </div>
            <span className="font-mono text-[28px] font-bold text-foreground">{runtime.targetDwellMs}</span>
            <span className="text-[12px] text-foreground-muted">ms · from active Q-BOM</span>
          </div>
        </div>
        {/* Pressure */}
        <div className="panel p-4 relative overflow-hidden">
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-primary" />
          <div className="pl-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">Target Pressure</span>
              <span className="flex items-center gap-1 text-[9px] text-foreground-dim"><Lock className="h-2.5 w-2.5" /> Read-only</span>
            </div>
            <span className="font-mono text-[28px] font-bold text-foreground">{runtime.targetPressureMbar}</span>
            <span className="text-[12px] text-foreground-muted">mbar · from active Q-BOM</span>
          </div>
        </div>
        {/* SIT */}
        <div className="panel p-4 relative overflow-hidden">
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-primary" />
          <div className="pl-3 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">Target SIT</span>
              <span className="flex items-center gap-1 text-[9px] text-foreground-dim"><Lock className="h-2.5 w-2.5" /> Read-only</span>
            </div>
            <span className={cn("font-mono text-[28px] font-bold", sitInRange ? "text-foreground" : "text-warn")}>
              {runtime.targetSitC.toFixed(1)}
            </span>
            <span className="text-[12px] text-foreground-muted">°C · nominal 145–165°C</span>
            {!sitInRange && (
              <span className="text-[11px] text-warn mt-1">Outside nominal range — review laminate spec</span>
            )}
          </div>
        </div>
      </div>

      {/* Row 3 — Machine Setpoints */}
      <div className="panel p-4 relative overflow-hidden">
        <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-[hsl(38_92%_55%)]" />
        <div className="pl-3 flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">Machine Setpoints</span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(38_92%_55%/0.15)] border border-[hsl(38_92%_55%/0.3)] text-warn text-[11px] font-semibold">
              ⚠ PLC Write — changes apply on next cycle
            </span>
          </div>

          {/* 2-col grid for stroke setpoints */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SetpointField label="Vertical Sealer Temperature" plcTag="PLC:VSeal.Temp" value={runtime.verticalSealerTempC} unit="°C" onChange={(e) => updateRuntime({ verticalSealerTempC: e })} />
            <SetpointField label="Front Stroke" plcTag="PLC:Jaw.Front.Stroke" value={runtime.frontStrokeMm} unit="mm" onChange={(v) => updateRuntime({ frontStrokeMm: v })} />
            <SetpointField label="Back Stroke" plcTag="PLC:Jaw.Back.Stroke" value={runtime.backStrokeMm} unit="mm" onChange={(v) => updateRuntime({ backStrokeMm: v })} />
            <SetpointField label="Vertical Stroke 1" plcTag="PLC:VStroke1.Pos" value={runtime.verticalStroke1Mm} unit="mm" onChange={(v) => updateRuntime({ verticalStroke1Mm: v })} />
            <SetpointField label="Vertical Stroke 2" plcTag="PLC:VStroke2.Pos" value={runtime.verticalStroke2Mm} unit="mm" onChange={(v) => updateRuntime({ verticalStroke2Mm: v })} />
            <SetpointField label="Horizontal Stroke 1" plcTag="PLC:HStroke1.Pos" value={runtime.horizontalStroke1Mm} unit="mm" onChange={(v) => updateRuntime({ horizontalStroke1Mm: v })} />
            <SetpointField label="Horizontal Stroke 2" plcTag="PLC:HStroke2.Pos" value={runtime.horizontalStroke2Mm} unit="mm" onChange={(v) => updateRuntime({ horizontalStroke2Mm: v })} />
            <SetpointField label="Right Filling Piston" plcTag="PLC:Piston.Right.Stroke" value={runtime.rightFillingPistonMm} unit="mm" onChange={(v) => updateRuntime({ rightFillingPistonMm: v })} />
            <SetpointField label="Left Filling Piston" plcTag="PLC:Piston.Left.Stroke" value={runtime.leftFillingPistonMm} unit="mm" onChange={(v) => updateRuntime({ leftFillingPistonMm: v })} />
            <SetpointField label="Blow-Off Nozzle" plcTag="PLC:Nozzle.BlowOff.Pos" value={runtime.blowOffNozzleMm} unit="mm" onChange={(v) => updateRuntime({ blowOffNozzleMm: v })} />
            <SetpointField label="Shut-On Nozzle" plcTag="PLC:Nozzle.ShutOn.Pos" value={runtime.shutOnNozzleMm} unit="mm" onChange={(v) => updateRuntime({ shutOnNozzleMm: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}
