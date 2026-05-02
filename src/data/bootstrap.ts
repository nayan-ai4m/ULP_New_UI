/**
 * One-time wiring of the WsClient singleton to the Zustand live store.
 * Called once from <App> on mount.  Idempotent — calling twice is a noop.
 */

import { getWsClient } from "@/data/ws-client";
import { useLiveStore } from "@/data/liveStore";

let wired = false;
let unsubFrames: (() => void) | null = null;
let unsubState: (() => void) | null = null;

export function bootstrapLiveData(): () => void {
  if (wired) return dispose;
  wired = true;

  const client = getWsClient();
  unsubFrames = client.onFrames((frames) => {
    useLiveStore.getState().commitBatch(frames);
  });
  unsubState = client.onState((s) => {
    useLiveStore.getState().setWsState(s);
  });
  client.connect();
  return dispose;
}

function dispose(): void {
  if (!wired) return;
  unsubFrames?.();
  unsubState?.();
  unsubFrames = null;
  unsubState = null;
  wired = false;
}
