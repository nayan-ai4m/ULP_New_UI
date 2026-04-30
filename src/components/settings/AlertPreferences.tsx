import { cn } from "@/lib/utils";
import type { SettingsState, RoutingMode } from "@/lib/mock/settings";

interface Props { state: SettingsState }

const ROUTING_MODES: { id: RoutingMode; label: string }[] = [
  { id: "Cockpit", label: "Cockpit Only" },
  { id: "Field",   label: "Field Tablet" },
  { id: "Both",    label: "Both" },
];

const ESCALATION_STAGES = [
  "NEW Alert",
  "Cockpit Delivered",
  `${10} min Timer`,
  "Field Escalated",
  "Clear-OK",
];

function Toggle({
  value, onChange, label, sublabel,
}: {
  value: boolean; onChange: (v: boolean) => void;
  label: string; sublabel?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-[12px] text-foreground-muted">{label}</span>
        {sublabel && <span className="text-[11px] text-foreground-dim">{sublabel}</span>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full border transition-colors",
          value ? "bg-good/20 border-good/40" : "bg-[hsl(var(--surface-3))] border-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full transition-transform",
            value ? "translate-x-5 bg-good" : "translate-x-0.5 bg-foreground-dim",
          )}
        />
      </button>
    </div>
  );
}

export function AlertPreferences({ state }: Props) {
  const { alerts, updateAlerts } = state;

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Routing Configuration */}
        <div className="panel p-4 relative overflow-hidden flex flex-col gap-4">
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-primary" />
          <div className="pl-3 flex flex-col gap-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">Routing Configuration</div>

            {/* Routing mode buttons */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-foreground-muted">Alert Routing Mode</span>
              <div className="flex items-center gap-1">
                {ROUTING_MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => updateAlerts({ routingMode: m.id })}
                    className={cn(
                      "px-3 py-1.5 rounded-[var(--radius)] text-[12px] font-medium border transition-colors",
                      alerts.routingMode === m.id
                        ? "bg-primary/15 text-primary border-primary/40"
                        : "text-foreground-muted border-border hover:text-foreground",
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Escalation timer */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[12px] text-foreground-muted">Escalation Timer</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={alerts.escalationTimerMin}
                  onChange={(e) => updateAlerts({ escalationTimerMin: parseInt(e.target.value) || 1 })}
                  min={1}
                  max={60}
                  className="w-20 bg-[hsl(var(--surface-2))] border border-border text-foreground font-mono text-[13px] rounded-[var(--radius)] px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[12px] text-foreground-dim">minutes</span>
              </div>
              <span className="text-[11px] text-foreground-dim">Alert auto-escalates to Field Tablet if not acknowledged within this window. Default: 10 min.</span>
            </div>

            <Toggle
              value={alerts.criticalOnlyField}
              onChange={(v) => updateAlerts({ criticalOnlyField: v })}
              label="Field Tablet — Critical Only"
              sublabel="When enabled, only Red-grade alerts are pushed to the field tablet."
            />
            <Toggle
              value={alerts.soundEnabled}
              onChange={(v) => updateAlerts({ soundEnabled: v })}
              label="Sound Alert"
              sublabel="Audible chime on new alert delivery."
            />
          </div>
        </div>

        {/* Delivery Channel Status */}
        <div className="panel p-4 relative overflow-hidden flex flex-col gap-4">
          <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-good" />
          <div className="pl-3 flex flex-col gap-4">
            <div className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">Delivery Channel Status</div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-2.5 rounded-[var(--radius)] bg-[hsl(var(--surface-3))] border border-border">
                <span className="text-[12px] text-foreground-muted">WebSocket Server</span>
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-good">
                  <span className="status-dot bg-good animate-pulse-soft" />
                  online
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-[var(--radius)] bg-[hsl(var(--surface-3))] border border-border">
                <span className="text-[12px] text-foreground-muted">Last Alert Delivered</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] text-foreground">08:14:32</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(38_92%_55%/0.15)] text-warn border border-[hsl(38_92%_55%/0.3)]">Amber</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-[var(--radius)] bg-[hsl(var(--surface-3))] border border-border">
                <span className="text-[12px] text-foreground-muted">Pending Escalations</span>
                <span className="font-mono text-[14px] font-semibold text-foreground">0</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-[var(--radius)] bg-[hsl(var(--surface-3))] border border-border">
                <span className="text-[12px] text-foreground-muted">Active WS Connections</span>
                <span className="font-mono text-[14px] font-semibold text-foreground">3</span>
              </div>
            </div>

            <Toggle
              value={alerts.websocketEnabled}
              onChange={(v) => updateAlerts({ websocketEnabled: v })}
              label="WebSocket Push"
              sublabel="Disable to pause all alert delivery (maintenance mode only)."
            />
          </div>
        </div>
      </div>

      {/* Row 2 — Escalation state machine */}
      <div className="panel p-4">
        <div className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim mb-4">Escalation State Machine</div>
        <div className="flex items-center gap-0 overflow-x-auto">
          {ESCALATION_STAGES.map((stage, i) => (
            <div key={stage} className="flex items-center shrink-0">
              <div
                className={cn(
                  "px-3 py-2 rounded-[var(--radius)] border text-[11px] font-medium text-center whitespace-nowrap",
                  i === 0
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-[hsl(var(--surface-3))] border-border text-foreground-muted",
                )}
              >
                {stage.replace("${10}", String(alerts.escalationTimerMin))}
              </div>
              {i < ESCALATION_STAGES.length - 1 && (
                <span className="mx-1.5 text-foreground-dim text-[12px]">→</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-foreground-dim mt-3">
          Alert Worker (service: 'alert' · error range 9xxx) manages dual-stream routing via WebSocket push with ≤2s delivery SLA. Escalation timer is configurable above.
        </p>
      </div>
    </div>
  );
}
