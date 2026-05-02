import {
  Area,
  AreaChart,
  ResponsiveContainer,
  ReferenceLine,
  YAxis,
  XAxis,
  Tooltip,
} from "recharts";
import { Clock } from "lucide-react";
import { getQualityStatus, formatScore, THRESHOLDS } from "@/lib/quality";
import { StatusPill } from "./StatusPill";
import type { TrendPoint } from "@/lib/mock/dashboard";

interface Props {
  title: string;
  /** Score 0..1, or undefined when data is pending. */
  score: number | undefined;
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
  const status = score != null ? getQualityStatus(score) : "warn";
  const colorVar =
    status === "good"
      ? "var(--status-good)"
      : status === "warn"
        ? "var(--status-warn)"
        : "var(--status-critical)";
  const displayScore = score != null ? formatScore(score) : "—";

  if (comingSoon) {
    return (
      <div
        className="panel-raised relative overflow-hidden p-5 lg:p-6 flex items-center gap-6"
        style={{ minHeight: "181px" }}
      >
        <div className="absolute left-0 top-0 h-full w-1 bg-[hsl(var(--surface-3))]" />
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-border bg-[hsl(var(--surface-2))]">
          <Clock className="h-12 w-12 text-foreground-dim" />
        </div>
        <div>
          <div className="text-[20px] uppercase tracking-[0.2em] text-foreground-muted">
            {title}
          </div>
          <div className="mt-2 text-[15px] text-foreground-muted leading-snug">
            Under development
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-raised relative overflow-hidden px-5 lg:px-6 py-5 lg:py-6 grid grid-cols-[auto_minmax(0,1fr)] gap-4 items-stretch">
      {/* Status accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{
          background: `hsl(${colorVar})`,
          boxShadow: `0 0 16px hsl(${colorVar} / 0.5)`,
        }}
      />

      {/* Left — score */}
      <div className="flex flex-col items-between min-w-0 gap-10">
        <div className="">
          <div className="text-[15px] uppercase tracking-[0.2em] text-white">
            {title}
          </div>
        </div>
        <div className="">
          <div
            className="font-mono font-semibold leading-none ticker"
            style={{
              color: `hsl(${colorVar})`,
              fontSize: "clamp(2.75rem, 6vw, 4.75rem)",
            }}
          >
            {displayScore}
          </div>
          <div className="mt-3">
            <StatusPill status={status} />
          </div>
        </div>
      </div>

      {/* Right — sparkline trend */}
      <div className="min-w-0 flex flex-col h-[100%]">
        <div className="absolute flex top-0 right-8 gap-3 text-[13px] text-foreground mb-1">
          <span className="flex gap-2 items-end">
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
            {/* <span className="uppercase tracking-wider text-[13px]">
              Last {trend.length}s
            </span> */}
          </span>
        </div>
        <div className="flex-1 min-h-[144px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} className="mx-2 border border-transparent">
              <defs>
                <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={`hsl(${colorVar})`}
                    stopOpacity={0.45}
                  />
                  <stop
                    offset="100%"
                    stopColor={`hsl(${colorVar})`}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <YAxis
                domain={[0, 1]}
                ticks={Y_TICKS}
                interval={0}
                tickFormatter={(v: number) => v.toFixed(2)}
                width={36}
                tick={{
                  fill: "hsla(0, 0%, 100%, 1.00)",
                  fontSize: 12,
                  // fontFamily: "JetBrains Mono, monospace",
                }}
                axisLine={{ stroke: "hsl(215 25% 22%)" }}
                tickLine={{ stroke: "hsl(215 25% 22%)" }}
                label={{
                  value: "Index",
                  angle: -90,
                  position: "insideLeft",
                  offset: -6,
                  fill: "hsla(0, 0%, 100%, 1.00)",
                  fontSize: 12,
                }}
              />
              <XAxis
                dataKey="ts"
                tickFormatter={formatTime}
                minTickGap={60}
                tick={{
                  fill: "hsla(0, 0%, 100%, 1.00)",
                  fontSize: 12,
                  // fontFamily: "JetBrains Mono, monospace",
                }}
                axisLine={{ stroke: "hsl(215 25% 22%)" }}
                tickLine={{ stroke: "hsl(215 25% 22%)" }}
                label={{
                  value: "Time",
                  position: "insideBottomRight",
                  offset: -4,
                  fill: "hsla(0, 0%, 100%, 1.00)",
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={THRESHOLDS.amber}
                stroke="hsl(var(--status-warn))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={THRESHOLDS.green}
                stroke="hsl(var(--status-good))"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <Tooltip
                cursor={{
                  stroke: "hsl(var(--foreground-dim))",
                  strokeDasharray: "2 2",
                }}
                contentStyle={{
                  background: "hsl(var(--surface-3))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                  padding: "6px 10px",
                }}
                labelFormatter={(ts: number) =>
                  new Date(ts).toLocaleTimeString()
                }
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
