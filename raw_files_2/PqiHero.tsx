import { getQualityStatus, formatScore } from "@/lib/quality";
import { StatusPill } from "@/components/cockpit/StatusPill";

export function PqiHero({ score }: { score: number }) {
  const status = getQualityStatus(score);
  const colorVar =
    status === "good" ? "var(--status-good)" : status === "warn" ? "var(--status-warn)" : "var(--status-critical)";
  return (
    <div className="panel-raised relative overflow-hidden p-5">
      <div
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: `hsl(${colorVar})`, boxShadow: `0 0 16px hsl(${colorVar} / 0.5)` }}
      />
      <div className="text-[10px] uppercase tracking-[0.2em] text-foreground-dim">PQI</div>
      <div className="text-xs text-foreground-muted mt-0.5">Physics Quality Index</div>
      <div
        className="font-mono font-semibold leading-none ticker mt-3"
        style={{ color: `hsl(${colorVar})`, fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
      >
        {formatScore(score)}
      </div>
      <div className="mt-3">
        <StatusPill status={status} />
      </div>
    </div>
  );
}
