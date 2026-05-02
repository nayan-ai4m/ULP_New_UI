# PQI Page Data Pipeline Analysis

This document details the backend data architecture that powers the PQI (Physics Quality Index) page, derived from analyzing the `ULP_Cavite` codebase.

## 1. Data Source & Generation
In the `dev-backend`, the PQI metrics are fundamentally tied to the machine's sealing performance. 
- **The Core Metrics**: The PQI is calculated as a weighted composite of three main ratios:
  - `r_sit` (Seal Inner Temperature ratio) - 35% weight
  - `r_trq` (Torque ratio) - 40% weight
  - `r_time` (Dwell Time ratio) - 25% weight
  - Formula: `pqi = 0.35 * r_sit + 0.40 * r_trq + 0.25 * r_time`
- **Ancillary Data**: Alongside these core ratios, the backend also simulates raw physical readings like `jaw_temp_c`, `avg_torque`, and `dwell_ms`, as well as a dedicated `tailing_index` and `tailing_status` (which flags potential reject defects).
- **Storage**: In a real scenario, this data is continuously appended to the `seal_index_log` table in QuestDB. The backend polls this table every 1 second to fetch the newest cycle.

## 2. Transmission Protocol
The data is delivered to the frontend using two distinct mechanisms:

### A. Real-Time Telemetry (WebSocket)
- **Topic**: `mc26/live/pqi/detail`
- **Trigger**: Every time a new machine cycle occurs (roughly every 0.5 to 1.0 seconds, depending on the ~110 CPM speed).
- **Backfill**: Upon initial WebSocket connection, the backend immediately pushes the last 100 historical cycles over this topic to instantly seed the frontend UI charts without waiting for 100 live cycles to pass.

### B. Historical Data (REST API)
- **Endpoint**: `GET /api/historian/pqi`
- **Purpose**: Used for fetching larger blocks of historical data (e.g., the last 500 cycles or a specific time window) for deep-dive trend analysis and CSV exports.

## 3. Payload Structure
The WebSocket message payload for `mc26/live/pqi/detail` expects the following exact schema (`PqiDetailPayload`):

```json
{
  "r_sit": 0.952,
  "r_trq": 0.881,
  "r_time": 0.910,
  "t_inner_c": 112.5,
  "avg_torque": 495.2,
  "dwell_ms": 195.0,
  "jaw_temp_c": 146.5,
  "tailing_index": 0.421,
  "tailing_status": "NORMAL" // Can be "NORMAL", "WARNING", or "REJECT"
}
```

## 4. Frontend Consumption 
In `PQIPage.tsx`, the frontend maps this data as follows:
- Subscribes to `mc26/live/pqi/detail` using the `useWsTopics` hook.
- Stores the data in the Zustand `liveStore`.
- The live latest payload (`selLatestPqiDetail`) directly feeds the **LivePqiSummary**, **RawTiCard** (Tailing Index), and **ComponentPlots** components.
- The history array (`selPqiHistory`) is used to render the **PqiTrendCard** and the **TailingPanel** historical graphs.

## Summary for Migration
To map this to `New_UI_28th_Apr`:
1. We need to ensure the new backend emits the `mc26/live/pqi/detail` topic.
2. The payload structure must strictly adhere to the `PqiDetailPayload` schema above.
3. We must implement the same backfill logic (emitting recent history on connection) so the PQI charts render immediately.
4. The frontend `liveStore.ts` needs to be updated to capture and retain the `pqi_detail` payload cleanly.
