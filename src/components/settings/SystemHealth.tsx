import { cn } from "@/lib/utils";
import type { SettingsState, WorkerHealth, StoreHealth } from "@/lib/mock/settings";

interface Props { state: SettingsState }

const STATUS_DOT: Record<WorkerHealth, string> = {
  online:   "bg-good",
  degraded: "bg-warn",
  offline:  "bg-critical",
};
const STATUS_TEXT: Record<WorkerHealth, string> = {
  online:   "text-good",
  degraded: "text-warn",
  offline:  "text-critical",
};
const ROW_TINT: Record<WorkerHealth, string> = {
  online:   "",
  degraded: "bg-[hsl(38_92%_55%/0.03)]",
  offline:  "bg-[hsl(0_84%_62%/0.05)] border-l-2 border-l-[hsl(0_84%_62%/0.4)]",
};

const STORE_ACCENT: Record<StoreHealth, string> = {
  ok:   "hsl(152 70% 48%)",
  warn: "hsl(38 92% 55%)",
  error: "hsl(0 84% 62%)",
};
const STORE_BADGE: Record<StoreHealth, string> = {
  ok:   "bg-[hsl(152_70%_48%/0.15)] text-good border-[hsl(152_70%_48%/0.3)]",
  warn: "bg-[hsl(38_92%_55%/0.15)] text-warn border-[hsl(38_92%_55%/0.3)]",
  error:"bg-[hsl(0_84%_62%/0.15)] text-critical border-[hsl(0_84%_62%/0.3)]",
};

function TH({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.14em] text-foreground-dim font-semibold">
      {children}
    </th>
  );
}

export function SystemHealth({ state }: Props) {
  const { workers, stores, sysInfo } = state;

  return (
    <div className="flex flex-col gap-4">
      {/* Worker Registry */}
      <div className="panel overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[hsl(var(--surface-2))]">
          <span className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">Cerebro Worker Registry</span>
          <span className="ml-3 font-mono text-[10px] text-foreground-dim">ZMQ ROUTER :5555 · HEALTH_CHECK every 10s</span>
        </div>
        <table className="w-full">
          <thead className="bg-[hsl(var(--surface-2))] border-b border-border">
            <tr><TH>#</TH><TH>Worker</TH><TH>Service</TH><TH>Error Range</TH><TH>Status</TH><TH>Last Heartbeat</TH></tr>
          </thead>
          <tbody>
            {workers.map((w) => (
              <tr key={w.id} className={cn("border-b border-border/50 last:border-0", ROW_TINT[w.status])}>
                <td className="px-4 py-2.5 font-mono text-[12px] text-foreground-dim">{w.id}</td>
                <td className="px-4 py-2.5 text-[13px] text-foreground font-medium">{w.name}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-primary">{w.service}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-foreground-muted">{w.errorRange}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("flex items-center gap-1.5 text-[12px] font-semibold", STATUS_TEXT[w.status])}>
                    <span className={cn("status-dot", STATUS_DOT[w.status], w.status === "online" && "animate-pulse-soft")} />
                    {w.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-foreground-muted">{w.lastHeartbeatAgo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Data Store Connectivity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stores.map((s) => (
          <div key={s.name} className="panel p-4 relative overflow-hidden">
            <span
              className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)]"
              style={{ background: STORE_ACCENT[s.status] }}
            />
            <div className="pl-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-[13px] text-foreground">{s.name}</span>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold border", STORE_BADGE[s.status])}>
                  {s.status}
                </span>
              </div>
              <span className="text-[11px] text-foreground-dim">{s.role}</span>
              <span className="font-mono text-[10px] text-foreground-muted">{s.endpoint}</span>
              <span className="font-mono text-[11px] text-foreground-muted mt-1">
                {s.latencyMs === 0 ? "<1ms" : `~${s.latencyMs}ms`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* System Info */}
      <div className="panel p-4 relative overflow-hidden">
        <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-primary" />
        <div className="pl-3 flex flex-col gap-3">
          <div className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim">System Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              { label: "Hostname",        value: sysInfo.hostname },
              { label: "IP Address",      value: sysInfo.ipAddress },
              { label: "OS Version",      value: sysInfo.osVersion },
              { label: "Framework",       value: sysInfo.frameworkVersion },
              { label: "Cerebro Broker",  value: `ZMQ ROUTER :${sysInfo.cerebroBrokerPort}` },
              { label: "Site ID",         value: sysInfo.siteId },
              { label: "IEC 62443 Zone",  value: sysInfo.iecZone },
              { label: "TLS",             value: null },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-[var(--radius)] bg-[hsl(var(--surface-3))] border border-border">
                <span className="text-[11px] text-foreground-dim">{label}</span>
                {label === "TLS" ? (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                    sysInfo.tlsEnabled
                      ? "bg-[hsl(152_70%_48%/0.15)] text-good border-[hsl(152_70%_48%/0.3)]"
                      : "bg-[hsl(0_84%_62%/0.15)] text-critical border-[hsl(0_84%_62%/0.3)]",
                  )}>
                    {sysInfo.tlsEnabled ? "Enabled" : "Disabled"}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-foreground text-right">{value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
