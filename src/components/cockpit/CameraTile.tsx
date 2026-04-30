import { Camera, Maximize2 } from "lucide-react";

export function CameraTile({ name }: { name: string }) {
  return (
    <div className="panel-raised relative overflow-hidden flex flex-col h-[21vh]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-xs">
          {/* <Camera className="h-3.5 w-3.5 text-primary" /> */}
          <span className="font-medium">{name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-[4px]">
            <span className="status-dot bg-good animate-pulse-soft" />
            <span className="text-foreground-muted text-[12px]">Online</span>
          </div>
          <button className="text-foreground-dim hover:text-foreground">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-[160px] bg-black overflow-hidden">
        {/* Simulated thermal video feed */}
        <ThermalSim />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 font-mono text-[10px] text-status-good/80">
            REC ● {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThermalSim() {
  // Animated CSS gradient mimicking heated jaw rows
  return (
    <div className="absolute inset-0 opacity-90"
      style={{
        backgroundImage: `
          repeating-linear-gradient(0deg, hsl(0 0% 8%) 0 8px, hsl(0 0% 18%) 8px 14px),
          radial-gradient(ellipse at 30% 40%, hsl(20 90% 55% / 0.45), transparent 60%),
          radial-gradient(ellipse at 70% 60%, hsl(40 90% 60% / 0.35), transparent 55%),
          linear-gradient(180deg, hsl(0 0% 6%), hsl(0 0% 14%))
        `,
        backgroundBlendMode: "screen, screen, screen, normal",
      }}
    />
  );
}
