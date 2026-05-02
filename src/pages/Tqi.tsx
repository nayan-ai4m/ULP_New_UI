import { useLiveTqi } from "@/hooks/useLiveTqi";
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
  const tqi = useLiveTqi();

  return (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CameraTile
            name="Thermal Cam 1"
            streamUrl="/api/tqi/stream/1"
            heightVh={42}
          />
          <CameraTile
            name="Thermal Cam 2"
            streamUrl="/api/tqi/stream/2"
            heightVh={42}
          />
        </div>

        {/* Row 2 — jaw temperature charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[40vh]">
          <FrontJawChart
            series={tqi.front.series}
            setpoint={tqi.front.setpoint}
          />
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
  );
};

export default Tqi;
