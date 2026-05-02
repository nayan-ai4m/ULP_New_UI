import { useState, useCallback } from "react";
import { Maximize2, RefreshCw, Wifi, WifiOff } from "lucide-react";

type StreamState = "loading" | "live" | "error";

interface Props {
  name: string;
  /** MJPEG endpoint URL, e.g. "/api/tqi/stream/1" */
  streamUrl?: string;
  /** Tile height in viewport height units. Defaults to 21. */
  heightVh?: number;
}

export function CameraTile({ name, streamUrl, heightVh = 21 }: Props) {
  const [state, setState] = useState<StreamState>(
    streamUrl ? "loading" : "error",
  );
  const [retryKey, setRetryKey] = useState(0);

  const onLoad = useCallback(() => setState("live"), []);
  const onError = useCallback(() => setState("error"), []);
  const retry = () => {
    setState("loading");
    setRetryKey((k) => k + 1);
  };

  return (
    <div className="panel-raised relative overflow-hidden flex flex-col" style={{ height: `${heightVh}vh` }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-medium">{name}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-[4px]">
            <span
              className={`status-dot ${
                state === "live"
                  ? "bg-good animate-pulse-soft"
                  : state === "loading"
                    ? "bg-warn animate-pulse-soft"
                    : "bg-critical"
              }`}
            />
            <span className="text-foreground-muted text-[12px]">
              {state === "live"
                ? "Online"
                : state === "loading"
                  ? "Connecting…"
                  : "Offline"}
            </span>
          </div>
          {state === "error" && (
            <button
              onClick={retry}
              className="text-foreground-dim hover:text-foreground"
              aria-label="Retry stream"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          <button className="text-foreground-dim hover:text-foreground">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 min-h-[160px] bg-black overflow-hidden flex items-center justify-center">
        {streamUrl ? (
          <img
            key={retryKey}
            src={streamUrl}
            alt={`${name} live feed`}
            onLoad={onLoad}
            onError={onError}
            className={`w-[75%] h-full object-fill ${state === "error" ? "hidden" : "block"}`}
            crossOrigin="use-credentials"
          />
        ) : null}

        {state === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70">
            <Wifi size={20} className="text-foreground-dim animate-pulse" />
            <span className="text-xs text-foreground-muted">
              Connecting to camera…
            </span>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/70">
            <WifiOff size={20} className="text-warn" />
            <span className="text-xs font-semibold text-foreground-muted">
              Stream unavailable
            </span>
            <span className="text-[10px] text-foreground-dim">
              Start backend or ZMQ producer
            </span>
          </div>
        )}

        {/* {state === "live" && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-2 left-2 font-mono text-[10px] text-good/80">
              REC ● {new Date().toLocaleTimeString()}
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
