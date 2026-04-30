import { AlertTriangle, Check, X, Zap } from "lucide-react";
import { applyPrescription, type AlertEvent, type DashboardSnapshot } from "@/lib/mock/dashboard";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function AlertRail({ alerts }: { alerts: DashboardSnapshot["alerts"] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const visible = alerts.filter((a) => !dismissed.has(a.id));

  return (
    <aside className="panel flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warn" />
          <h2 className="text-sm font-semibold">Live alerts</h2>
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--surface-3))] text-foreground-muted">
            {visible.length}
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-foreground-dim">Advisory</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {visible.length === 0 ? (
          <div className="h-full grid place-items-center text-center p-6 text-foreground-dim text-sm">
            <div>
              <Check className="h-6 w-6 mx-auto mb-2 text-good" />
              All indices within green band.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((a) => (
              <AlertItem
                key={a.id}
                a={a}
                applied={applied.has(a.id) || !!a.applied}
                onApply={() => {
                  applyPrescription(a.id);
                  setApplied((s) => new Set(s).add(a.id));
                }}
                onDismiss={() => setDismissed((s) => new Set(s).add(a.id))}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function AlertItem({
  a,
  applied,
  onApply,
  onDismiss,
}: {
  a: AlertEvent;
  applied: boolean;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const isCrit = a.grade === "critical";
  return (
    <li className="p-4 hover:bg-[hsl(var(--surface-2))]/50 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
            isCrit ? "bg-critical-soft text-critical border-critical" : "bg-warn-soft text-warn border-warn",
          )}
        >
          <span className={cn("status-dot", isCrit ? "bg-critical animate-pulse-soft" : "bg-warn")} />
          {String(a.index).toUpperCase()} · {isCrit ? "Critical" : "Watch"}
        </span>
        <time className="font-mono text-[10px] text-foreground-dim">
          {new Date(a.ts).toLocaleTimeString()}
        </time>
      </div>
      <p className="text-sm text-foreground leading-snug">{a.reason}</p>
      <div className="mt-2.5 rounded-md border border-border bg-[hsl(var(--surface-2))] p-2.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-foreground-dim mb-1">
          <Zap className="h-3 w-3 text-primary" /> Prescription
        </div>
        <p className="text-xs text-foreground-muted leading-snug">{a.prescription}</p>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <button
          disabled={applied}
          onClick={onApply}
          className={cn(
            "flex-1 h-8 rounded-md text-xs font-medium border transition-colors",
            applied
              ? "border-good bg-good-soft text-good cursor-default"
              : "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25",
          )}
        >
          {applied ? (
            <span className="inline-flex items-center justify-center gap-1.5">
              <Check className="h-3.5 w-3.5" /> Applied
            </span>
          ) : (
            "Apply prescription"
          )}
        </button>
        <button
          onClick={onDismiss}
          className="h-8 px-2 rounded-md border border-border text-foreground-muted hover:text-foreground hover:bg-[hsl(var(--surface-3))] transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}
