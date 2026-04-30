import { useState } from "react";

export interface SkuRecord {
  id: string;
  layerMaterial: string;
  layerThickness: string;
  barcodeNo: string;
  gsm: number | null;
  supplier: string;
  volumeNo: string | null;
  isActive: boolean;
}

export type QbomStatus = "Active" | "Draft" | "Archived";

export interface QbomVersion {
  id: string;
  skuId: string;
  version: string;
  status: QbomStatus;
  modified: string;
  vSealTemp: number;
  vStroke1: number;
  vStroke2: number;
  hSealFront: number;
  hSealBack: number;
  hStroke1: number;
  hStroke2: number;
  rightPistonStroke: number;
  leftPistonStroke: number;
  nozzleShutOff: number;
  nozzleShutOn: number;
  greenLower: number; greenUpper: number;
  amberLower: number; amberUpper: number;
  redLower: number;   redUpper: number;
}

export interface QbomState {
  skus: SkuRecord[];
  versions: QbomVersion[];
  activeSku: string;
  setActiveSku: (id: string) => void;
  applySkuToMachine: (id: string) => void;
  activateVersion: (id: string) => void;
  archiveVersion: (id: string) => void;
  addVersion: (v: Omit<QbomVersion, "id" | "modified" | "status">) => void;
}

const INITIAL_SKUS: SkuRecord[] = [
  { id: "SKU-A", layerMaterial: "PE/VMPET/PET", layerThickness: "40/12/12 µm", barcodeNo: "SKU-A", gsm: null, supplier: "ULP Materials",   volumeNo: null, isActive: true  },
  { id: "SKU-B", layerMaterial: "PE/VMPET/PET", layerThickness: "50/12/12 µm", barcodeNo: "SKU-B", gsm: null, supplier: "ULP Materials",   volumeNo: null, isActive: false },
  { id: "SKU-C", layerMaterial: "PE/VMPET/PET", layerThickness: "35/9/9 µm",   barcodeNo: "SKU-C", gsm: null, supplier: "Lipton Supply", volumeNo: null, isActive: false },
];

const INITIAL_VERSIONS: QbomVersion[] = [
  {
    id: "v1", skuId: "SKU-A", version: "version 3", status: "Active",  modified: "2026-04-09",
    vSealTemp: 155, vStroke1: 90, vStroke2: 270,
    hSealFront: 140, hSealBack: 140, hStroke1: 90, hStroke2: 270,
    rightPistonStroke: 50, leftPistonStroke: 50,
    nozzleShutOff: 180, nozzleShutOn: 0,
    greenLower: 0.75, greenUpper: 1, amberLower: 0.5, amberUpper: 0.75, redLower: 0, redUpper: 0.5,
  },
  {
    id: "v2", skuId: "SKU-A", version: "version 4", status: "Draft",   modified: "2026-04-13",
    vSealTemp: 156, vStroke1: 90, vStroke2: 270,
    hSealFront: 142, hSealBack: 141, hStroke1: 90, hStroke2: 270,
    rightPistonStroke: 50, leftPistonStroke: 50,
    nozzleShutOff: 180, nozzleShutOn: 0,
    greenLower: 0.75, greenUpper: 1, amberLower: 0.5, amberUpper: 0.75, redLower: 0, redUpper: 0.5,
  },
  {
    id: "v3", skuId: "SKU-A", version: "version 2", status: "Archived", modified: "2026-03-22",
    vSealTemp: 153, vStroke1: 90, vStroke2: 270,
    hSealFront: 138, hSealBack: 138, hStroke1: 90, hStroke2: 270,
    rightPistonStroke: 50, leftPistonStroke: 50,
    nozzleShutOff: 180, nozzleShutOn: 0,
    greenLower: 0.75, greenUpper: 1, amberLower: 0.5, amberUpper: 0.75, redLower: 0, redUpper: 0.5,
  },
  {
    id: "v4", skuId: "SKU-B", version: "version 1", status: "Active",  modified: "2026-04-01",
    vSealTemp: 158, vStroke1: 90, vStroke2: 270,
    hSealFront: 145, hSealBack: 145, hStroke1: 90, hStroke2: 270,
    rightPistonStroke: 52, leftPistonStroke: 52,
    nozzleShutOff: 180, nozzleShutOn: 0,
    greenLower: 0.75, greenUpper: 1, amberLower: 0.5, amberUpper: 0.75, redLower: 0, redUpper: 0.5,
  },
  {
    id: "v5", skuId: "SKU-B", version: "version 2", status: "Draft",   modified: "2026-04-20",
    vSealTemp: 160, vStroke1: 92, vStroke2: 272,
    hSealFront: 146, hSealBack: 146, hStroke1: 92, hStroke2: 272,
    rightPistonStroke: 52, leftPistonStroke: 52,
    nozzleShutOff: 180, nozzleShutOn: 0,
    greenLower: 0.75, greenUpper: 1, amberLower: 0.5, amberUpper: 0.75, redLower: 0, redUpper: 0.5,
  },
  {
    id: "v6", skuId: "SKU-C", version: "version 1", status: "Active",  modified: "2026-03-15",
    vSealTemp: 150, vStroke1: 88, vStroke2: 268,
    hSealFront: 136, hSealBack: 136, hStroke1: 88, hStroke2: 268,
    rightPistonStroke: 48, leftPistonStroke: 48,
    nozzleShutOff: 180, nozzleShutOn: 0,
    greenLower: 0.75, greenUpper: 1, amberLower: 0.5, amberUpper: 0.75, redLower: 0, redUpper: 0.5,
  },
];

let nextId = 100;

export function useQbomState(): QbomState {
  const [skus, setSkus] = useState<SkuRecord[]>(INITIAL_SKUS);
  const [versions, setVersions] = useState<QbomVersion[]>(INITIAL_VERSIONS);
  const [activeSku, setActiveSku] = useState("SKU-A");

  function applySkuToMachine(id: string) {
    setSkus((prev) => prev.map((s) => ({ ...s, isActive: s.id === id })));
  }

  function activateVersion(id: string) {
    setVersions((prev) => {
      const target = prev.find((v) => v.id === id);
      if (!target) return prev;
      return prev.map((v) => {
        if (v.skuId !== target.skuId) return v;
        if (v.id === id) return { ...v, status: "Active" as QbomStatus };
        if (v.status === "Active") return { ...v, status: "Archived" as QbomStatus };
        return v;
      });
    });
  }

  function archiveVersion(id: string) {
    setVersions((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "Archived" as QbomStatus } : v)),
    );
  }

  function addVersion(v: Omit<QbomVersion, "id" | "modified" | "status">) {
    const skuVersions = versions.filter((x) => x.skuId === v.skuId);
    const nextNum = skuVersions.length + 1;
    setVersions((prev) => [
      ...prev,
      {
        ...v,
        id: `v${++nextId}`,
        version: `version ${nextNum}`,
        status: "Draft",
        modified: new Date().toISOString().slice(0, 10),
      },
    ]);
  }

  return { skus, versions, activeSku, setActiveSku, applySkuToMachine, activateVersion, archiveVersion, addVersion };
}
