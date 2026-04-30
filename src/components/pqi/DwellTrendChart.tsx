import { ComposedChart, Line, ResponsiveContainer, ReferenceLine, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { DwellPoint } from "@/lib/mock/pqi";

interface Props {
  series: DwellPoint[];
  targetMs: number;
}

export function DwellTrendChart({ series, targetMs }: Props) {
  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-[15px] font-semibold">Dwell Time — Trend</h3>
        <p className="text-[13px] text-foreground-muted mt-0.5">Target {targetMs} ms</p>
      </div>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 32, right: 90, bottom: 28, left: 4 }}>
            <Legend
              verticalAlign="top"
              align="left"
              wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
            />
            <XAxis
              dataKey="ts"
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              label={{ value: "Timestamp", position: "insideBottom", offset: -8, fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
              minTickGap={40}
            />
            <YAxis
              domain={[170, 235]}
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              label={{ value: "Dwell (ms)", angle: -90, position: "insideLeft", fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v: number) => new Date(v).toLocaleTimeString()}
            />
            <ReferenceLine
              y={targetMs}
              stroke="hsl(200 80% 60%)"
              strokeDasharray="6 4"
              label={{ value: `target ${targetMs} ms`, fill: "hsl(200 80% 60%)", fontSize: 10, position: "insideTopRight" }}
            />
            <Line
              type="monotone"
              dataKey="dwellMs"
              name="Dwell (ms) per Timestamp"
              stroke="hsl(var(--status-warn))"
              strokeWidth={2}
              dot={{ r: 2, fill: "hsl(var(--status-good))" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
