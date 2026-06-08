## Goal

Let users drop quick incident reports while navigating — Waze-style — so the report is tied to a location on the route and instantly visible to others viewing the map.

## UX

1. **Floating Report button on the navigate screen.** While navigating (or just viewing the map), a circular "Report" FAB sits above the existing controls. Tap → opens a compact bottom sheet.
2. **Quick categories (one-tap).** Same icon set as `/report`: Hazard, Poor lighting, Suspicious activity, Other. Tapping a category immediately submits a report pinned at the user's current GPS location (or the map center if GPS is off), with an optional note field that can be skipped. No long form — the whole flow is ≤ 2 taps, matching Waze.
3. **Map pins for reports.** Every report (existing + new) renders as a small colored marker on the map (color per type). Tapping a pin opens an InfoWindow with type, note, time, and "x meters away" if navigating.
4. **Live alerts along the route.** Reports within ~25 m of the upcoming-path window (already computed for hazard look-ahead) fire a toast: `Heads up: ${type} reported ~${meters} m ahead — "${note}"`. Reuses the existing `firedAlertsRef` dedupe with `report-${id}` IDs.
5. **Dedicated `/report` page stays** for browsing the feed and submitting longer reports without being in navigation.

## Data

Extend the existing `Report` type in `src/lib/safewalk-data.ts` with optional `lat` / `lng` fields (back-compat: old reports without coords still render in the feed, just not on the map). Continues to use `localStorage` + the `safewalk:reports` event — no backend changes.

## Files touched

- `src/lib/safewalk-data.ts` — add `lat?`, `lng?` to `Report`.
- `src/routes/_app.navigate.tsx`:
  - Load `getReports()` on mount, subscribe to `safewalk:reports`, render markers for reports with coords.
  - Add `ReportFab` + bottom-sheet component (in-file) with the 4 categories and optional note.
  - On submit: call `addReport({ ..., lat, lng })` using `userLatLngRef.current` (fallback to `map.getCenter()`); toast "Report submitted".
  - In `checkLiveAlerts(ahead)`: scan reports against `ahead` window, fire toast for nearby ones.
- `src/routes/_app.report.tsx` — unchanged behavior; reports submitted from the map appear in the feed automatically.

## Out of scope

- No upvote / confirm / "still there?" flow.
- No expiry / auto-cleanup of old reports.
- No sharing across devices (still localStorage).
