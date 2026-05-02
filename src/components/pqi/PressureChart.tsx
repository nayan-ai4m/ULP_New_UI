import {
  ComposedChart,
  Line,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { PressurePoint } from "@/lib/mock/pqi";

interface Props {
  series: PressurePoint[];
  sealStartDeg: number;
  sealEndDeg: number;
  pressureAvg: number;
  torqueTarget?: number;
}

export function PressureChart({
  series,
  sealStartDeg,
  sealEndDeg,
  pressureAvg,
  torqueTarget = 500,
}: Props) {
  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-sm font-semibold">
          Pressure — Position &amp; Pressure
        </h3>
        <p className="text-[13px] text-foreground-muted mt-0.5">
          Seal {sealStartDeg}°–{sealEndDeg}° · avg {pressureAvg.toFixed(1)}
        </p>
      </div>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={series}
            margin={{ top: 32, right: 60, bottom: 28, left: 4 }}
          >
            <XAxis
              dataKey="camDeg"
              type="number"
              domain={[0, 360]}
              ticks={[0, 60, 120, 180, 240, 300, 360]}
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              label={{
                value: "Cam Degree (°)",
                position: "insideBottom",
                offset: -10,
                fill: "hsl(var(--foreground-dim))",
                fontSize: 11,
              }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="pos"
              domain={["auto", "auto"]}
              tick={{ fill: "hsl(200 80% 60%)", fontSize: 10 }}
              label={{
                value: "Position",
                angle: -90,
                position: "insideLeft",
                fill: "hsl(200 80% 60%)",
                fontSize: 11,
              }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="press"
              orientation="right"
              domain={["auto", "auto"]}
              tick={{ fill: "hsl(28 90% 55%)", fontSize: 10 }}
              label={{
                value: "Pressure",
                angle: 90,
                offset: 20,
                position: "insideRight",
                fill: "hsl(28 90% 55%)",
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
              labelFormatter={(v: number) => `${v}°`}
            />
            <Legend
              verticalAlign="top"
              align="left"
              wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
            />
            {/* Sealing band highlight */}
            <ReferenceArea
              yAxisId="press"
              x1={sealStartDeg}
              x2={sealEndDeg}
              fill="hsl(var(--status-warn))"
              fillOpacity={0.08}
              stroke="hsl(var(--status-warn))"
              strokeOpacity={0.3}
              label={{
                value: `Sealing Duration ${sealStartDeg}°–${sealEndDeg}°`,
                fill: "hsl(var(--status-warn))",
                fontSize: 10,
                position: "insideTop",
              }}
            />
            {/* Avg torque reference line */}
            <ReferenceLine
              yAxisId="press"
              y={pressureAvg}
              stroke="hsl(28 90% 55%)"
              strokeDasharray="6 4"
              strokeOpacity={0.7}
              label={{
                value: `avg ${pressureAvg.toFixed(1)}`,
                fill: "hsl(28 90% 55%)",
                fontSize: 10,
                // offset: 10,
                position: "right",
              }}
            />
            {/* Torque target reference line */}
            <ReferenceLine
              yAxisId="press"
              y={torqueTarget}
              stroke="hsl(200 80% 60%)"
              strokeDasharray="6 4"
              strokeOpacity={0.7}
              label={{
                value: `target ${torqueTarget}`,
                fill: "hsl(200 80% 60%)",
                fontSize: 10,
                position: "right",
              }}
            />
            <Line
              yAxisId="pos"
              type="monotone"
              dataKey="position"
              name="Position"
              stroke="hsl(200 80% 60%)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="press"
              type="monotone"
              dataKey="pressure"
              name="Pressure"
              stroke="hsl(28 90% 55%)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
