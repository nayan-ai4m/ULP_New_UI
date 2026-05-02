import {
  Line,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  YAxis,
  XAxis,
  ComposedChart,
  Tooltip,
} from "recharts";
import { THRESHOLDS } from "@/lib/quality";
import type { TrendPoint } from "@/lib/mock/pqi";

export function PqiTrendMini({ series }: { series: TrendPoint[] }) {
  return (
    <div className="panel p-4 h-[290px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold">PQI Trend</h3>
        <span className="text-[12px] text-foreground">
          Last {series.length}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[13px] uppercase tracking-wider mb-1.5">
        <span>
          <span className="text-critical text-[20px]">● </span>Critical &lt;{" "}
          {THRESHOLDS.amber}
        </span>
        <span>
          <span className="text-warn text-[20px]">●</span> Warning ≥{" "}
          {THRESHOLDS.amber}
        </span>
        <span>
          <span className="text-good text-[20px]">●</span> Good ≥{" "}
          {THRESHOLDS.green}
        </span>
      </div>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 4, right: 12, bottom: 24, left: 8 }}
          >
            <ReferenceArea
              y1={0}
              y2={THRESHOLDS.amber}
              fill="hsl(var(--status-critical))"
              fillOpacity={0.14}
            />
            <ReferenceArea
              y1={THRESHOLDS.amber}
              y2={THRESHOLDS.green}
              fill="hsl(var(--status-warn))"
              fillOpacity={0.12}
            />
            <ReferenceArea
              y1={THRESHOLDS.green}
              y2={1}
              fill="hsl(var(--status-good))"
              fillOpacity={0.12}
            />
            <ReferenceLine
              y={THRESHOLDS.amber}
              stroke="hsl(var(--status-warn))"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />
            <ReferenceLine
              y={THRESHOLDS.green}
              stroke="hsl(var(--status-good))"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.6, 0.75, 1.0]}
              tickFormatter={(v: number) => v.toFixed(2)}
              tick={{
                fill: "hsl(210 30% 92%)",
                fontSize: 10,
              }}
              axisLine={{ stroke: "hsl(215 25% 22%)" }}
              tickLine={{ stroke: "hsl(215 25% 22%)" }}
              width={36}
              label={{
                value: "Score",
                angle: -90,
                position: "insideLeft",
                offset: -3,
                fill: "hsla(0, 0%, 100%, 1.00)",
                fontSize: 12,
              }}
            />
            <XAxis
              dataKey="ts"
              tickFormatter={(v: number) =>
                new Date(v).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
              tick={{
                fill: "hsl(210 30% 92%)",
                fontSize: 10,
                // fontFamily: "JetBrains Mono, monospace",
              }}
              axisLine={{ stroke: "hsl(215 25% 22%)" }}
              tickLine={{ stroke: "hsl(215 25% 22%)" }}
              minTickGap={40}
              label={{
                value: "Time",
                position: "insideBottomRight",
                offset: -4,
                fill: "hsla(0, 0%, 100%, 1.00)",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--surface-3))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v: number) => new Date(v).toLocaleTimeString()}
              formatter={(v: number) => v.toFixed(3)}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--status-good))"
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
