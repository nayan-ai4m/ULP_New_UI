import { Area, AreaChart, ResponsiveContainer, ReferenceLine, YAxis, XAxis, Tooltip } from "recharts";
import { getQualityStatus, formatScore, THRESHOLDS } from "@/lib/quality";
import { StatusPill } from "./StatusPill";
import { useEffect, useRef, useState } from "react";
import type { TrendPoint } from "@/lib/mock/dashboard";

interface Props {
  title: string;
  subtitle: string;
  score: number;
  trend: TrendPoint[];
}

export function IndexCard({ title, subtitle, score, trend }: Props) {
  const status = getQualityStatus(score);
  const colorVar =
    status === "good" ? "var(--status-good)" : status === "warn" ? "var(--status-warn)" : "var(--status-critical)";

  // brief flash on score change
  const [flash, setFlash] = useState(false);
  const prev = useRef(score);
  useEffect(() => {
    if (prev.current !== score) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 500);
      prev.current = score;
      return () => clearTimeout(t);
    }
  }, [score]);

  return (
    <div className="panel-raised relative overflow-hidden p-5 lg:p-6 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4 items-stretch">
      {/* Status accent bar */}
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: `hsl(${colorVar})`, boxShadow: `0 0 16px hsl(${colorVar} / 0.5)` }}
      />

      {/* Left — score */}
      <div className="flex flex-col justify-between min-w-0">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-foreground-dim">{title}</div>
          <div className="text-sm text-foreground-muted mt-0.5 truncate">{subtitle}</div>
        </div>
        <div>
          <div
            className={`font-mono font-semibold leading-none ticker ${flash ? "animate-flash" : ""}`}
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
        <div className="flex items-center justify-between text-[11px] text-foreground-dim mb-1">
          <span className="uppercase tracking-wider">Last {trend.length}s</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="h-px w-3 bg-warn" /> ≥ {THRESHOLDS.amber}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-px w-3 bg-good" /> ≥ {THRESHOLDS.green}
            </span>
          </span>
        </div>
        <div className="flex-1 min-h-[110px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
              <defs>
                <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={`hsl(${colorVar})`} stopOpacity={0.45} />
                  <stop offset="100%" stopColor={`hsl(${colorVar})`} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis domain={[0, 1]} hide />
              <XAxis dataKey="ts" hide />
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
                labelFormatter={(ts) => new Date(ts as number).toLocaleTimeString()}
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
