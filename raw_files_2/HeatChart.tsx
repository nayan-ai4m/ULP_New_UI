import { Area, AreaChart, ResponsiveContainer, ReferenceLine, XAxis, YAxis, Tooltip, Legend, Line, ComposedChart } from "recharts";
import type { HeatPoint } from "@/lib/mock/pqi";

interface Props {
  series: HeatPoint[];
  sitThreshold: number;
  tJawCurrent: number;
}

export function HeatChart({ series, sitThreshold, tJawCurrent }: Props) {
  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-sm font-semibold">Heat — SIT Profile</h3>
        <p className="text-[11px] text-foreground-muted mt-0.5">
          T_inner {series[series.length - 1]?.tInner.toFixed(1)}°C · SIT threshold {sitThreshold}°C · T_jaw {tJawCurrent}°C
        </p>
      </div>
      <div className="flex-1 min-h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 10, right: 16, bottom: 24, left: 4 }}>
            <defs>
              <linearGradient id="heatFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(28 90% 55%)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="hsl(28 90% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="t"
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              tickFormatter={(v) => v.toFixed(3)}
              label={{ value: "Time (s)", position: "insideBottom", offset: -10, fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <YAxis
              domain={[0, 160]}
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              label={{ value: "Temp (°C)", angle: -90, position: "insideLeft", fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v: number) => `t = ${v.toFixed(3)} s`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={sitThreshold} stroke="hsl(200 80% 60%)" strokeDasharray="4 4" label={{ value: `SIT ${sitThreshold}°C`, fill: "hsl(200 80% 60%)", fontSize: 10, position: "right" }} />
            <ReferenceLine y={tJawCurrent} stroke="hsl(var(--foreground-muted))" strokeDasharray="2 4" label={{ value: `T_jaw ${tJawCurrent}°C`, fill: "hsl(var(--foreground-muted))", fontSize: 10, position: "right" }} />
            <Area type="monotone" dataKey="tInner" name="T_inner (°C)" stroke="hsl(28 90% 55%)" strokeWidth={2} fill="url(#heatFill)" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
