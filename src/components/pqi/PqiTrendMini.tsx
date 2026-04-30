import { Line, ResponsiveContainer, ReferenceArea, ReferenceLine, YAxis, XAxis, ComposedChart, Tooltip } from "recharts";
import { THRESHOLDS } from "@/lib/quality";
import type { TrendPoint } from "@/lib/mock/pqi";

export function PqiTrendMini({ series }: { series: TrendPoint[] }) {
  return (
    <div className="panel p-4 h-[295px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold">PQI Trend</h3>
        <span className="text-[12px] font-mono text-foreground-muted">Last {series.length}</span>
      </div>
      <div className="flex items-center gap-3 text-[13px] uppercase tracking-wider mb-1.5">
        <span><span className="text-critical text-[20px]">● </span>Reject &lt; {THRESHOLDS.amber}</span>
        <span><span className="text-warn text-[20px]">●</span> Amber ≥ {THRESHOLDS.amber}</span>
        <span><span className="text-good text-[20px]">●</span> Green ≥ {THRESHOLDS.green}</span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
            <ReferenceArea y1={0} y2={THRESHOLDS.amber} fill="hsl(var(--status-critical))" fillOpacity={0.14} />
            <ReferenceArea y1={THRESHOLDS.amber} y2={THRESHOLDS.green} fill="hsl(var(--status-warn))" fillOpacity={0.12} />
            <ReferenceArea y1={THRESHOLDS.green} y2={1} fill="hsl(var(--status-good))" fillOpacity={0.12} />
            <ReferenceLine y={THRESHOLDS.amber} stroke="hsl(var(--status-warn))" strokeDasharray="3 3" strokeOpacity={0.7} />
            <ReferenceLine y={THRESHOLDS.green} stroke="hsl(var(--status-good))" strokeDasharray="3 3" strokeOpacity={0.7} />
            <YAxis domain={[0, 1]} hide />
            <XAxis dataKey="ts" hide />
            <Tooltip
              contentStyle={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v: number) => new Date(v).toLocaleTimeString()}
              formatter={(v: number) => v.toFixed(3)}
            />
            <Line type="monotone" dataKey="value" stroke="hsl(var(--status-good))" strokeWidth={1.75} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
