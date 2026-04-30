import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QbomVersion, QbomState } from "@/lib/mock/qbom";

interface Props {
  skuId: string;
  onClose: () => void;
  onSave: QbomState["addVersion"];
}

type FormData = Omit<QbomVersion, "id" | "skuId" | "version" | "modified" | "status">;

const DEFAULTS: FormData = {
  vSealTemp: 155, vStroke1: 90, vStroke2: 270,
  hSealFront: 140, hSealBack: 140, hStroke1: 90, hStroke2: 270,
  rightPistonStroke: 50, leftPistonStroke: 50,
  nozzleShutOff: 180, nozzleShutOn: 0,
  greenLower: 0.75, greenUpper: 1, amberLower: 0.5, amberUpper: 0.75, redLower: 0, redUpper: 0.5,
};

const STEP_NAMES = [
  "Vertical Sealer",
  "Horizontal Sealer Temperature",
  "Filling Pistons",
  "Nozzle Control",
  "SQI Thresholds",
  "Review & Save",
];

function WizardField({
  label, sublabel, value, unit, onChange, step = "any",
}: {
  label: string; sublabel?: string; value: number; unit?: string;
  onChange: (v: number) => void; step?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground">{label}</span>
        {unit && <span className="text-[10px] text-foreground-dim">{unit}</span>}
      </div>
      {sublabel && <p className="text-[10px] text-foreground-muted">{sublabel}</p>}
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full rounded-[var(--radius)] border border-border bg-[hsl(var(--surface-3))]
                   px-3 py-2 font-mono text-[13px] text-foreground
                   focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
      />
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="h-4 w-1 rounded-full bg-primary" />
      <h3 className="text-[14px] font-semibold text-foreground">{label}</h3>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-[var(--radius)] bg-[hsl(var(--surface-3))] border border-border">
      <span className="text-[9px] uppercase tracking-[0.14em] text-foreground-dim">{label}</span>
      <span className="font-mono text-[13px] font-semibold text-foreground">{value}</span>
    </div>
  );
}

export function QbomWizard({ skuId, onClose, onSave }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(DEFAULTS);

  function patch(field: Partial<FormData>) {
    setForm((prev) => ({ ...prev, ...field }));
  }

  function handleApply() {
    onSave({ skuId, ...form });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[hsl(var(--surface-2))] rounded-xl border border-border shadow-2xl flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Create Q-BOM For {skuId}</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Step {step} of 6 — {STEP_NAMES[step - 1]}</p>
          </div>
          <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-md border border-border text-foreground-dim hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 px-6 py-4">
          {STEP_NAMES.map((name, i) => {
            const n = i + 1;
            const done = n < step;
            const active = n === step;
            return (
              <div key={n} className="flex items-center gap-2">
                <button
                  onClick={() => setStep(n)}
                  title={name}
                  className={cn(
                    "h-7 w-7 rounded-full text-[12px] font-semibold flex items-center justify-center border transition-colors",
                    active && "bg-primary text-primary-foreground border-primary",
                    done && "bg-[hsl(var(--status-good)/0.2)] text-good border-[hsl(var(--status-good)/0.4)]",
                    !active && !done && "bg-[hsl(var(--surface-3))] text-foreground-dim border-border",
                  )}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : n}
                </button>
                {i < STEP_NAMES.length - 1 && (
                  <span className="h-px w-4 bg-border" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="px-6 py-2 overflow-y-auto max-h-[55vh]">
          {step === 1 && (
            <div>
              <SectionHeader label="Vertical Sealer" />
              <div className="grid grid-cols-2 gap-4">
                <WizardField label="Vertical Sealer Temperature" unit="°C" sublabel="Allowed range: 100.0 – 250.0 °C" value={form.vSealTemp} onChange={(v) => patch({ vSealTemp: v })} />
                <WizardField label="Vertical Stroke 1" unit="°" sublabel="Allowed range: 0.0 – 360.0 °" value={form.vStroke1} onChange={(v) => patch({ vStroke1: v })} />
                <WizardField label="Vertical Stroke 2" unit="°" sublabel="Allowed range: 0.0 – 360.0 °" value={form.vStroke2} onChange={(v) => patch({ vStroke2: v })} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <SectionHeader label="Horizontal Sealer Temperature" />
              <div className="grid grid-cols-2 gap-4">
                <WizardField label="Front" unit="°C" sublabel="Allowed range: 100.0 – 250.0 °C" value={form.hSealFront} onChange={(v) => patch({ hSealFront: v })} />
                <WizardField label="Back" unit="°C" sublabel="Allowed range: 100.0 – 250.0 °C" value={form.hSealBack} onChange={(v) => patch({ hSealBack: v })} />
                <WizardField label="Horizontal Stroke 1" unit="°" sublabel="Allowed range: 0.0 – 360.0 °" value={form.hStroke1} onChange={(v) => patch({ hStroke1: v })} />
                <WizardField label="Horizontal Stroke 2" unit="°" sublabel="Allowed range: 0.0 – 360.0 °" value={form.hStroke2} onChange={(v) => patch({ hStroke2: v })} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <SectionHeader label="Filling Pistons" />
              <div className="grid grid-cols-2 gap-4">
                <WizardField label="Right Filling Piston Stroke" unit="mm" sublabel="Allowed range: 0.0 – 200.0 mm" value={form.rightPistonStroke} onChange={(v) => patch({ rightPistonStroke: v })} />
                <WizardField label="Left Filling Piston Stroke" unit="mm" sublabel="Allowed range: 0.0 – 200.0 mm" value={form.leftPistonStroke} onChange={(v) => patch({ leftPistonStroke: v })} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <SectionHeader label="Nozzle Control" />
              <div className="grid grid-cols-2 gap-4">
                <WizardField label="Shut Off Nozzle" unit="°" sublabel="Allowed range: 0.0 – 360.0 °" value={form.nozzleShutOff} onChange={(v) => patch({ nozzleShutOff: v })} />
                <WizardField label="Shut On Nozzle" unit="°" sublabel="Allowed range: 0.0 – 360.0 °" value={form.nozzleShutOn} onChange={(v) => patch({ nozzleShutOn: v })} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <SectionHeader label="SQI Thresholds" />
              <div className="grid grid-cols-2 gap-4">
                <WizardField label="Green Lower" sublabel="Allowed range: 0.0 – 1.0" step="0.01" value={form.greenLower} onChange={(v) => patch({ greenLower: v })} />
                <WizardField label="Green Upper" sublabel="Allowed range: 0.0 – 1.0" step="0.01" value={form.greenUpper} onChange={(v) => patch({ greenUpper: v })} />
                <WizardField label="Amber Lower" sublabel="Allowed range: 0.0 – 1.0" step="0.01" value={form.amberLower} onChange={(v) => patch({ amberLower: v })} />
                <WizardField label="Amber Upper" sublabel="Allowed range: 0.0 – 1.0" step="0.01" value={form.amberUpper} onChange={(v) => patch({ amberUpper: v })} />
                <WizardField label="Red Lower" sublabel="Allowed range: 0.0 – 1.0" step="0.01" value={form.redLower} onChange={(v) => patch({ redLower: v })} />
                <WizardField label="Red Upper" sublabel="Allowed range: 0.0 – 1.0" step="0.01" value={form.redUpper} onChange={(v) => patch({ redUpper: v })} />
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <SectionHeader label="Review & Save" />
              <p className="text-[11px] text-warn mb-4 px-3 py-2 rounded bg-[hsl(var(--status-warn)/0.08)] border border-[hsl(var(--status-warn)/0.2)]">
                Review the values below. Nothing is saved until you click Apply Configuration and confirm.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <ReviewRow label="V. Seal Temp" value={`${form.vSealTemp} °C`} />
                <ReviewRow label="V. Stroke 1" value={`${form.vStroke1} °`} />
                <ReviewRow label="V. Stroke 2" value={`${form.vStroke2} °`} />
                <ReviewRow label="H. Front" value={`${form.hSealFront} °C`} />
                <ReviewRow label="H. Back" value={`${form.hSealBack} °C`} />
                <ReviewRow label="H. Stroke 1" value={`${form.hStroke1} °`} />
                <ReviewRow label="H. Stroke 2" value={`${form.hStroke2} °`} />
                <ReviewRow label="R. Piston" value={`${form.rightPistonStroke} mm`} />
                <ReviewRow label="L. Piston" value={`${form.leftPistonStroke} mm`} />
                <ReviewRow label="Nozzle Off" value={`${form.nozzleShutOff} °`} />
                <ReviewRow label="Nozzle On" value={`${form.nozzleShutOn} °`} />
                <ReviewRow label="Green Lower" value={String(form.greenLower)} />
                <ReviewRow label="Green Upper" value={String(form.greenUpper)} />
                <ReviewRow label="Amber Lower" value={String(form.amberLower)} />
                <ReviewRow label="Amber Upper" value={String(form.amberUpper)} />
                <ReviewRow label="Red Lower" value={String(form.redLower)} />
                <ReviewRow label="Red Upper" value={String(form.redUpper)} />
              </div>
            </div>
          )}
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border mt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-[var(--radius)] border border-border text-[13px] text-foreground-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className={cn(
                "flex items-center gap-1 px-4 py-2 rounded-[var(--radius)] border text-[13px] transition-colors",
                step === 1
                  ? "border-border text-foreground-dim cursor-not-allowed opacity-40"
                  : "border-border text-foreground-muted hover:text-foreground",
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            {step < 6 ? (
              <button
                onClick={() => setStep((s) => Math.min(6, s + 1))}
                className="flex items-center gap-1 px-4 py-2 rounded-[var(--radius)] bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleApply}
                className="px-5 py-2 rounded-[var(--radius)] bg-good text-white text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                Apply Configuration
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
