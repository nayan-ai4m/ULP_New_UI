import { ComposedChart, Line, ResponsiveContainer, ReferenceArea, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { PressurePoint } from "@/lib/mock/pqi";

interface Props {
  series: PressurePoint[];
  sealStartDeg: number;
  sealEndDeg: number;
  pressureAvg: number;
}

export function PressureChart({ series, sealStartDeg, sealEndDeg, pressureAvg }: Props) {
  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-sm font-semibold">Pressure — Position &amp; Pressure</h3>
        <p className="text-[11px] text-foreground-muted mt-0.5">
          Sealing Duration {sealStartDeg}°–{sealEndDeg}° · avg {pressureAvg.toFixed(1)}
        </p>
      </div>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 10, right: 50, bottom: 24, left: 4 }}>
            <XAxis
              dataKey="camDeg"
              type="number"
              domain={[0, 360]}
              ticks={[0, 60, 120, 180, 240, 300, 360]}
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              label={{ value: "Cam Degree (°)", position: "insideBottom", offset: -10, fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="pos"
              domain={[0, 125]}
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              label={{ value: "Position", angle: -90, position: "insideLeft", fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              yAxisId="press"
              orientation="right"
              domain={[0, 750]}
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              label={{ value: "Pressure", angle: 90, position: "insideRight", fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v: number) => `${v}°`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceArea
              yAxisId="press"
              x1={sealStartDeg}
              x2={sealEndDeg}
              fill="hsl(var(--status-warn))"
              fillOpacity={0.08}
              stroke="hsl(var(--status-warn))"
              strokeOpacity={0.3}
              label={{ value: `Sealing Duration ${sealStartDeg}°–${sealEndDeg}°`, fill: "hsl(var(--status-warn))", fontSize: 10, position: "insideTop" }}
            />
            <Line yAxisId="pos" type="monotone" dataKey="position" name="Position" stroke="hsl(200 80% 60%)" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line yAxisId="press" type="monotone" dataKey="pressure" name="Pressure" stroke="hsl(28 90% 55%)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
