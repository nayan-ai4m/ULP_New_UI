import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QbomState, QbomStatus } from "@/lib/mock/qbom";
import { QbomWizard } from "./QbomWizard";

interface Props { state: QbomState }

type Filter = "All" | QbomStatus;

const FILTERS: Filter[] = ["All", "Active", "Draft", "Archived"];

function StatusBadge({ status }: { status: QbomStatus }) {
  const styles: Record<QbomStatus, string> = {
    Active:   "bg-[hsl(var(--status-good)/0.15)] text-good border-[hsl(var(--status-good)/0.3)]",
    Draft:    "bg-primary/10 text-primary border-primary/30",
    Archived: "bg-[hsl(var(--surface-3))] text-foreground-dim border-border",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", styles[status])}>
      {status}
    </span>
  );
}

export function QbomSettings({ state }: Props) {
  const { skus, versions, activeSku, setActiveSku, activateVersion, archiveVersion, addVersion } = state;
  const [filter, setFilter] = useState<Filter>("All");
  const [wizardOpen, setWizardOpen] = useState(false);

  const filtered = versions.filter((v) =>
    v.skuId === activeSku && (filter === "All" || v.status === filter),
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* SKU selector */}
        <div className="flex items-center gap-3">
          <span className="text-[12px] uppercase tracking-[0.15em] text-foreground-muted font-medium">SKU</span>
          <div className="relative">
            <select
              value={activeSku}
              onChange={(e) => setActiveSku(e.target.value)}
              className="appearance-none rounded-[var(--radius)] border border-border
                         bg-[hsl(var(--surface-2))] pl-3 pr-8 py-1.5
                         font-mono text-[13px] text-foreground
                         focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {skus.map((s) => (
                <option key={s.id} value={s.id}>{s.id} ({s.id})</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-dim" />
          </div>
        </div>

        {/* Filter pills + New Q-BOM */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[hsl(var(--surface-2))] border border-border rounded-[var(--radius)] p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-[calc(var(--radius)-2px)] text-[12px] font-medium transition-colors",
                  filter === f
                    ? "bg-primary/15 text-primary"
                    : "text-foreground-muted hover:text-foreground",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setWizardOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" />
            New Q-BOM
          </button>
        </div>
      </div>

      {/* Version table */}
      <div className="panel overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_120px_100px_140px_120px_1fr] gap-4 px-5 py-3 border-b border-border bg-[hsl(var(--surface-2))]">
          {["Version", "Status", "V. Seal Temp", "H. Seal Front / Back", "Modified", "Actions"].map((h) => (
            <span key={h} className="text-[10px] uppercase tracking-[0.14em] text-foreground-dim font-semibold">{h}</span>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-[13px] text-foreground-muted">
            No Q-BOM versions match the current filter.
          </div>
        ) : (
          filtered.map((v) => (
            <div
              key={v.id}
              className={cn(
                "grid grid-cols-[auto_120px_100px_140px_120px_1fr] gap-4 px-5 py-3.5 border-b border-border/50 last:border-0 items-center transition-colors",
                v.status === "Active"   && "bg-[hsl(var(--status-good)/0.04)] border-l-2 border-l-[hsl(var(--status-good)/0.5)]",
                v.status === "Draft"    && "bg-primary/[0.02]",
                v.status === "Archived" && "opacity-50",
              )}
            >
              <span className="font-mono text-[13px] text-foreground">{v.version}</span>
              <StatusBadge status={v.status} />
              <span className="font-mono text-[13px] text-foreground">{v.vSealTemp}°C</span>
              <span className="font-mono text-[13px] text-foreground">{v.hSealFront}°C / {v.hSealBack}°C</span>
              <span className="text-[12px] text-foreground-muted">{v.modified}</span>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {v.status === "Draft" && (
                  <>
                    <button className="px-3 py-1 rounded-[var(--radius)] text-[12px] border border-primary text-primary hover:bg-primary/10 transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => activateVersion(v.id)}
                      className="px-3 py-1 rounded-[var(--radius)] text-[12px] bg-good text-white hover:opacity-90 transition-opacity font-semibold"
                    >
                      Activate
                    </button>
                  </>
                )}
                {v.status === "Active" && (
                  <button
                    onClick={() => archiveVersion(v.id)}
                    className="px-3 py-1 rounded-[var(--radius)] text-[12px] border border-[hsl(var(--status-warn)/0.5)] text-warn hover:bg-[hsl(var(--status-warn)/0.1)] transition-colors"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {wizardOpen && (
        <QbomWizard
          skuId={activeSku}
          onClose={() => setWizardOpen(false)}
          onSave={addVersion}
        />
      )}
    </div>
  );
}
