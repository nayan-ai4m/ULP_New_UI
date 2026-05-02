import { Check, X } from "lucide-react";
import { useState } from "react";
import { type AlertEvent, type DashboardSnapshot } from "@/lib/mock/dashboard";
import { cn } from "@/lib/utils";

export function AlertRail({ alerts }: { alerts: DashboardSnapshot["alerts"] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  function dismiss(id: string) {
    setDismissed((prev) => new Set(prev).add(id));
  }

  return (
    <aside className="panel flex flex-col max-h-[39.5vh] overflow-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Live alerts</h2>
        </div>
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--surface-3))] text-white">
          {visible.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {visible.length === 0 ? (
          <div className="h-full grid place-items-center text-center p-6 text-foreground text-sm">
            <div>
              <Check className="h-6 w-6 mx-auto mb-2 text-good" />
              All indices within good range.
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((a) => (
              <AlertLogEntry key={a.id} a={a} onDismiss={dismiss} />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function AlertLogEntry({
  a,
  onDismiss,
}: {
  a: AlertEvent;
  onDismiss: (id: string) => void;
}) {
  const isCrit = a.grade === "critical";
  return (
    <li className="p-4">
      {/* Header — severity + timestamp + dismiss */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-medium uppercase tracking-wider",
            isCrit
              ? "bg-critical-soft text-critical border-critical"
              : "bg-warn-soft text-warn border-warn",
          )}
        >
          <span
            className={cn(
              "status-dot",
              isCrit ? "bg-critical animate-pulse-soft" : "bg-warn",
            )}
          />
          {String(a.index).toUpperCase()} · {isCrit ? "Critical" : "Watch"}
        </span>
        <div className="flex items-center gap-2">
          <time className="font-mono text-[12px] text-foreground">
            {new Date(a.ts).toLocaleTimeString()}
          </time>
          <button
            onClick={() => onDismiss(a.id)}
            className="grid h-6 w-6 place-items-center rounded border border-border bg-[hsl(var(--surface-2))] text-foreground-muted hover:text-foreground hover:border-foreground-muted transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Problem description */}
      <p className="text-[15px] text-foreground leading-snug">{a.reason}</p>

      {/* Action taken */}
      <div className="mt-2.5 rounded-md border border-border bg-[hsl(var(--surface-2))] p-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          {isCrit ? (
            <span className="inline-flex items-center gap-1 text-[13px] font-medium uppercase tracking-wider text-critical">
              Machine Stopped
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[13px] font-medium uppercase tracking-wider text-primary">
              Settings Adjusted
            </span>
          )}
        </div>
        <p className="text-[15px] text-foreground-muted leading-snug">
          {a.action}
        </p>
      </div>
    </li>
  );
}
