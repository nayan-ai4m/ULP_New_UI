import { cn } from "@/lib/utils";
import type { UsersState, ActivityAction } from "@/lib/mock/users";

/* ── Action color mapping ── */
const ACTION_STYLE: Record<ActivityAction, { dot: string; text: string; bg: string; border: string }> = {
  "User Created":      { dot: "bg-good",     text: "text-good",     bg: "bg-good-soft",     border: "border-good" },
  "User Edited":       { dot: "bg-primary",   text: "text-primary",   bg: "bg-primary/10",    border: "border-primary/25" },
  "User Deactivated":  { dot: "bg-critical",  text: "text-critical",  bg: "bg-critical-soft", border: "border-critical" },
  "User Activated":    { dot: "bg-good",     text: "text-good",     bg: "bg-good-soft",     border: "border-good" },
  "Password Reset":    { dot: "bg-warn",     text: "text-warn",     bg: "bg-warn-soft",     border: "border-warn" },
};

const FILTER_OPTIONS: { id: ActivityAction | "All"; label: string }[] = [
  { id: "All",              label: "All Events" },
  { id: "User Created",     label: "Created" },
  { id: "User Edited",      label: "Edited" },
  { id: "User Deactivated", label: "Deactivated" },
  { id: "User Activated",   label: "Activated" },
  { id: "Password Reset",   label: "Password Reset" },
];

export function ActivityLog({ state }: { state: UsersState }) {
  const { filteredActivity, activityFilter, setActivityFilter } = state;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin pb-1">
        {FILTER_OPTIONS.map((f) => (
          <button
            key={f.id}
            onClick={() => setActivityFilter(f.id as any)}
            className={cn(
              "px-3 py-1.5 rounded-[var(--radius)] text-[12px] font-medium border transition-colors whitespace-nowrap",
              activityFilter === f.id
                ? "bg-primary/15 text-primary border-primary/40"
                : "text-foreground-muted border-border hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-[hsl(var(--surface-2))]/50">
                {["Timestamp", "Action", "Performed By", "Target User", "Details"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-foreground-dim font-semibold whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredActivity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[13px] text-foreground-dim">
                    No activity events match your filter
                  </td>
                </tr>
              ) : (
                filteredActivity.map((event) => {
                  const style = ACTION_STYLE[event.action];
                  return (
                    <tr
                      key={event.id}
                      className="border-b border-border/50 last:border-b-0 hover:bg-[hsl(var(--surface-2))]/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] text-foreground-muted">{event.timestamp}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                            style.bg,
                            style.text,
                            style.border,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
                          {event.action}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] text-primary">{event.actor}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] text-foreground">{event.targetUser}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-foreground-muted">{event.details}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-[hsl(var(--surface-1))]/60">
          <span className="text-[11px] text-foreground-dim">
            Showing {filteredActivity.length} event{filteredActivity.length !== 1 ? "s" : ""} ·
            Audit trail is immutable — no UPDATE or DELETE permitted (FRS audit_log)
          </span>
        </div>
      </div>
    </div>
  );
}
