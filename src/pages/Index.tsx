import { useLiveDashboard } from "@/lib/mock/dashboard";
import { TopBar } from "@/components/cockpit/TopBar";
import { IndexCard } from "@/components/cockpit/IndexCard";
import { OEEStrip } from "@/components/cockpit/OEEStrip";
import { CameraTile } from "@/components/cockpit/CameraTile";
import { SachetFeed } from "@/components/cockpit/SachetFeed";
import { AlertRail } from "@/components/cockpit/AlertRail";

const Index = () => {
  const snap = useLiveDashboard();

  return (
    <div className="max-h-screen flex flex-col overflow-auto">
      <TopBar machine={snap.machine} />

      <main className="flex-1 grid gap-4 p-4 lg:p-5 grid-cols-12">
        {/* Left + center column: KPIs, OEE, sachets */}
        <section className="col-span-12 xl:col-span-9 flex flex-col gap-4">
          {/* <OEEStrip oee={snap.oee} /> */}

          <div className="grid grid-cols-1 gap-4">
            <IndexCard
              title="SQI · Seal Quality Index"
              // subtitle="Per-cycle seal integrity from vaenableAI inference"
              score={snap.scores.sqi}
              trend={snap.trends.sqi}
            />
            <IndexCard
              title="PQI · Physics Quality Index"
              // subtitle="Tension · pressure · dwell · jaw kinematics"
              score={snap.scores.pqi}
              trend={snap.trends.pqi}
            />
            <IndexCard
              title="TQI · Thermal Quality Index"
              // subtitle="Front + rear jaw thermal profile vs. laminate envelope"
              score={snap.scores.tqi}
              trend={snap.trends.tqi}
            />
            <IndexCard
              title="VQI · Visual Quality Index"
              score={snap.scores.vqi}
              trend={snap.trends.vqi}
              comingSoon
            />
          </div>
          {/* <SachetFeed sachets={snap.sachets} /> */}
        </section>

        {/* Right column: alerts + cameras */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
            <CameraTile name="Thermal Cam 1" />
            <CameraTile name="Thermal Cam 2" />
          </div>
          <div className="flex-1 min-h-[420px] xl:min-h-0">
            <AlertRail alerts={snap.alerts} />
          </div>
        </aside>
      </main>

      <footer className="border-t border-border px-5 py-2 flex flex-wrap items-center justify-between text-[11px] text-foreground-dim">
        <span>
          AI4M Technology Pvt Ltd
        </span>
        <span className="font-mono">
          Unilever Phillipines
        </span>
      </footer>
    </div>
  );
};

export default Index;
