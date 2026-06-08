# SafeWalk UW

A nighttime safety companion for University of Washington students walking home through the U-District.

**Live app:** <https://bright-stride-shine.lovable.app>

## What it does

SafeWalk helps students who leave campus late at night find safer walking routes and connect with walking buddies. The tool combines real Seattle Police Department crime data with OpenStreetMap street-lighting and accessibility information to score walkable street segments in the University District on a 0–100 safety scale. The deployed app displays a lighter demo subset of the scored corridors for map performance.

The app has four main screens:

- **Navigate** — Google Maps with color-coded safety corridors, walking directions, live GPS tracking, and proactive alerts that warn you about higher-risk segments ahead.
- **Buddies** — Major-based walking groups (HCDE, CSE, iSchool, etc.) where students can find someone heading the same direction.
- **Report** — Waze-style incident reporting: tap a button on the map to flag a hazard, poor lighting, or suspicious activity at your current location.
- **Profile** — UW NetID mock login, display name, joined groups, and one-tap SOS access to 911, UW SafeCampus, Husky NightWalk, and the 988 Crisis Lifeline.

## Who it's for

UW students, professors, and campus police who walk through the U-District after dark and want route-level safety information and a way to coordinate with others heading the same direction.

## Project structure

```
Mini Project 2/
├── SafeWalk/                  # Lovable app (TanStack Start + React + Google Maps)
│   ├── src/routes/            # App pages: login, navigate, buddies, report, profile
│   ├── src/lib/               # Data models, map server functions, session
│   └── public/                # corridor_safety.geojson (safety overlay data)
├── safety_pipeline.py         # Python data pipeline (SPD API → corridor scores → GeoJSON)
├── corridor_safety.geojson    # Full pipeline output (all street segments)
├── corridor_safety_demo.geojson # Lighter subset (segments with data attached)
├── index.html                 # Vanilla HTML/JS prototype (Leaflet-based fallback)
├── app.js / map.js / buddies.js / style.css  # Vanilla prototype scripts
├── mp2.md                     # Competency claims
└── reflection.md              # 500-word project reflection
```

## How to access

Open the deployed app at **<https://bright-stride-shine.lovable.app>** — no install needed.

## How to run locally

### SafeWalk app (requires Node.js)

```bash
cd "Mini Project 2/SafeWalk"
bun install        # or: npm install
bun run dev        # or: npm run dev; starts at http://localhost:5173
```

The deployed Lovable app is the easiest way to view the project. Running the full map experience locally may require Google Maps and Lovable connector environment variables:

- `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY`
- `VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID`
- `LOVABLE_API_KEY`
- `GOOGLE_MAPS_API_KEY`

### Data pipeline (requires Python 3.10+)

The pipeline pulls live crime data from the Seattle Open Data API and street network data from OpenStreetMap, then writes the GeoJSON files used by the app.

```bash
cd "Mini Project 2"
pip install osmnx geopandas pandas requests shapely folium branca numpy
python safety_pipeline.py
```

Outputs: `corridor_safety.geojson`, `corridor_safety_demo.geojson`, and `safety_map.html`.

## Data sources

- [Seattle Police Department crime data](https://data.seattle.gov/resource/tazs-3rd5.json) — nighttime person-crimes including assault, robbery, rape/sex offenses, and kidnapping in the North Precinct, filtered to the University District and surrounding neighborhoods.
- [OpenStreetMap via OSMnx](https://osmnx.readthedocs.io/) — walkable street network with lighting (`lit`), surface, and wheelchair accessibility tags.
