# Dashboard Page — Backend Data Flow Analysis

> **Purpose**: Map every piece of data the Dashboard page consumes, trace it from raw source → backend → wire → frontend store → component rendering. This serves as the integration guide for wiring up `New_UI_28th_Apr`.

---

## Architecture Overview

```mermaid
graph TB
    subgraph "Data Sources"
        QDB["QuestDB (port 8812)"]
        ZMQ1["ZMQ PUB Camera 1 (port 5690)"]
        ZMQ2["ZMQ PUB Camera 2 (port 5691)"]
        DEMO["Demo JPEGs (assets/)"]
    end

    subgraph "Backend (FastAPI dev-backend)"
        WS["WebSocket /ws"]
        MJPEG1["GET /api/tqi/stream/1"]
        MJPEG2["GET /api/tqi/stream/2"]
        LIVE["live_loop() — polls QDB every 1s"]
        BACKFILL["_fetch_last_n_history(100)"]
    end

    subgraph "Frontend (React + Zustand)"
        WSC["WsClient singleton"]
        STORE["useLiveStore (Zustand)"]
        DASH["DashboardPage component"]
        SC["ScoreCard × 3"]
        TREND["TrendPanel × 3"]
        THERM["ThermalCameraCard × 2"]
    end

    QDB -->|seal_index_log, mae_values, tqi_log, sec_data| LIVE
    QDB -->|last 100 cycles| BACKFILL
    ZMQ1 -->|raw BGR frames| MJPEG1
    ZMQ2 -->|raw BGR frames| MJPEG2
    DEMO -->|fallback JPEGs| MJPEG1
    DEMO -->|fallback JPEGs| MJPEG2

    LIVE --> WS
    BACKFILL --> WS
    WS -->|JSON frames| WSC
    WSC -->|commitBatch| STORE
    STORE --> DASH
    DASH --> SC
    DASH --> TREND
    MJPEG1 -->|multipart/x-mixed-replace| THERM
    MJPEG2 -->|multipart/x-mixed-replace| THERM
```

---

## 1. Data Channel #1 — WebSocket (`/ws`)

This is the **primary data channel** for the Dashboard. The entire score display + trend charts are driven by it.

### 1.1 Connection & Subscription Flow

| Step | Where | What happens |
|------|-------|-------------|
| 1 | [bootstrap.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/bootstrap.ts) | `bootstrapLiveData()` called once from `<App>` mount. Creates `WsClient` singleton, wires `onFrames → commitBatch` and `onState → setWsState`, calls `client.connect()`. |
| 2 | [ws-client.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/ws-client.ts) | `WsClient.connect()` opens `ws://<host>/ws`. URL resolved from `VITE_WS_URL` env or auto-derived from `location`. |
| 3 | [DashboardPage.tsx](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/pages/DashboardPage.tsx#L26-L33) | `useWsTopics(["mc26/live/cycle", "mc26/live/status", "mc26/alarm"])` — ref-counted subscribe. |
| 4 | [ws-client.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/ws-client.ts#L144-L158) | Sends `{"action":"subscribe","topics":["mc26/live/cycle","mc26/live/status","mc26/alarm"]}` to server. |
| 5 | [ws.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/ws.py#L459-L494) | Server receives subscribe, adds topics to `subs` set. For `mc26/live/cycle` (a backfill topic), replays last 100 historical cycles immediately. |

### 1.2 Topics the Dashboard Subscribes To

The Dashboard explicitly subscribes to **3 topics**:

```typescript
const DASHBOARD_WS_TOPICS: readonly WsTopic[] = [
  "mc26/live/cycle",    // ← PRIMARY: carries SQI, PQI, TQI scores
  "mc26/live/status",   // ← machine running state, CPM, SKU
  "mc26/alarm",         // ← alarm payloads (currently commented out in UI)
];
```

> [!IMPORTANT]
> Even though the Dashboard only subscribes to 3 topics, the `mc26/live/cycle` topic carries ALL the scores (SQI, PQI, TQI) that the Dashboard needs. The more detailed `mc26/live/pqi/detail` and `mc26/live/tqi/detail` topics are used by the PQI and TQI pages respectively, but are **also backfilled** when subscribed.

### 1.3 Backfill Mechanism

On first subscribe to `mc26/live/cycle`, the server runs [_fetch_last_n_history(100)](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/ws.py#L203-L287) to replay historical data:

**QuestDB tables queried during backfill:**

| Table | Columns Used | Purpose |
|-------|-------------|---------|
| `seal_index_log.csv` | `cycle_id, timestamp, seal_index, status, SIT, r_sit, r_trq, r_time, avg_torque, t_seal_ms, T_jaw` | PQI score source (`seal_index` = PQI score) |
| `mae_values.csv` | `cycle_id, mae, status` | Tailing index (MAE = Mean Absolute Error) |
| `tqi_log.csv` | `cycle_id, timestamp, tqi, fill_score, contamination_score, uniformity_score, status, defect_description` | TQI score + sub-scores |
| `leakage_laminate_config.csv` | `laminate_name, is_active` | Active SKU/laminate name lookup |

### 1.4 Live Loop (Every ~1 second)

The [live_loop()](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/ws.py#L409-L455) polls QuestDB once per second via [_read_live_snapshot()](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/ws.py#L290-L376). It emits payloads **only when `cycle_id` advances** (i.e., a new machine cycle has completed).

**Tables queried in each poll:**

| Table | Query | Returns |
|-------|-------|---------|
| `seal_index_log.csv` | Latest row by `cycle_id DESC` | PQI score + seal metrics |
| `mae_values.csv` | Latest row by `cycle_id DESC` | Tailing MAE + status |
| `sec_data.csv` | Latest `auto_run` value | Machine running state |
| `tqi_log.csv` | Latest row by `cycle_id DESC` | TQI scores |

---

## 2. Wire Payloads — Exact Schemas

### 2.1 WebSocket Envelope (every frame)

```json
{
  "topic":    "mc26/live/cycle",
  "ts_ms":    1714620000000,
  "cycle_id": 42,
  "payload":  { ... }
}
```

### 2.2 `mc26/live/cycle` Payload — **The Main Dashboard Payload**

This is what drives the ScoreCards and TrendPanels:

```json
{
  "sqi":      0.8234,       // Seal Quality Index (composite)
  "pqi":      0.8500,       // Process Quality Index (= seal_index)
  "tqi":      0.7800,       // Thermal Quality Index (nullable)
  "vqi":      null,          // Vision QI (not implemented yet)
  "grade":    "green",       // "green" | "amber" | "red"
  "sku":      "SKU-A",       // Active laminate name
  "cycle_id": 42,
  "running":  true
}
```

> [!IMPORTANT]
> **SQI Computation Formula** (backend computes this, not the frontend):
> - If TQI is available: `SQI = 0.6 × PQI + 0.4 × TQI`
> - If TQI is null: `SQI = PQI`
> 
> This is computed in [ws.py L331-333](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/ws.py#L330-L334).

### 2.3 `mc26/live/status` Payload

```json
{
  "running": true,
  "cpm":     0.0,     // cycles per minute
  "sku":     "SKU-A"
}
```

Only emitted on **change** (running state, cpm, or sku changes).

### 2.4 `mc26/alarm` Payload

```json
{
  "id":            "alm-001",
  "severity":      "warn",         // "info" | "warn" | "critical"
  "message":       "Temperature out of range",
  "acknowledged":  false,
  "shelved_until": null             // epoch-ms or null
}
```

> [!NOTE]
> The alarm banner is **currently commented out** in the Dashboard UI (see line 97-101 of DashboardPage.tsx), but the topic is still subscribed to and data is stored in the Zustand store for when it's re-enabled.

---

## 3. Data Channel #2 — MJPEG Thermal Camera Streams (REST)

The Dashboard shows **two** thermal camera feeds via native `<img>` tags consuming MJPEG streams.

| Feed | Frontend URL | Backend Endpoint | ZMQ Source |
|------|-------------|-----------------|-----------|
| Camera 1 | `/api/tqi/stream/1` | [app.py L2047](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/app.py#L2047) | `tcp://localhost:5690` |
| Camera 2 | `/api/tqi/stream/2` | [app.py L2053](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/app.py#L2053) | `tcp://localhost:5691` |

### Data Source Pipeline

```mermaid
graph LR
    CAM["Physical Thermal Camera"] --> ZMQ["ZMQ PUB (port 5690/5691)"]
    ZMQ --> RECV["_tqi_zmq_receiver() background task"]
    RECV -->|"Raw BGR 640×512×3 bytes → cv2.imencode → JPEG"| GLOBAL["_LATEST_TQI_FRAME global"]
    GLOBAL --> MJPEG["MJPEG StreamingResponse @ 15fps"]
    MJPEG -->|"multipart/x-mixed-replace"| IMG["<img> tag in browser"]
    FALLBACK["Demo JPEGs (assets/)"] -->|"If ZMQ timeout > 5 frames"| GLOBAL
```

**Key constants:**
- Frame size: 640 × 512 × 3 (BGR) = 983,040 bytes
- FPS: 15
- JPEG quality: 85
- Fallback: cycles between `frame_000027.jpg` and `frame_000299.jpg` from `dev-backend/assets/`

### How the frontend uses it

[ThermalCameraCard.tsx](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/components/status/ThermalCameraCard.tsx) simply renders:

```html
<img src="/api/tqi/stream/1" crossOrigin="use-credentials" />
```

The browser natively handles `multipart/x-mixed-replace` — no JavaScript polling needed.

---

## 4. Raw Data Source: QuestDB Tables

All live/cycle data comes from **QuestDB** (`qdb` database, port 8812, Postgres wire protocol).

### 4.1 Tables Used by Dashboard

| QuestDB Table | Role | Key Columns |
|---------------|------|-------------|
| `seal_index_log.csv` | **PQI source** — seal quality scores per cycle | `cycle_id`, `timestamp`, `seal_index` (=PQI), `status`, `SIT`, `r_sit`, `r_trq`, `r_time`, `avg_torque`, `t_seal_ms`, `T_jaw` |
| `mae_values.csv` | **Tailing index** — MAE anomaly detection per cycle | `cycle_id`, `mae`, `status` (NORMAL/WARNING/REJECT) |
| `tqi_log.csv` | **TQI source** — thermal quality scores per cycle | `cycle_id`, `timestamp`, `tqi`, `fill_score`, `contamination_score`, `uniformity_score`, `status`, `defect_description` |
| `sec_data.csv` | **Machine state** — 1-second resolution process data | `auto_run` (boolean — is machine running?), `timestamp`, `cycle_id`, thermocouple columns |
| `leakage_laminate_config.csv` | **SKU/laminate** — active product configuration | `laminate_name`, `is_active` |

### 4.2 Config Tables (also in QuestDB, used by PQI page but loaded during WS)

| Table | Purpose |
|-------|---------|
| `leakage_machine_config.csv` | Machine physical parameters (ambient_temp, seal weights, tag names) |
| `ms_data.csv` | Millisecond-resolution machine data (torque/position per degree) |

### 4.3 Auth Database (separate Postgres)

| Database | Port | Purpose |
|----------|------|---------|
| PostgreSQL `ulp_cavity` | 5432 | Users, roles, sessions, audit trail |

Both databases default to host `20.20.20.238` (see [config.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/config.py)).

---

## 5. Score Computation & Grading

### 5.1 PQI (Process Quality Index)

PQI = `seal_index` from `seal_index_log.csv`. This is computed by the **leakage predictor** (external to this backend) and written directly to QuestDB. The value is a weighted composite:

```
seal_index = seal_a × r_sit + seal_b × r_trq + seal_c × r_time
```

Where:
- `r_sit` = T_inner / SIT_THRESHOLD (seal temperature ratio)
- `r_trq` = avg_torque / TORQUE_TARGET (torque ratio)
- `r_time` = t_seal_seconds / SEALING_TIME_TARGET (dwell time ratio)
- Weights `seal_a + seal_b + seal_c = 1.0` (from machine config)

### 5.2 TQI (Thermal Quality Index)

TQI comes from `tqi_log.csv`. It's a composite of 3 sub-scores:
- `fill_score` — how well the pouch is filled
- `contamination_score` — contamination detection
- `uniformity_score` — seal uniformity

The backend passes through the pre-computed `tqi` value. The frontend has a fallback formula:
```
TQI = 0.4 × fill_score + 0.35 × contamination_score + 0.25 × uniformity_score
```

### 5.3 SQI (Seal Quality Index) — The Master Score

```
If TQI exists:  SQI = 0.6 × PQI + 0.4 × TQI
If TQI is null: SQI = PQI
```

### 5.4 Grading Thresholds

Identical on frontend and backend:

| Grade | Threshold | Color |
|-------|-----------|-------|
| Green (Good) | score ≥ 0.75 | `#4cbb17` |
| Amber (Warning) | 0.60 ≤ score < 0.75 | `#ff9900` |
| Red (Critical) | score < 0.60 | `#ff2400` |

Source: [grading.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/lib/grading.ts) and [grading.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/core/grading.py)

---

## 6. Frontend Data Store Architecture

### 6.1 Zustand Store — `useLiveStore`

[liveStore.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/stores/liveStore.ts) — single global Zustand store.

**State shape relevant to Dashboard:**

```typescript
interface LiveStoreState {
  latest: {
    cycle?: LiveCyclePayload & { ts_ms: number };  // last cycle scores
    status?: StatusPayload & { ts_ms: number };      // machine state
  };
  history: {
    cycle: HistoryRow[];  // ring buffer, max 100 entries
  };
  alarms: AlarmRecord[];  // ring buffer, max 50 entries
}
```

**HistoryRow shape (what's in the ring buffer):**
```typescript
interface HistoryRow {
  cycle_id: number;
  ts_ms: number;
  sqi: number;
  pqi: number;
  tqi: number | null;
  grade: "green" | "amber" | "red";
}
```

### 6.2 Selectors Used by Dashboard

| Selector | Returns | Used For |
|----------|---------|----------|
| `selLatestCycle` | `latest.cycle` | Current SQI/PQI/TQI values for ScoreCards |
| `selCycleHistory` | `history.cycle` | Trend line data (last 30 of 100 points shown) |

### 6.3 How the Dashboard Reads the Store

```typescript
// DashboardPage.tsx
const latest = useLiveStore(selLatestCycle);    // latest scores
const history = useLiveStore(selCycleHistory);  // trend data

// Derived values:
const sqiTrend = history.slice(-30).map(r => r.sqi);
const pqiTrend = history.slice(-30).map(r => r.pqi);
const tqiTrend = history.slice(-30).map(r => r.tqi == null ? NaN : r.tqi);
const xLabels  = history.slice(-30).map(r => r.ts_ms);
```

---

## 7. Summary: What New_UI Needs to Implement

### Data Channels to Wire

| # | Channel | Protocol | What It Provides |
|---|---------|----------|-----------------|
| 1 | `/ws` WebSocket | WS JSON frames | All scores (SQI, PQI, TQI), grades, cycle IDs, machine status, alarms |
| 2 | `/api/tqi/stream/1` | HTTP MJPEG stream | Thermal camera feed 1 |
| 3 | `/api/tqi/stream/2` | HTTP MJPEG stream | Thermal camera feed 2 |

### WS Topics to Subscribe

```json
{ "action": "subscribe", "topics": ["mc26/live/cycle", "mc26/live/status", "mc26/alarm"] }
```

### Key Integration Points

1. **WebSocket Client** — needs to:
   - Connect to `/ws`
   - Send subscribe/unsubscribe JSON messages
   - Parse incoming JSON envelope: `{ topic, ts_ms, cycle_id, payload }`
   - Validate payloads by topic (Zod schemas in ULP_Cavite)
   - Coalesce frames (150ms window) before committing to state

2. **State Store** — needs:
   - Ring buffer for cycle history (100 entries)
   - Latest-value cache for each topic
   - Reconnect with exponential backoff (1s/2s/5s/10s/15s cap)
   - Stale detection (no frame for 2.4s → "stale" state)

3. **Thermal Cameras** — just `<img src="/api/tqi/stream/1">`, browser handles MJPEG natively

4. **Grading** — replicate the threshold logic locally:
   - ≥ 0.75 = Green/Good
   - ≥ 0.60 = Amber/Warning
   - < 0.60 = Red/Critical

### Backend Requirements

The New UI will talk to the **same backend** (or a compatible one), so no backend changes needed. The backend must provide:

- QuestDB with the listed tables populated by the leakage predictor and TQI vision pipeline
- ZMQ PUB sockets on ports 5690/5691 (or the MJPEG endpoints work with demo fallback frames)
- PostgreSQL `ulp_cavity` for auth

---

## 8. File Reference Map

### Frontend (ULP_Cavite)
| File | Role |
|------|------|
| [DashboardPage.tsx](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/pages/DashboardPage.tsx) | Dashboard page component |
| [liveStore.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/stores/liveStore.ts) | Zustand store (ring buffers, selectors) |
| [ws-client.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/ws-client.ts) | WebSocket client (backoff, coalesce, refcount) |
| [bootstrap.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/bootstrap.ts) | Wires WS client → Zustand store |
| [schemas.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/schemas.ts) | Zod schemas for all payloads |
| [useWsTopics.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/data/hooks/useWsTopics.ts) | React hook for topic subscribe/unsub |
| [grading.ts](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/lib/grading.ts) | Score → grade thresholds + colors |
| [ScoreCard.tsx](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/components/status/ScoreCard.tsx) | Score display card component |
| [ThermalCameraCard.tsx](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/src/components/status/ThermalCameraCard.tsx) | MJPEG stream viewer component |

### Backend (dev-backend)
| File | Role |
|------|------|
| [ws.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/ws.py) | WebSocket endpoint, live loop, backfill |
| [app.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/app.py) | Main FastAPI app, MJPEG streams, ZMQ receivers |
| [config.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/config.py) | DB connection config (QuestDB + Postgres) |
| [core/quest.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/core/quest.py) | QuestDB connection, row-to-dict shaping, signal processing |
| [core/grading.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/core/grading.py) | Score → grade threshold logic |
| [core/state.py](file:///home/nayan-ai4m/Desktop/AI4M/ULP/Application/Official/ULP_Cavite/frontend/dev-backend/core/state.py) | Process-wide caches (CACHED_SKU) |
