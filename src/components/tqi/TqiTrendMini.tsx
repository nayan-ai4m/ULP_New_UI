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
import type { TrendPoint } from "@/lib/mock/tqi";

export function TqiTrendMini({ series }: { series: TrendPoint[] }) {
  return (
    <div className="panel p-4 h-[430px]">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-[15px] font-semibold">TQI Trend</h3>
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
      <div className="h-[350px]">
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
              // label={{
              //   value: "0.60",
              //   position: "right",
              //   fill: "hsl(38 92% 55%)",
              //   fontSize: 10,
              //   fontFamily: "JetBrains Mono, monospace",
              // }}
            />
            <ReferenceLine
              y={THRESHOLDS.green}
              stroke="hsl(var(--status-good))"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
              // label={{
              //   value: "0.75",
              //   position: "right",
              //   fill: "hsl(152 70% 48%)",
              //   fontSize: 10,
              //   fontFamily: "JetBrains Mono, monospace",
              // }}
            />
            <YAxis
              domain={[0, 1]}
              ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
              tickFormatter={(v: number) => v.toFixed(2)}
              tick={{
                fill: "hsl(210 30% 92%)",
                fontSize: 10,
                // fontFamily: "JetBrains Mono, monospace",
              }}
              axisLine={{ stroke: "hsl(215 25% 22%)" }}
              tickLine={{ stroke: "hsl(215 25% 22%)" }}
              width={36}
              label={{
                value: "Score",
                angle: -90,
                position: "insideLeft",
                // offset: 9,
                fill: "hsla(0, 0%, 100%, 1.00)",
                fontSize: 10,
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
                fontSize: 10,
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
