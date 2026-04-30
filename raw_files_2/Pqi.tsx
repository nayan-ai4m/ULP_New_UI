import { useLiveDashboard } from "@/lib/mock/dashboard";
import { useLivePqi } from "@/lib/mock/pqi";
import { TopBar } from "@/components/cockpit/TopBar";
import { PqiHero } from "@/components/pqi/PqiHero";
import { WeightedContribution } from "@/components/pqi/WeightedContribution";
import { HeatChart } from "@/components/pqi/HeatChart";
import { PressureChart } from "@/components/pqi/PressureChart";
import { DwellTrendChart } from "@/components/pqi/DwellTrendChart";
import { TailingIndexChart } from "@/components/pqi/TailingIndexChart";
import { PqiTrendMini } from "@/components/pqi/PqiTrendMini";
import { RawTailingIndex } from "@/components/pqi/RawTailingIndex";

const Pqi = () => {
  const dash = useLiveDashboard();
  const pqi = useLivePqi();

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar machine={dash.machine} />

      <main className="flex-1 grid gap-4 p-4 lg:p-5 grid-cols-12">
        {/* Left rail */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <PqiHero score={pqi.pqi} />
          <WeightedContribution items={pqi.weighted} pqi={pqi.pqi} />
          <PqiTrendMini series={pqi.pqiTrend} />
          <RawTailingIndex value={pqi.rawTailing} />
        </aside>

        {/* Main grid */}
        <section className="col-span-12 xl:col-span-9 flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <HeatChart series={pqi.heat.series} sitThreshold={pqi.heat.sitThreshold} tJawCurrent={pqi.heat.tJawCurrent} />
            <PressureChart
              series={pqi.pressure.series}
              sealStartDeg={pqi.pressure.sealStartDeg}
              sealEndDeg={pqi.pressure.sealEndDeg}
              pressureAvg={pqi.pressure.pressureAvg}
            />
            <DwellTrendChart series={pqi.dwell.series} targetMs={pqi.dwell.targetMs} />
          </div>
          <TailingIndexChart series={pqi.tailing} />
        </section>
      </main>

      <footer className="border-t border-border px-5 py-2 flex flex-wrap items-center justify-between text-[11px] text-foreground-dim">
        <span>Dark Cascade Framework · AI4M-FRS-2604-001 · Edge AI Gateway</span>
        <span className="font-mono">Cerebro broker :5555 ● online · QuestDB ● ok · TimescaleDB ● ok</span>
      </footer>
    </div>
  );
};

export default Pqi;
