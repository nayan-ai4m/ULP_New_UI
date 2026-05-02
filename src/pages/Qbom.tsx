import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQbomState } from "@/lib/mock/qbom";
import { SkuManagement } from "@/components/qbom/SkuManagement";
import { QbomSettings } from "@/components/qbom/QbomSettings";

type Tab = "sku" | "qbom";

const TABS: { id: Tab; label: string }[] = [
  { id: "sku", label: "SKU Management" },
  { id: "qbom", label: "Q-BOM Settings" },
];

const Qbom = () => {
  const qbom = useQbomState();
  const [tab, setTab] = useState<Tab>("sku");

  return (
    <>

      {/* Sub-tab bar */}
      <div className="border-b border-border bg-[hsl(var(--surface-1))]/60 px-5 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "relative px-4 py-2.5 text-sm transition-colors whitespace-nowrap",
                active
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <main className="flex-1 p-5 overflow-y-auto">
        {tab === "sku" && <SkuManagement state={qbom} />}
        {tab === "qbom" && <QbomSettings state={qbom} />}
      </main>

    </>
  );
};

export default Qbom;
