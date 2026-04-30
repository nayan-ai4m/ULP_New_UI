import { useLiveDashboard } from "@/lib/mock/dashboard";
import { useLiveTqi } from "@/lib/mock/tqi";
import { TopBar } from "@/components/cockpit/TopBar";
import { CameraTile } from "@/components/cockpit/CameraTile";
import { TqiHero } from "@/components/tqi/TqiHero";
import { ThermalBreakdown } from "@/components/tqi/ThermalBreakdown";
import { TqiTrendMini } from "@/components/tqi/TqiTrendMini";
import { JawReadings } from "@/components/tqi/JawReadings";
import { FrontJawChart } from "@/components/tqi/FrontJawChart";
import { RearJawChart } from "@/components/tqi/RearJawChart";
import { CrossGradientChart } from "@/components/tqi/CrossGradientChart";
import { TqiTrendFull } from "@/components/tqi/TqiTrendFull";

const Tqi = () => {
  const dash = useLiveDashboard();
  const tqi = useLiveTqi();

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar machine={dash.machine} />

      <main className="flex-1 grid gap-4 p-4 lg:p-5 grid-cols-12">
        {/* Left rail */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-4">
          <TqiHero score={tqi.tqi} />
          <ThermalBreakdown components={tqi.components} tqi={tqi.tqi} />
          <TqiTrendMini series={tqi.tqiTrend} />
          {/* <JawReadings components={tqi.components} /> */}
        </aside>

        {/* Main grid */}
        <section className="col-span-12 xl:col-span-9 flex flex-col gap-4">
          {/* Row 1 — thermal camera tiles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[42vh]">
            <CameraTile name="Thermal Camera 1" />
            <CameraTile name="Thermal Camera 2" />
          </div>

          {/* Row 2 — jaw temperature charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[40vh]">
            <FrontJawChart series={tqi.front.series} setpoint={tqi.front.setpoint} />
            <RearJawChart series={tqi.rear.series} setpoint={tqi.rear.setpoint} />
            <CrossGradientChart
              series={tqi.gradient.series}
              nominal={tqi.gradient.nominal}
              tolerance={tqi.gradient.tolerance}
            />
          </div>
          {/* Row 3 — full trend */}
          {/* <TqiTrendFull series={tqi.tqiTrend} /> */}
        </section>
      </main>

      <footer className="border-t border-border px-5 py-2 flex flex-wrap items-center justify-between text-[11px] text-foreground-dim">
        <span>Dark Cascade Framework · AI4M-FRS-2604-001 · Edge AI Gateway</span>
        <span className="font-mono">Cerebro broker :5555 ● online · QuestDB ● ok · TimescaleDB ● ok</span>
      </footer>
    </div>
  );
};

export default Tqi;
