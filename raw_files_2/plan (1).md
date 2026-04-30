# PQI Page Redesign — Plan

## Context

The screenshot shows a PQI tab that doesn't yet exist in the codebase (only the Dashboard at `/` is implemented). I'll build it as a new route `/pqi` and add a top-nav between Dashboard / PQI / TQI / etc., so the existing tab UX in the screenshot becomes real.

Per FRS, PQI = Physics Quality Index, a weighted composite of three sub-signals captured per cycle:
- **Heat** (T_inner vs SIT threshold, T_jaw)
- **Pressure** (sealing duration window, peak pressure vs cam degree)
- **Dwell Time** (ms per cycle vs target)

Status semantics (locked to FRS, applied uniformly across this page):
- **Green / Good** ≥ 0.75
- **Amber / Watch** ≥ 0.60 and < 0.75
- **Red / Reject** < 0.60   ← this is the missing third class your observation asks about

## Who this page is for

- **Operator (wall view):** glance at PQI hero score, status pill, and the Tailing Index band → know if action is needed.
- **Supervisor / QA:** read the three weighted contribution boxes to find which sub-signal is dragging PQI down, then drill into Heat / Pressure / Dwell charts.
- **Plant manager:** scan PQI Trend + Raw Tailing Index for shift-level drift.

## Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ TopBar  (MC-26 · Cycle · SKU · Machine state · user)                         │
│ Tabs: Dashboard | [PQI] | TQI | Config | Q-BOM | Historian | Settings | Users│
├──────────────┬──────────────────────────────────────────────────────────────┤
│ LEFT RAIL    │  MAIN GRID (3 columns on xl, stack on md)                    │
│ (col-span-3) │                                                              │
│              │  ┌──────────────┬──────────────┬─────────────────┐           │
│ PQI Hero     │  │ Heat —       │ Pressure —   │ Dwell Time —    │           │
│  0.93 Good   │  │ SIT Profile  │ Sealing Dur. │ Trend           │           │
│              │  │              │ & Pressure   │ (target const.) │           │
│ Weighted     │  │ T_inner /SIT │ x: Cam Degree│ x: Timestamp    │           │
│ Contribution │  │ T_jaw        │ Pos+Pressure │ y: Dwell (ms)   │           │
│  Heat   0.42 │  └──────────────┴──────────────┴─────────────────┘           │
│  Press. 0.31 │                                                              │
│  Dwell  0.20 │  ┌──────────────────────────────────────────────────────┐    │
│  (Σ = 0.93)  │  │ Tailing Index (full-width band chart, R/A/G zones)   │    │
│              │  └──────────────────────────────────────────────────────┘    │
│ PQI Trend    │                                                              │
│  sparkline   │                                                              │
│  + R/A/G     │                                                              │
│              │                                                              │
│ Raw Tailing  │                                                              │
│ Index 0.792  │                                                              │
│  + R/A/G pill│                                                              │
└──────────────┴──────────────────────────────────────────────────────────────┘
```

## Fixes mapped to your observations

| # | Observation | Fix |
|---|---|---|
| 1 | Weighted Contribution boxes show raw values | Each box shows the **weighted contribution to PQI** (0.00–1.00), with the raw value as a small secondary line underneath (e.g. `0.42` big, `111.2 °C raw` small). The three boxes sum to the PQI hero score. A horizontal stacked bar visualizes the split. |
| 2 | Dwell Time target line varies | Render target as a **constant horizontal `ReferenceLine`** at 220 ms (from Q-BOM), not as a per-point series. Removes the wobble. |
| 3 | "Seal" label | Rename to **"Sealing Duration"** in the Pressure card title and the highlighted band annotation. |
| 4 | "Angle" axis | Rename x-axis to **"Cam Degree (°)"**. |
| 5 | "Dwell (ms)" line label | The **x-axis** label becomes "Timestamp" and the **y-axis** stays "Dwell (ms)". The series legend reads **"Dwell (ms) per Timestamp"**. (Interpreting your note as: x should be timestamp, y is dwell ms.) |
| 6 | No Red category in PQI Trend | Add a third zone: **Red / Reject < 0.60**. PQI Trend sparkline shows three reference lines + legend chips: `Red < 0.60`, `Amber ≥ 0.60`, `Green ≥ 0.75`. Background is shaded in three bands (red/amber/green soft) using the same scheme as the Tailing Index chart. |
| 7 | Raw Tailing Index has no status context | Show **status pill** (Good / Watch / Reject) next to the value, plus the same Amber ≥ 0.60 / Green ≥ 0.75 legend underneath, and color the number using `getQualityStatus()`. |

Bonus consistency fixes:
- The PQI hero pill uses the same `StatusPill` component as Dashboard (single source of truth).
- All thresholds come from `src/lib/quality.ts` — no magic numbers in chart code.

## New components

- `src/components/pqi/PqiHero.tsx` — large score + status pill.
- `src/components/pqi/WeightedContribution.tsx` — three boxes (Heat / Pressure / Dwell) showing weighted contribution + raw value + stacked bar.
- `src/components/pqi/HeatChart.tsx` — T_inner curve, SIT threshold reference line, T_jaw reference line.
- `src/components/pqi/PressureChart.tsx` — Position + Pressure dual-axis vs Cam Degree, with shaded "Sealing Duration" band.
- `src/components/pqi/DwellTrendChart.tsx` — Dwell ms over Timestamp, constant target reference line at 220 ms.
- `src/components/pqi/TailingIndexChart.tsx` — full-width line over time with Red/Amber/Green shaded bands, threshold reference lines, legend.
- `src/components/pqi/PqiTrendMini.tsx` — sparkline with three-zone background.
- `src/components/pqi/RawTailingIndex.tsx` — value + pill + legend.
- `src/components/cockpit/AppNav.tsx` — top tab nav (Dashboard / PQI / TQI / Config / Q-BOM / Historian / Settings / User Management). Only Dashboard and PQI are wired; the rest are placeholders.

## Data

Extend `src/lib/mock/dashboard.ts` (or a new `src/lib/mock/pqi.ts`) with a `useLivePqi()` hook producing:
- `heat`: time series of `{ t, tInner, tJaw }`, plus constant `sitThreshold = 108`.
- `pressure`: per-cam-degree array `{ camDeg, position, pressure }` for a single cycle, plus `sealingStart` / `sealingEnd` (degrees).
- `dwell`: timestamp series `{ ts, dwellMs }` plus constant `targetMs = 220`.
- `weighted`: `{ heat: { weighted, raw, unit }, pressure: {...}, dwell: {...} }` where `heat.weighted + pressure.weighted + dwell.weighted ≈ pqiScore`.
- `tailing`: timestamp series of `{ ts, value }` for the Tailing Index chart.
- `rawTailing`: latest scalar.

Weights come from Q-BOM (mock constants now: `wHeat=0.45`, `wPressure=0.35`, `wDwell=0.20`).

## Routing

- Add `/pqi` route in `src/App.tsx` pointing to `src/pages/Pqi.tsx`.
- `AppNav` rendered inside `TopBar` (or right below it) on both pages.

## Out of scope

- Wiring real Cerebro / QuestDB feeds (mock only).
- TQI / Config / Q-BOM / Historian / Settings / User Management pages — nav links are placeholders only.
- Backend / persistence.

After you approve, I'll implement and verify visually in the preview.
