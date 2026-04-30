import { Activity, LogOut, KeyRound, Cpu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { StatusPill } from "./StatusPill";
import type { DashboardSnapshot } from "@/lib/mock/dashboard";

const TABS: { label: string; to: string }[] = [
  { label: "Dashboard", to: "/" },
  { label: "PQI", to: "/pqi" },
  { label: "TQI", to: "/tqi" },
  { label: "Config", to: "/config" },
  { label: "Q-BOM", to: "/qbom" },
  { label: "Historian", to: "/historian" },
  { label: "Settings", to: "/settings" },
  { label: "Users", to: "/users" },
];

export function TopBar({ machine }: { machine: DashboardSnapshot["machine"] }) {
  const running = machine.state === "Running";
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-[hsl(var(--surface-1))]/90 backdrop-blur">
      {/* Row 1 — identity + context */}
      <div className="flex flex-wrap items-center gap-4 px-5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="leading-tight">
            <div className="font-mono text-lg font-semibold">{machine.id}</div>
          </div>
        </div>

        <div className="h-7 w-px bg-border" />

        <Field label="Machine">
          <span className="flex items-center gap-1.5">
            <span
              className={`status-dot ${running ? "bg-good animate-pulse-soft" : "bg-critical"}`}
            />
            <span className={running ? "text-good" : "text-critical"}>{machine.state}</span>
          </span>
        </Field>

        <div className="h-7 w-px bg-border" />

        <Field label="Cycle">
          <span className="font-mono text-base font-semibold text-foreground">{machine.cycle.toLocaleString()}</span>
        </Field>

        <div className="h-7 w-px bg-border" />

        <Field label="SKU">{machine.sku}</Field>

        <div className="h-7 w-px bg-border" />

        <Field label="Shift">{machine.shift}</Field>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-[10px] uppercase tracking-[0.18em] text-foreground-dim">Manager</div>
            <div className="text-sm font-medium">{machine.operator}</div>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-[hsl(var(--surface-2))] text-foreground-muted hover:text-foreground transition-colors">
            <KeyRound className="h-4 w-4" />
          </button>
          <button className="grid h-8 w-8 place-items-center rounded-md border border-border bg-[hsl(var(--surface-2))] text-foreground-muted hover:text-critical transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Row 2 — tabs */}
      <nav className="flex items-center gap-1 px-3 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const active = pathname === t.to;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`relative px-3 py-2.5 text-sm transition-colors ${active ? "text-foreground" : "text-foreground-muted hover:text-foreground"
                }`}
            >
              <span className="flex items-center gap-1.5">
                {t.label}
              </span>
              {active && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`leading-tight ${className} flex flex-row items-center gap-3`}>
      <div className="text-[13px] uppercase tracking-[0.18em] text-foreground">{label}</div>
      <div className="text-sm text-foreground-muted">{children}</div>
    </div>
  );
}
