import { ComposedChart, Line, ResponsiveContainer, ReferenceArea, ReferenceLine, XAxis, YAxis, Tooltip } from "recharts";
import { THRESHOLDS } from "@/lib/quality";
import type { TrendPoint } from "@/lib/mock/tqi";

function Legend3({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block h-2 w-2 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

export function TqiTrendFull({ series }: { series: TrendPoint[] }) {
  return (
    <div className="panel p-4 flex flex-col h-[42vh]">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">TQI Trend — Full History</h3>
        <div className="flex items-center gap-3 text-[12px] uppercase tracking-wider text-foreground">
          <Legend3 color="hsl(var(--status-critical))" label={`Reject < ${THRESHOLDS.amber}`} />
          <Legend3 color="hsl(var(--status-warn))"     label={`Warn ≥ ${THRESHOLDS.amber}`} />
          <Legend3 color="hsl(var(--status-good))"     label={`Good ≥ ${THRESHOLDS.green}`} />
        </div>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 10, right: 16, bottom: 28, left: 4 }}>
            <ReferenceArea y1={0}               y2={THRESHOLDS.amber} fill="hsl(var(--status-critical))" fillOpacity={0.12} />
            <ReferenceArea y1={THRESHOLDS.amber} y2={THRESHOLDS.green} fill="hsl(var(--status-warn))"     fillOpacity={0.10} />
            <ReferenceArea y1={THRESHOLDS.green} y2={1}               fill="hsl(var(--status-good))"     fillOpacity={0.10} />
            <ReferenceLine y={THRESHOLDS.amber} stroke="hsl(var(--status-warn))" strokeDasharray="4 4" />
            <ReferenceLine y={THRESHOLDS.green} stroke="hsl(var(--status-good))" strokeDasharray="4 4" />
            <XAxis
              dataKey="ts"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
              tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              label={{ value: "Timestamp", position: "insideBottom", offset: -10, fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
              minTickGap={50}
            />
            <YAxis
              domain={[0, 1]}
              tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
              label={{ value: "Score", angle: -90, position: "insideLeft", fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v: number) => new Date(v).toLocaleTimeString()}
              formatter={(v: number) => v.toFixed(3)}
            />
            <Line type="monotone" dataKey="value" name="TQI" stroke="hsl(270 70% 65%)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
