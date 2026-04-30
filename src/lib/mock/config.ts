import { useState } from "react";

export interface LaminateProfile {
  sku: string;
  d1: number; d2: number; d3: number;
  k_a: number; k_b: number; k_c: number;
  sit: number;
  pressureTarget: number;
  timeTarget: number;
  alphaPE: number; alphaVMPET: number; alphaPET: number;
}

export interface BulkConfig {
  sealA: number; sealB: number; sealC: number;
  areaA: number;
  alpha: number;
  beta: number;
  constC: number;
  tEff: number;
  s2Threshold: number;
}

export interface MachineConfig {
  machineId: string;
  ambientTemp: number;
  plcFrontJaw: string;
  plcRearJaw: string;
  plcTorque: string;
  plcPosition: string;
}

export interface ConfigState {
  laminates: Record<string, LaminateProfile>;
  activeSku: string;
  setActiveSku: (sku: string) => void;
  updateLaminate: (sku: string, patch: Partial<LaminateProfile>) => void;
  bulk: BulkConfig;
  updateBulk: (patch: Partial<BulkConfig>) => void;
  machine: MachineConfig;
  updateMachine: (patch: Partial<MachineConfig>) => void;
}

const INITIAL_LAMINATES: Record<string, LaminateProfile> = {
  "SKU-A": {
    sku: "SKU-A",
    d1: 0.00004, d2: 0.00001, d3: 0.00001,
    k_a: 0.40, k_b: 0.15, k_c: 0.15,
    sit: 105, pressureTarget: 500, timeTarget: 0.2,
    alphaPE: 1.92e-7, alphaVMPET: 1.15e-7, alphaPET: 1.15e-7,
  },
  "SKU-B": {
    sku: "SKU-B",
    d1: 0.00005, d2: 0.000012, d3: 0.000012,
    k_a: 0.38, k_b: 0.14, k_c: 0.16,
    sit: 108, pressureTarget: 480, timeTarget: 0.22,
    alphaPE: 1.88e-7, alphaVMPET: 1.10e-7, alphaPET: 1.12e-7,
  },
  "SKU-C": {
    sku: "SKU-C",
    d1: 0.000035, d2: 0.000009, d3: 0.000009,
    k_a: 0.42, k_b: 0.16, k_c: 0.14,
    sit: 102, pressureTarget: 520, timeTarget: 0.18,
    alphaPE: 1.95e-7, alphaVMPET: 1.18e-7, alphaPET: 1.18e-7,
  },
};

const INITIAL_BULK: BulkConfig = {
  sealA: 0.35, sealB: 0.40, sealC: 0.25,
  areaA: 0.0042,
  alpha: 1,
  beta: 0.5,
  constC: 0.1,
  tEff: 95,
  s2Threshold: 0.6,
};

const INITIAL_MACHINE: MachineConfig = {
  machineId: "MC-26",
  ambientTemp: 33.27,
  plcFrontJaw: "temp_27_pv",
  plcRearJaw: "temp_28_pv",
  plcTorque: "h_sealer_act_trq",
  plcPosition: "horizontal_sealer_actual_position",
};

export function useConfigState(): ConfigState {
  const [laminates, setLaminates] = useState<Record<string, LaminateProfile>>(INITIAL_LAMINATES);
  const [activeSku, setActiveSku] = useState("SKU-A");
  const [bulk, setBulk] = useState<BulkConfig>(INITIAL_BULK);
  const [machine, setMachine] = useState<MachineConfig>(INITIAL_MACHINE);

  function updateLaminate(sku: string, patch: Partial<LaminateProfile>) {
    setLaminates((prev) => ({ ...prev, [sku]: { ...prev[sku], ...patch } }));
  }

  function updateBulk(patch: Partial<BulkConfig>) {
    setBulk((prev) => ({ ...prev, ...patch }));
  }

  function updateMachine(patch: Partial<MachineConfig>) {
    setMachine((prev) => ({ ...prev, ...patch }));
  }

  return { laminates, activeSku, setActiveSku, updateLaminate, bulk, updateBulk, machine, updateMachine };
}
