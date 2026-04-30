import { Plus, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QbomState } from "@/lib/mock/qbom";

interface Props { state: QbomState }

function LayerPill({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-[hsl(var(--surface-3))] text-foreground-muted border border-border">
      {label}
    </span>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-[11px] uppercase tracking-[0.12em] text-foreground-dim">{label}</span>
      <span className="font-mono text-[12px] text-foreground">{value}</span>
    </div>
  );
}

export function SkuManagement({ state }: Props) {
  const { skus, applySkuToMachine } = state;

  return (
    <div className="flex flex-col gap-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">SKU Management</h2>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--radius)] bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 transition-opacity">
          <Plus className="h-3.5 w-3.5" />
          New SKU
        </button>
      </div>

      {/* SKU card grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {skus.map((sku) => (
          <div key={sku.id} className="panel p-5 flex flex-col gap-4 relative overflow-hidden">
            {/* Cyan accent bar */}
            <span className="absolute left-0 top-0 h-full w-1 rounded-l-[var(--radius)] bg-primary" />

            {/* Card header */}
            <div className="flex items-start justify-between pl-3">
              <div>
                <div className="font-mono text-[18px] font-bold text-foreground">{sku.id}</div>
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {sku.layerMaterial.split("/").map((l) => (
                    <LayerPill key={l} label={l} />
                  ))}
                </div>
              </div>
              {sku.isActive ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold
                                 bg-[hsl(var(--status-good)/0.15)] text-good border border-[hsl(var(--status-good)/0.3)]">
                  <span className="status-dot bg-good animate-pulse-soft" />
                  Active
                </span>
              ) : (
                <button
                  onClick={() => applySkuToMachine(sku.id)}
                  className="px-3 py-1 rounded-full text-[11px] font-semibold border border-primary text-primary
                             hover:bg-primary/10 transition-colors"
                >
                  Apply
                </button>
              )}
            </div>

            {/* Meta rows */}
            <div className="pl-3">
              <MetaRow label="Barcode" value={sku.barcodeNo} />
              <MetaRow label="Supplier" value={sku.supplier} />
              <MetaRow label="GSM" value={sku.gsm !== null ? String(sku.gsm) : "—"} />
              <MetaRow label="Vol. No." value={sku.volumeNo ?? "—"} />
            </div>

            {/* Edit button */}
            <div className="pl-3 flex justify-end">
              <button className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius)] text-[12px]",
                "border border-border text-foreground-muted hover:text-foreground hover:border-primary/50 transition-colors",
              )}>
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
