import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Maximize2, RefreshCw, Wifi, WifiOff, X } from "lucide-react";

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
  const [expanded, setExpanded] = useState(false);

  const onLoad = useCallback(() => setState("live"), []);
  const onError = useCallback(() => setState("error"), []);
  const retry = () => {
    setState("loading");
    setRetryKey((k) => k + 1);
  };

  // Close modal on Escape key
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [expanded]);

  const statusDot = (
    <span
      className={`status-dot ${
        state === "live"
          ? "bg-good animate-pulse-soft"
          : state === "loading"
            ? "bg-warn animate-pulse-soft"
            : "bg-critical"
      }`}
    />
  );

  const statusLabel =
    state === "live"
      ? "Online"
      : state === "loading"
        ? "Connecting…"
        : "Offline";

  return (
    <>
      <div
        className="panel-raised relative overflow-hidden flex flex-col"
        style={{ height: `${heightVh}vh` }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium">{name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-[4px]">
              {statusDot}
              <span className="text-foreground-muted text-[12px]">
                {statusLabel}
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
            <button
              onClick={() => setExpanded(true)}
              className="text-foreground-dim hover:text-foreground"
              aria-label="Expand camera"
            >
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
        </div>
      </div>

      {/* ── Expanded modal — portalled to document.body to escape overflow:hidden ── */}
      {expanded &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) setExpanded(false);
            }}
          >
            <div className="flex flex-col w-[90vw] h-[88vh] panel-raised overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  {statusDot}
                  <span className="text-sm font-semibold">{name}</span>
                  <span className="text-foreground-muted text-xs">
                    {statusLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {state === "error" && (
                    <button
                      onClick={retry}
                      className="text-foreground-dim hover:text-foreground"
                      aria-label="Retry stream"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(false)}
                    className="text-foreground-dim hover:text-foreground"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Modal stream */}
              <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                {streamUrl && state !== "error" ? (
                  <img
                    key={`modal-${retryKey}`}
                    src={streamUrl}
                    alt={`${name} expanded feed`}
                    className="w-full h-full object-contain"
                    crossOrigin="use-credentials"
                  />
                ) : null}

                {state === "loading" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                    <Wifi
                      size={28}
                      className="text-foreground-dim animate-pulse"
                    />
                    <span className="text-sm text-foreground-muted">
                      Connecting to camera…
                    </span>
                  </div>
                )}

                {state === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60">
                    <WifiOff size={28} className="text-warn" />
                    <span className="text-sm font-semibold text-foreground-muted">
                      Stream unavailable
                    </span>
                    <span className="text-xs text-foreground-dim">
                      Start backend or ZMQ producer
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
