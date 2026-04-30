import { getQualityStatus, formatScore, THRESHOLDS } from "@/lib/quality";
import { StatusPill } from "@/components/cockpit/StatusPill";

export function RawTailingIndex({ value }: { value: number }) {
  const status = getQualityStatus(value);
  const colorVar =
    status === "good" ? "var(--status-good)" : status === "warn" ? "var(--status-warn)" : "var(--status-critical)";
  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Raw Tailing Index</h3>
        <StatusPill status={status} />
      </div>
      <div
        className="font-mono font-semibold leading-none ticker"
        style={{ color: `hsl(${colorVar})`, fontSize: "clamp(2rem, 4vw, 3rem)" }}
      >
        {formatScore(value)}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] uppercase tracking-wider">
        <span className="text-critical">● Reject &lt; {THRESHOLDS.amber}</span>
        <span className="text-warn">● Amber ≥ {THRESHOLDS.amber}</span>
        <span className="text-good">● Green ≥ {THRESHOLDS.green}</span>
      </div>
    </div>
  );
}
