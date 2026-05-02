/**
 * Subscribe to a fixed set of WS topics for the lifetime of the calling
 * component.  The ws-client ref-counts internally, so two components
 * subscribing to the same topic is safe; the upstream subscribe frame is
 * only sent on the 0→1 transition and the unsubscribe on 1→0.
 *
 * Pass a stable `topics` array (module-level constant or useMemo) — a
 * new array every render would churn ref counts.
 */

import { useEffect } from "react";
import { getWsClient } from "@/data/ws-client";
import type { WsTopic } from "@/data/types";

export function useWsTopics(topics: readonly WsTopic[]): void {
  useEffect(() => {
    const client = getWsClient();
    client.subscribe(topics);
    return () => client.unsubscribe(topics);
    // `topics` is expected to be a stable reference; callers are responsible.
  }, [topics]);
}
