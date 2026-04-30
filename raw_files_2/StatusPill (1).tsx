import { cn } from "@/lib/utils";
import { getQualityStatus, STATUS_LABEL, type QualityStatus } from "@/lib/quality";

interface Props {
  score?: number;
  status?: QualityStatus;
  label?: string;
  className?: string;
  withDot?: boolean;
}

export function StatusPill({ score, status, label, className, withDot = true }: Props) {
  const s: QualityStatus = status ?? (score !== undefined ? getQualityStatus(score) : "good");
  const cls =
    s === "good"
      ? "bg-good-soft text-good border-good"
      : s === "warn"
      ? "bg-warn-soft text-warn border-warn"
      : "bg-critical-soft text-critical border-critical";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        cls,
        className,
      )}
    >
      {withDot && (
        <span
          className={cn(
            "status-dot",
            s === "good" && "bg-good",
            s === "warn" && "bg-warn",
            s === "critical" && "bg-critical animate-pulse-soft",
          )}
        />
      )}
      {label ?? STATUS_LABEL[s]}
    </span>
  );
}
