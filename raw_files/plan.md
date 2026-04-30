## Dark Cascade — Dashboard Redesign Plan

### Context (from FRS)
The Dark Cascade Framework is an edge-AI quality system for VFFS sachet packaging machines (Unilever Cavite, HUL Haridwar). The dashboard is the **operator cockpit** for one machine (e.g. MC-26), surfacing three live quality indices computed every cycle:

- **SQI** — Seal Quality Index
- **PQI** — Physics Quality Index
- **TQI** — Thermal Quality Index

…plus thermal camera views, alerts with one-click *advisory prescriptions*, and Q-BOM context. Color semantics are contractual: **Green ≥ 0.75**, **Amber ≥ 0.60**, **Red < 0.60**.

### Users (3 personas, one adaptive UI)
1. **Line operator** — wall-screen at 2–3m. Needs glanceable status, no interaction.
2. **Shift supervisor / QA** — desk view. Needs trends, alerts, ability to apply prescriptions, recent defects.
3. **Plant manager** — wants OEE, throughput, reject rate; treats one machine as a tile in a fleet.

The single landing page adapts via density: hero KPIs always huge; secondary panels collapse / scroll on smaller screens.

---

### What stays on the landing page vs. moves to tabs

The current top nav (Dashboard, PQI, TQI, Config, Q-BOM, Historian, Settings, User Management) is kept. The dashboard becomes a **decision surface**, not a kitchen sink.

**On the dashboard:**
- Top status bar (machine, cycle, SKU, Q-BOM rev, shift, operator, machine state)
- Three hero index cards (SQI / PQI / TQI) with score, status pill, sparkline
- Three trend charts (one per index) — kept but tightened
- Two thermal camera tiles
- **OEE micro-strip** (Availability / Performance / Quality + rolling reject %) — compact, single row
- **Live alert rail** (right side or bottom): newest amber/red events with prescription + one-click apply / dismiss
- **Recent sachet feed** (horizontal strip of last ~20 graded thumbnails) — collapsible

**Not on the dashboard** (lives in dedicated tabs):
- Full historian, full Q-BOM editor, deep PQI/TQI breakdowns, user management, audit log

This keeps the landing focused on *"is the line healthy right now, and what do I do if it isn't?"*

---

### Layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│  MC-26 ● Running  │ Cycle 200015 │ SKU-A │ Q-BOM v3.2 │ Shift B │ 👤 │
├───────────────────────────┬──────────────────────────────────────────┤
│  SQI 0.86  ●Good          │  SQI Trend  ───────────────╮              │
│  ────────────────────────  │  ····· amber ····· green ──             │
├───────────────────────────┼──────────────────────────────────────────┤
│  PQI 0.87  ●Good          │  PQI Trend                              │
├───────────────────────────┼──────────────────────────────────────────┤
│  TQI 0.90  ●Good          │  TQI Trend                              │
├───────────────────────────┴───────────────┬──────────────┬───────────┤
│  OEE  A 96% · P 92% · Q 99% · Reject 0.4%│ Thermal Cam 1│ Cam 2     │
├──────────────────────────────────────────┴──────────────┴───────────┤
│  Recent sachets: [G][G][G][A][G][G][R][G][G]…  ▸ defect class chips  │
├──────────────────────────────────────────────────────────────────────┤
│  ⚠ Alerts (2)  · TQI dropped 0.62 → prescription: +3°C jaw  [Apply] │
└──────────────────────────────────────────────────────────────────────┘
```

On smaller widths (supervisor laptop), the right-column charts collapse below the index cards; cameras dock to a side drawer. On a wall display (≥ 1920px), the index numbers scale up dramatically and the alert rail becomes persistent on the right.

---

### Visual direction — Refined Industrial Dark

Kept dark per your direction; cleaned up the current scheme which is functional but visually flat.

- **Surfaces:** layered slate — base `#0B1118`, panel `#121A24`, raised `#1A2533`, hairline borders `hsl(215 25% 18%)` rather than heavy boxes.
- **Status semantics (locked to FRS thresholds):**
  - Green / Good `#22D17A`
  - Amber / Warn `#F5A524`
  - Red / Critical `#EF4444`
- **Accent (non-status, for charts/CTAs):** cool cyan `#38BDF8`.
- **Typography:** `Inter` for UI, `JetBrains Mono` for numeric values (cycle counts, scores) — matches the technical feel of the existing screen but with proper hierarchy.
- **Hierarchy:** the score numbers (0.86) become the loudest element on the page — much larger, tabular numerals, tinted by status. Trend lines get a subtle gradient fill instead of the current heavy green wash. Thresholds shown as thin dashed guides, not competing colored lines.
- **Motion:** numbers tick with a brief flash on update; alerts slide in from the rail; nothing decorative.
- **Density:** generous padding, 8px grid, soft 8–10px corner radius. Less SCADA, more product-grade HMI.

---

### Behavior notes
- Status pills + score color are driven from a single `getQualityStatus(score)` helper using FRS thresholds, so all surfaces stay consistent.
- Alert rail consumes the same shape as the FRS Alert Worker (`grade`, `reason`, `prescription`, `image_url`); "Apply" is wired but stubbed for now (no backend yet).
- Charts use Recharts with `tabular-nums` axis labels and a fixed 0–1 Y range so eyes lock onto trend shape, not scale.
- All data is mocked with realistic generators (per-cycle ticking values, occasional amber/red excursions) so the page feels alive in the preview.

### Out of scope for this pass
- Real Cerebro/QuestDB/WebSocket wiring
- The other tabs (PQI, TQI, Config, Q-BOM, Historian, Settings, User Management) — left as stubs for now
- Auth / RBAC (FRS calls for it; will plan in a follow-up)
- Multi-machine fleet view (manager persona drill-up) — flagged as next step

### Technical bits
- React + Tailwind + shadcn (existing stack). Add Recharts.
- New tokens in `index.css` (HSL): `--status-good`, `--status-warn`, `--status-critical`, `--surface-1/2/3`, `--accent-cyan`. Tailwind config extended with these.
- New components: `StatusPill`, `IndexCard`, `IndexTrend`, `TopBar`, `OEEStrip`, `CameraTile`, `SachetFeed`, `AlertRail`.
- `src/pages/Index.tsx` becomes the dashboard; current placeholder removed.
- Mock data lives in `src/lib/mock/dashboard.ts` with a tick interval to simulate live updates.