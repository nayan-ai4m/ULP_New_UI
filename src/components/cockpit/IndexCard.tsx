import { Area, AreaChart, ResponsiveContainer, ReferenceLine, YAxis, XAxis, Tooltip } from "recharts";
import { Clock } from "lucide-react";
import { getQualityStatus, formatScore, THRESHOLDS } from "@/lib/quality";
import { StatusPill } from "./StatusPill";
import type { TrendPoint } from "@/lib/mock/dashboard";

interface Props {
  title: string;
  score: number;
  trend: TrendPoint[];
  comingSoon?: boolean;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const Y_TICKS = [0, 0.6, 0.75, 1];

export function IndexCard({ title, score, trend, comingSoon }: Props) {
  const status = getQualityStatus(score);
  const colorVar =
    status === "good" ? "var(--status-good)" : status === "warn" ? "var(--status-warn)" : "var(--status-critical)";

  if (comingSoon) {
    return (
      <div className="panel-raised relative overflow-hidden p-5 lg:p-6 flex items-center gap-6" style={{ minHeight: "181px" }}>
        <div className="absolute left-0 top-0 h-full w-1 bg-[hsl(var(--surface-3))]" />
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-[hsl(var(--surface-2))]">
          <Clock className="h-12 w-12 text-foreground-dim" />
        </div>
        <div>
          <div className="text-[20px] uppercase tracking-[0.2em] text-foreground-muted">{title}</div>
          <div className="mt-2 text-[15px] text-foreground-muted leading-snug">
            Under development
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-raised relative overflow-hidden p-5 lg:p-6 grid grid-cols-[auto_minmax(0,1fr)] gap-4 items-stretch">
      {/* Status accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: `hsl(${colorVar})`, boxShadow: `0 0 16px hsl(${colorVar} / 0.5)` }}
      />

      {/* Left — score */}
      <div className="flex flex-col justify-between min-w-0">
        <div>
          <div className="text-[15px] uppercase tracking-[0.2em] text-white">{title}</div>
        </div>
        <div>
          <div
            className="font-mono font-semibold leading-none ticker"
            style={{ color: `hsl(${colorVar})`, fontSize: "clamp(2.75rem, 6vw, 4.75rem)" }}
          >
            {formatScore(score)}
          </div>
          <div className="mt-3">
            <StatusPill status={status} />
          </div>
        </div>
      </div>

      {/* Right — sparkline trend */}
      <div className="min-w-0 flex flex-col">
        <div className="flex items-center justify-between text-[13px] text-foreground mb-1">
          <span className="uppercase tracking-wider">Last {trend.length}s</span>
          <span className="flex gap-2 items-center">
            <span><span className="text-critical text-[20px]">● </span>Reject &lt; {THRESHOLDS.amber}</span>
            <span><span className="text-warn text-[20px]">●</span> Amber ≥ {THRESHOLDS.amber}</span>
            <span><span className="text-good text-[20px]">●</span> Green ≥ {THRESHOLDS.green}</span>
          </span>
        </div>
        <div className="flex-1 min-h-[144px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 12, bottom: 20, left: 8 }}>
              <defs>
                <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`hsl(${colorVar})`} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={`hsl(${colorVar})`} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis
                domain={[0, 1]}
                ticks={Y_TICKS}
                tickFormatter={(v: number) => v.toFixed(2)}
                width={36}
                tick={{ fill: "hsl(215 12% 50%)", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
                axisLine={{ stroke: "hsl(215 25% 22%)" }}
                tickLine={{ stroke: "hsl(215 25% 22%)" }}
              />
              <XAxis
                dataKey="ts"
                tickFormatter={formatTime}
                interval="preserveStartEnd"
                minTickGap={60}
                tick={{ fill: "hsl(215 12% 50%)", fontSize: 9, fontFamily: "JetBrains Mono, monospace" }}
                axisLine={{ stroke: "hsl(215 25% 22%)" }}
                tickLine={{ stroke: "hsl(215 25% 22%)" }}
                label={{ value: "Time", position: "insideBottomRight", offset: -4, fill: "hsl(215 12% 42%)", fontSize: 9 }}
              />
              <ReferenceLine y={THRESHOLDS.amber} stroke="hsl(var(--status-warn))" strokeDasharray="3 3" strokeOpacity={0.5} />
              <ReferenceLine y={THRESHOLDS.green} stroke="hsl(var(--status-good))" strokeDasharray="3 3" strokeOpacity={0.5} />
              <Tooltip
                cursor={{ stroke: "hsl(var(--foreground-dim))", strokeDasharray: "2 2" }}
                contentStyle={{
                  background: "hsl(var(--surface-3))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                  padding: "6px 10px",
                }}
                labelFormatter={(ts: number) => new Date(ts).toLocaleTimeString()}
                formatter={(v: number) => [v.toFixed(3), title]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={`hsl(${colorVar})`}
                strokeWidth={2}
                fill={`url(#g-${title})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
