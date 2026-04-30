import { useState } from "react";

export type ActiveMode = "Production" | "Calibration" | "Maintenance";
export type RoutingMode = "Cockpit" | "Field" | "Both";
export type WorkerHealth = "online" | "degraded" | "offline";
export type StoreHealth = "ok" | "warn" | "error";

export interface RuntimeConfig {
  autoRun: boolean;
  closedLoopEnabled: boolean;
  activeMode: ActiveMode;
  machineCpm: number;
  activeSku: string;
  targetDwellMs: number;
  targetPressureMbar: number;
  targetSitC: number;
  verticalSealerTempC: number;
  frontStrokeMm: number;
  backStrokeMm: number;
  verticalStroke1Mm: number;
  verticalStroke2Mm: number;
  horizontalStroke1Mm: number;
  horizontalStroke2Mm: number;
  rightFillingPistonMm: number;
  leftFillingPistonMm: number;
  blowOffNozzleMm: number;
  shutOnNozzleMm: number;
}

export interface AlertConfig {
  routingMode: RoutingMode;
  escalationTimerMin: number;
  websocketEnabled: boolean;
  soundEnabled: boolean;
  criticalOnlyField: boolean;
}

export interface WorkerStatus {
  id: number;
  name: string;
  service: string;
  errorRange: string;
  status: WorkerHealth;
  lastHeartbeatAgo: string;
}

export interface StoreStatus {
  name: string;
  role: string;
  endpoint: string;
  status: StoreHealth;
  latencyMs: number | null;
}

export interface SystemInfo {
  hostname: string;
  ipAddress: string;
  osVersion: string;
  frameworkVersion: string;
  cerebroBrokerPort: number;
  tlsEnabled: boolean;
  siteId: string;
  iecZone: string;
}

export interface SettingsState {
  runtime: RuntimeConfig;
  updateRuntime: (patch: Partial<RuntimeConfig>) => void;
  alerts: AlertConfig;
  updateAlerts: (patch: Partial<AlertConfig>) => void;
  workers: WorkerStatus[];
  stores: StoreStatus[];
  sysInfo: SystemInfo;
}

const INITIAL_RUNTIME: RuntimeConfig = {
  autoRun: true,
  closedLoopEnabled: true,
  activeMode: "Production",
  machineCpm: 110,
  activeSku: "SKU-A",
  targetDwellMs: 200,
  targetPressureMbar: 500,
  targetSitC: 155.0,
  verticalSealerTempC: 155,
  frontStrokeMm: 42.5,
  backStrokeMm: 41.0,
  verticalStroke1Mm: 38.0,
  verticalStroke2Mm: 38.5,
  horizontalStroke1Mm: 55.0,
  horizontalStroke2Mm: 54.5,
  rightFillingPistonMm: 28.0,
  leftFillingPistonMm: 28.0,
  blowOffNozzleMm: 12.0,
  shutOnNozzleMm: 11.5,
};

const INITIAL_ALERTS: AlertConfig = {
  routingMode: "Both",
  escalationTimerMin: 10,
  websocketEnabled: true,
  soundEnabled: true,
  criticalOnlyField: false,
};

export const WORKERS: WorkerStatus[] = [
  { id: 1,  name: "Cerebro Broker",     service: "system",    errorRange: "1xxx",  status: "online",   lastHeartbeatAgo: "2s ago" },
  { id: 2,  name: "PLC Worker",         service: "plc",       errorRange: "4xxx",  status: "online",   lastHeartbeatAgo: "2s ago" },
  { id: 3,  name: "Acquisition Worker", service: "camera",    errorRange: "2xxx",  status: "online",   lastHeartbeatAgo: "2s ago" },
  { id: 4,  name: "Inference Worker",   service: "inference", errorRange: "3xxx",  status: "online",   lastHeartbeatAgo: "2s ago" },
  { id: 5,  name: "Process Worker",     service: "process",   errorRange: "6xxx",  status: "online",   lastHeartbeatAgo: "2s ago" },
  { id: 6,  name: "SQI Engine Worker",  service: "sqi",       errorRange: "7xxx",  status: "online",   lastHeartbeatAgo: "2s ago" },
  { id: 7,  name: "Q-BOM Worker",       service: "qbom",      errorRange: "8xxx",  status: "online",   lastHeartbeatAgo: "2s ago" },
  { id: 8,  name: "Alert Worker",       service: "alert",     errorRange: "9xxx",  status: "online",   lastHeartbeatAgo: "2s ago" },
  { id: 9,  name: "OEE Worker",         service: "oee",       errorRange: "10xxx", status: "degraded", lastHeartbeatAgo: "8s ago" },
  { id: 10, name: "GSM Worker",         service: "gsm",       errorRange: "11xxx", status: "offline",  lastHeartbeatAgo: "—" },
  { id: 11, name: "Historian Worker",   service: "historian", errorRange: "12xxx", status: "online",   lastHeartbeatAgo: "2s ago" },
];

export const STORES: StoreStatus[] = [
  { name: "QuestDB",     role: "Hot Cache L2",             endpoint: ":9009 (ILP) · :8812 (SQL)", status: "ok",  latencyMs: 2 },
  { name: "TimescaleDB", role: "Historian L3 (90-day)",    endpoint: ":5432",                      status: "ok",  latencyMs: 8 },
  { name: "PostgreSQL",  role: "Relational L3 (Q-BOM/Audit)", endpoint: ":5432",                   status: "ok",  latencyMs: 5 },
  { name: "SQLite",      role: "Offline Cache L2",         endpoint: "edge-local",                 status: "ok",  latencyMs: 0 },
];

export const SYS_INFO: SystemInfo = {
  hostname: "dc-edge-ulp-01",
  ipAddress: "192.168.10.51",
  osVersion: "RHEL 10 GA (SELinux enforced)",
  frameworkVersion: "Dark Cascade v0.1 — AI4M-FRS-2604-001",
  cerebroBrokerPort: 5555,
  tlsEnabled: true,
  siteId: "Site-A: ULP Cavite (Unilever Philippines)",
  iecZone: "Z-EDGE — High Trust · Isolated VLAN",
};

export function useSettingsState(): SettingsState {
  const [runtime, setRuntime] = useState<RuntimeConfig>(INITIAL_RUNTIME);
  const [alerts, setAlerts]   = useState<AlertConfig>(INITIAL_ALERTS);

  return {
    runtime,
    updateRuntime: (patch) => setRuntime((prev) => ({ ...prev, ...patch })),
    alerts,
    updateAlerts: (patch) => setAlerts((prev) => ({ ...prev, ...patch })),
    workers: WORKERS,
    stores:  STORES,
    sysInfo: SYS_INFO,
  };
}
