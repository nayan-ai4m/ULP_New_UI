import { useQuery } from "@tanstack/react-query";
import {
  useLiveStore,
  selWsConnected,
  selLatestStatus,
  selLatestTqi,
} from "@/data/liveStore";

interface TqiStatusResponse {
  camera_1: { zmq_connected: boolean };
  camera_2: { zmq_connected: boolean };
}

interface HealthzResponse {
  ok: boolean;
}

export interface HealthStatus {
  plc: boolean;
  cam1: boolean;
  cam2: boolean;
  server: boolean;
  vision: boolean;
}

export function useHealthCheck(): HealthStatus {
  const wsConnected = useLiveStore(selWsConnected);
  const latestStatus = useLiveStore(selLatestStatus);
  const latestTqi = useLiveStore(selLatestTqi);

  const { data: healthzData, isError: serverError } = useQuery<HealthzResponse>({
    queryKey: ["healthz"],
    queryFn: () => fetch("/healthz").then((r) => r.json()),
    refetchInterval: 5000,
    retry: false,
  });

  const { data: tqiStatusData, isError: cameraError } = useQuery<TqiStatusResponse>({
    queryKey: ["tqi-status"],
    queryFn: () => fetch("/api/tqi/status").then((r) => r.json()),
    refetchInterval: 5000,
    retry: false,
  });

  return {
    plc: wsConnected && latestStatus != null,
    cam1: !cameraError && (tqiStatusData?.camera_1?.zmq_connected ?? false),
    cam2: !cameraError && (tqiStatusData?.camera_2?.zmq_connected ?? false),
    server: !serverError && (healthzData?.ok ?? false),
    vision: wsConnected && latestTqi != null,
  };
}
