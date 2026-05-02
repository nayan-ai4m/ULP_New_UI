import {
  ComposedChart,
  Bar,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  XAxis,
  YAxis,
  Tooltip,
  Line,
} from "recharts";
import type { GradientPoint } from "@/lib/mock/tqi";

interface Props {
  series: GradientPoint[];
  nominal: number; // ideal delta °C
  tolerance: number; // ±°C
}

export function CrossGradientChart({ series, nominal, tolerance }: Props) {
  const last = series[series.length - 1];
  const domain: [number, number] = [
    0,
    Math.max(nominal + tolerance * 2 + 1, 8),
  ];

  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-[15px] font-semibold">Cross-Jaw Gradient</h3>
        <p className="text-[12px] text-foreground-muted mt-0.5">
          |Front − Rear| · Nominal {nominal}°C · Tolerance ±{tolerance}°C · Now{" "}
          {last?.delta.toFixed(1)}°C
        </p>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 0, right: 90, bottom: 28, left: 0 }}
          >
            <XAxis
              dataKey="ts"
              tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }}
              tickFormatter={(v) =>
                new Date(v).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
              label={{
                value: "Timestamp",
                position: "insideBottom",
                offset: -8,
                fill: "hsl(var(--foreground))",
                fontSize: 11,
              }}
              stroke="hsl(var(--border))"
              minTickGap={40}
            />
            <YAxis
              domain={domain}
              tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
              label={{
                value: "Delta Temp (°C)",
                angle: -90,
                offset: 29,
                position: "insideLeft",
                fill: "hsl(var(--foreground))",
                fontSize: 11,
              }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--surface-3))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(v: number) => new Date(v).toLocaleTimeString()}
              formatter={(v: number) => [`${v.toFixed(2)}°C`, "|Front − Rear|"]}
            />
            <ReferenceLine
              y={nominal}
              stroke="hsl(var(--status-good))"
              strokeDasharray="6 4"
              label={{
                value: `Nominal ${nominal}°C`,
                fill: "hsl(var(--status-good))",
                fontSize: 11,
                position: "right",
              }}
            />
            <ReferenceLine
              y={nominal - tolerance}
              stroke="hsl(var(--status-warn))"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
              label={{
                value: `+${tolerance}°C limit`,
                fill: "hsl(var(--status-warn))",
                fontSize: 11,
                position: "right",
              }}
            />
            <ReferenceLine
              y={nominal + tolerance}
              stroke="hsl(var(--status-warn))"
              strokeDasharray="3 3"
              strokeOpacity={0.7}
              label={{
                value: `+${tolerance}°C limit`,
                fill: "hsl(var(--status-warn))",
                fontSize: 11,
                position: "right",
              }}
            />
            <Line
              type="monotone"
              dataKey="delta"
              name="|Front − Rear| (°C)"
              stroke="hsl(28 90% 55%)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
