import { ComposedChart, Line, ResponsiveContainer, ReferenceLine, XAxis, YAxis, Tooltip, Legend } from "recharts";
import type { JawPoint } from "@/lib/mock/tqi";

const SIT = 108; // Start of Incipient Tack threshold

interface Props {
  series: JawPoint[];
  setpoint: number;
}

export function FrontJawChart({ series, setpoint }: Props) {
  const last = series[series.length - 1];
  const dev = last ? +(last.actual - setpoint).toFixed(1) : 0;
  const sign = dev >= 0 ? "+" : "";

  return (
    <div className="panel p-4 h-full flex flex-col">
      <div className="mb-2">
        <h3 className="text-[15px] font-semibold">Front Jaw — Temperature</h3>
        <p className="text-[12px] text-foreground-muted mt-0.5">
          Actual {last?.actual.toFixed(1)}°C · SP {setpoint}°C · Delta{sign}{dev}°C
        </p>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={series} margin={{ top: 32, right: 90, bottom: 28, left: 4 }}>
            <Legend verticalAlign="top" align="left" wrapperStyle={{ fontSize: 11, paddingBottom: 8 }} />
            <XAxis
              dataKey="ts"
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              label={{ value: "Timestamp", position: "insideBottom", offset: -8, fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
              minTickGap={40}
            />
            <YAxis
              domain={[setpoint - 8, setpoint + 8]}
              tick={{ fill: "hsl(var(--foreground-dim))", fontSize: 10 }}
              label={{ value: "Temp (°C)", angle: -90, position: "insideLeft", fill: "hsl(var(--foreground-dim))", fontSize: 11 }}
              stroke="hsl(var(--border))"
            />
            <Tooltip
              contentStyle={{ background: "hsl(var(--surface-3))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              labelFormatter={(v: number) => new Date(v).toLocaleTimeString()}
              formatter={(v: number) => `${v.toFixed(2)}°C`}
            />
            <ReferenceLine
              y={setpoint}
              stroke="hsl(200 80% 60%)"
              strokeDasharray="6 4"
              label={{ value: `SP ${setpoint}°C`, fill: "hsl(200 80% 60%)", fontSize: 10, position: "insideTopRight" }}
            />
            <ReferenceLine
              y={setpoint + 3}
              stroke="hsl(var(--status-warn))"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
              label={{ value: "+3°C warn", fill: "hsl(var(--status-warn))", fontSize: 9, position: "insideBottomRight" }}
            />
            <ReferenceLine
              y={setpoint - 3}
              stroke="hsl(var(--status-warn))"
              strokeDasharray="3 3"
              strokeOpacity={0.6}
            />
            <Line
              type="monotone"
              dataKey="actual"
              name="T_actual (°C)"
              stroke="hsl(200 80% 60%)"
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
