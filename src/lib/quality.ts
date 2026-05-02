// FRS-locked thresholds. Do not change without updating the spec.
export const THRESHOLDS = {
  green: 0.75,
  amber: 0.6,
} as const;

export type QualityStatus = "good" | "warn" | "critical";

export function getQualityStatus(score: number): QualityStatus {
  if (score >= THRESHOLDS.green) return "good";
  if (score >= THRESHOLDS.amber) return "warn";
  return "critical";
}

export const STATUS_LABEL: Record<QualityStatus, string> = {
  good: "Good",
  warn: "Warning",
  critical: "Critical",
};

export function formatScore(n: number): string {
  return n.toFixed(2);
}
