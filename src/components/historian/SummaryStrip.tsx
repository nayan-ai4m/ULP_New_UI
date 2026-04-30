import type { GradeCounts } from "@/lib/mock/historian";

interface Props { counts: GradeCounts }

function pct(n: number, total: number) {
  if (total === 0) return "0%";
  return `${((n / total) * 100).toFixed(1)}%`;
}

function StatCard({
  label, value, subline, accentColor, textColor,
}: {
  label: string; value: number; subline: string;
  accentColor?: string; textColor?: string;
}) {
  return (
    <div className="panel p-4 relative overflow-hidden flex items-center gap-4">
      {accentColor && (
        <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)]" style={{ background: accentColor }} />
      )}
      <div className={accentColor ? "pl-3" : ""}>
        <div className="text-[10px] uppercase tracking-[0.15em] text-foreground-dim mb-1">{label}</div>
        <div className={`font-mono text-[28px] font-bold leading-none ${textColor ?? "text-foreground"}`}>
          {value.toLocaleString()}
        </div>
        <div className="text-[12px] text-foreground-muted mt-1">{subline}</div>
      </div>
    </div>
  );
}

export function SummaryStrip({ counts }: Props) {
  const { total, green, amber, red } = counts;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Total Records" value={total} subline="in selected range" />
      <StatCard
        label="Green — Pass"
        value={green}
        subline={pct(green, total)}
        accentColor="hsl(152 70% 48%)"
        textColor="text-good"
      />
      <StatCard
        label="Amber — Warn"
        value={amber}
        subline={pct(amber, total)}
        accentColor="hsl(38 92% 55%)"
        textColor="text-warn"
      />
      <StatCard
        label="Red — Reject"
        value={red}
        subline={pct(red, total)}
        accentColor="hsl(0 84% 62%)"
        textColor="text-critical"
      />
    </div>
  );
}
