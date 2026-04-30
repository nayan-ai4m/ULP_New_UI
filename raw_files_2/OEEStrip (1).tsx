import type { DashboardSnapshot } from "@/lib/mock/dashboard";

export function OEEStrip({ oee }: { oee: DashboardSnapshot["oee"] }) {
  const overall = oee.availability * oee.performance * oee.quality;
  return (
    <div className="panel grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px overflow-hidden bg-border">
      <Cell label="OEE (shift)" value={`${(overall * 100).toFixed(1)}%`} accent />
      <Cell label="Availability" value={`${(oee.availability * 100).toFixed(1)}%`} />
      <Cell label="Performance" value={`${(oee.performance * 100).toFixed(1)}%`} />
      <Cell label="Quality" value={`${(oee.quality * 100).toFixed(1)}%`} />
      <Cell
        label="Reject · Throughput"
        value={
          <span className="flex items-baseline gap-2">
            <span className={oee.rejectPct > 1 ? "text-warn" : "text-foreground"}>
              {oee.rejectPct.toFixed(2)}%
            </span>
            <span className="text-foreground-dim text-sm">·</span>
            <span className="text-foreground-muted text-base font-normal">{oee.throughput} ppm</span>
          </span>
        }
      />
    </div>
  );
}

function Cell({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="bg-[hsl(var(--surface-1))] px-4 py-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-foreground-dim">{label}</div>
      <div
        className={`font-mono text-xl font-semibold mt-0.5 ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
