import { Users, UserCheck, UserX, Shield } from "lucide-react";
import type { UsersState } from "@/lib/mock/users";

const cards = (s: UsersState) => [
  {
    label: "Total Users",
    value: s.totalCount,
    icon: Users,
    accent: "bg-primary",
    textColor: "text-primary",
    bgTint: "bg-primary/10",
    borderColor: "border-primary/25",
  },
  {
    label: "Active",
    value: s.activeCount,
    icon: UserCheck,
    accent: "bg-good",
    textColor: "text-good",
    bgTint: "bg-good-soft",
    borderColor: "border-good",
    dot: true,
    dotClass: "bg-good animate-pulse-soft",
  },
  {
    label: "Inactive",
    value: s.inactiveCount,
    icon: UserX,
    accent: "bg-critical",
    textColor: "text-critical",
    bgTint: "bg-critical-soft",
    borderColor: "border-critical",
    dot: true,
    dotClass: "bg-critical",
  },
  {
    label: "Roles Defined",
    value: 3,
    icon: Shield,
    accent: "bg-warn",
    textColor: "text-warn",
    bgTint: "bg-warn-soft",
    borderColor: "border-warn",
    sub: `${s.roleCounts.Operator}O · ${s.roleCounts.Technician}T · ${s.roleCounts.Manager}M`,
  },
];

export function UserSummaryStrip({ state }: { state: UsersState }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards(state).map((c) => (
        <div
          key={c.label}
          className="panel relative overflow-hidden p-4 flex items-center gap-3"
        >
          {/* Left accent strip */}
          <span
            className={`absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] ${c.accent}`}
          />

          {/* Icon */}
          <div
            className={`ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.bgTint} border ${c.borderColor}`}
          >
            <c.icon className={`h-5 w-5 ${c.textColor}`} />
          </div>

          {/* Text */}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] uppercase tracking-[0.14em] text-foreground-dim">
              {c.label}
            </span>
            <div className="flex items-center gap-2">
              {c.dot && <span className={`status-dot ${c.dotClass}`} />}
              <span className={`font-mono text-[22px] font-bold ${c.textColor}`}>
                {c.value}
              </span>
            </div>
            {c.sub && (
              <span className="text-[10px] text-foreground-dim font-mono">
                {c.sub}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
