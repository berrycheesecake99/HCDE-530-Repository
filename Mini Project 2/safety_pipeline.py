"""
U-District Safety Data Pipeline
--------------------------------
Pulls SPD crime data from Seattle Open Data, filters to nighttime
person-crimes in the University District and surrounding neighborhoods,
overlays on the OSMnx street network with lighting tags, computes
per-segment crime density, and writes corridor_safety.geojson.
"""

import warnings
from pathlib import Path

import folium
import geopandas as gpd
import numpy as np
import osmnx as ox
import pandas as pd
import requests
from branca.element import MacroElement, Template
from shapely.strtree import STRtree

warnings.filterwarnings("ignore", category=FutureWarning)

# ── Configuration ────────────────────────────────────────────────────────────

API_URL = "https://data.seattle.gov/resource/tazs-3rd5.json"

PRECINCT = "North"
NEIGHBORHOODS = [
    "UNIVERSITY",
    "ROOSEVELT/RAVENNA",
    "WALLINGFORD",
    "FREMONT",
    "NORTHGATE",
    "GREENWOOD",
    "BALLARD SOUTH",
]

PERSON_CRIME_SUB_CATS = [
    "ASSAULT OFFENSES",
    "AGGRAVATED ASSAULT",
    "ROBBERY",
    "RAPE",
    "SEX OFFENSES",
    "KIDNAPPING/ABDUCTION",
]

DATE_START = "2024-01-01T00:00:00"
NIGHTTIME_HOURS_START = 19  # 7 PM
NIGHTTIME_HOURS_END = 2     # 2 AM

CENTER_POINT = (47.6613, -122.3131)  # U-District center (lat, lon)
NETWORK_DIST_M = 2000                # Lighter demo radius around U-District

UTM_CRS = "EPSG:32610"
ACCESSIBILITY_TAGS = [
    "surface",
    "wheelchair",
]
OSM_TAGS_TO_KEEP = [
    "lit",
    "name",
    "highway",
    *ACCESSIBILITY_TAGS,
]


def _is_numeric(val) -> bool:
    try:
        float(val)
        return True
    except (ValueError, TypeError):
        return False
OUTPUT_FILE = Path(__file__).parent / "corridor_safety.geojson"
DEMO_OUTPUT_FILE = Path(__file__).parent / "corridor_safety_demo.geojson"
MAP_OUTPUT_FILE = Path(__file__).parent / "safety_map.html"
PAGE_SIZE = 50_000

# ── Step 1: Pull crime data from Socrata API ─────────────────────────────────

def fetch_crime_data() -> pd.DataFrame:
    nbhd_list = ", ".join(f"'{n}'" for n in NEIGHBORHOODS)
    where_clause = (
        f"precinct = '{PRECINCT}' "
        f"AND neighborhood IN ({nbhd_list}) "
        f"AND offense_date >= '{DATE_START}'"
    )
    select_cols = (
        "offense_date, offense_sub_category, offense_category, "
        "latitude, longitude, neighborhood, precinct, beat"
    )

    print(f"[1/7] Fetching crime data from Seattle Open Data ...")

    all_rows: list[dict] = []
    offset = 0
    while True:
        params = {
            "$where": where_clause,
            "$select": select_cols,
            "$order": "offense_date ASC",
            "$limit": str(PAGE_SIZE),
            "$offset": str(offset),
        }
        resp = requests.get(API_URL, params=params, timeout=120)
        resp.raise_for_status()
        page = resp.json()
        if not page:
            break
        all_rows.extend(page)
        offset += PAGE_SIZE
        print(f"       ... fetched {len(all_rows):,} rows so far")

    df = pd.DataFrame.from_records(all_rows)
    print(f"       Total rows from API: {len(df):,}")
    return df


# ── Step 2: Filter to person-crimes ──────────────────────────────────────────

def filter_person_crimes(df: pd.DataFrame) -> pd.DataFrame:
    print("[2/7] Filtering to person-crimes ...")
    upper_sub = df["offense_sub_category"].str.upper()
    mask = upper_sub.isin(PERSON_CRIME_SUB_CATS)
    filtered = df[mask].copy()
    print(f"       Person-crime rows: {len(filtered):,}")
    return filtered


# ── Step 3: Filter to nighttime hours (7 PM – 2 AM) ──────────────────────────

def filter_nighttime(df: pd.DataFrame) -> pd.DataFrame:
    print("[3/7] Filtering to nighttime hours (7 PM – 2 AM) ...")
    df["offense_date"] = pd.to_datetime(df["offense_date"], errors="coerce")
    df = df.dropna(subset=["offense_date"])
    hour = df["offense_date"].dt.hour
    night_mask = (hour >= NIGHTTIME_HOURS_START) | (hour < NIGHTTIME_HOURS_END)
    filtered = df[night_mask].copy()
    print(f"       Nighttime rows: {len(filtered):,}")
    return filtered


# ── Step 4: Pull street network + lighting tags from OSMnx ───────────────────

def fetch_street_network() -> gpd.GeoDataFrame:
    print("[4/7] Downloading street network from OpenStreetMap ...")
    print(f"       Center: {CENTER_POINT}, radius: {NETWORK_DIST_M}m")

    for tag in OSM_TAGS_TO_KEEP:
        if tag not in ox.settings.useful_tags_way:
            ox.settings.useful_tags_way.append(tag)

    G = ox.graph_from_point(
        CENTER_POINT, dist=NETWORK_DIST_M,
        network_type="walk", retain_all=True,
    )

    _, edges = ox.graph_to_gdfs(G)
    edges = edges.reset_index()

    if "lit" not in edges.columns:
        edges["lit"] = None
    for tag in ACCESSIBILITY_TAGS:
        if tag not in edges.columns:
            edges[tag] = None

    print(f"       Street segments: {len(edges):,}")
    return edges


# ── Step 5: Snap crimes to nearest street segment ────────────────────────────

def snap_crimes_to_edges(
    crimes: pd.DataFrame, edges: gpd.GeoDataFrame
) -> gpd.GeoDataFrame:
    print("[5/7] Snapping crime points to nearest street segments ...")
    crimes = crimes.dropna(subset=["latitude", "longitude"])
    crimes = crimes[
        crimes["latitude"].apply(lambda v: _is_numeric(v))
        & crimes["longitude"].apply(lambda v: _is_numeric(v))
    ].copy()
    crimes["latitude"] = crimes["latitude"].astype(float)
    crimes["longitude"] = crimes["longitude"].astype(float)

    crime_gdf = gpd.GeoDataFrame(
        crimes,
        geometry=gpd.points_from_xy(crimes["longitude"], crimes["latitude"]),
        crs="EPSG:4326",
    )

    crime_proj = crime_gdf.to_crs(UTM_CRS)
    edges_proj = edges.to_crs(UTM_CRS)

    tree = STRtree(edges_proj.geometry.values)
    nearest_idx = [tree.nearest(pt) for pt in crime_proj.geometry]

    edges_proj["crime_count"] = 0
    counts = pd.Series(nearest_idx).value_counts()
    for idx, count in counts.items():
        edges_proj.at[edges_proj.index[idx], "crime_count"] = count

    print(f"       Crimes snapped: {len(crime_proj):,}")
    return edges_proj


# ── Step 6: Compute density ──────────────────────────────────────────────────

def compute_density(edges: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    print("[6/7] Computing crime density per segment ...")
    edges["length_m"] = edges.geometry.length
    edges["crime_density"] = edges["crime_count"] / (edges["length_m"] / 1000)
    edges["crime_density"] = (
        edges["crime_density"].replace([np.inf, -np.inf], 0).fillna(0)
    )
    return edges


def _has_any_value(row: pd.Series, fields: list[str]) -> bool:
    for field in fields:
        value = row.get(field)
        if isinstance(value, list) and len(value) > 0:
            return True
        if value is not None and pd.notna(value):
            return True
    return False


def add_accessibility_and_score(edges: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    print("       Adding accessibility flags and corridor score ...")

    max_density = edges["crime_density"].quantile(0.95)
    if not max_density or pd.isna(max_density):
        max_density = 1

    edges["crime_density_score"] = (
        (edges["crime_density"] / max_density) * 60
    ).clip(0, 60)

    lit_values = edges["lit"].astype(str).str.lower()
    edges["lighting_penalty"] = np.select(
        [
            lit_values.isin(["yes", "automatic", "24/7"]),
            lit_values.isin(["no"]),
        ],
        [0, 15],
        default=8,
    )

    highway_values = edges["highway"].astype(str).str.lower()
    edges["path_type_penalty"] = np.select(
        [
            highway_values.str.contains("steps", na=False),
            highway_values.str.contains("footway|path|service", na=False),
        ],
        [30, 10],
        default=0,
    )

    surface_values = edges["surface"].astype(str).str.lower()
    wheelchair_values = edges["wheelchair"].astype(str).str.lower()

    rough_surface = surface_values.str.contains(
        "gravel|dirt|earth|ground|unpaved|cobblestone|sett", na=False
    )
    wheelchair_barrier = wheelchair_values.str.contains(
        "no|limited", na=False
    )

    edges["accessibility_penalty"] = (
        rough_surface.astype(int) * 10
        + wheelchair_barrier.astype(int) * 20
    ).clip(0, 35)

    edges["has_accessibility_data"] = edges.apply(
        lambda row: _has_any_value(row, ACCESSIBILITY_TAGS), axis=1
    )
    edges["potential_wheelchair_barrier"] = (
        (edges["path_type_penalty"] >= 30)
        | (edges["accessibility_penalty"] >= 15)
    )
    edges["corridor_score"] = (
        edges["crime_density_score"]
        + edges["lighting_penalty"]
        + edges["path_type_penalty"]
        + edges["accessibility_penalty"]
    ).clip(0, 100)
    edges["corridor_level"] = pd.cut(
        edges["corridor_score"],
        bins=[-1, 25, 55, 100],
        labels=["Lower concern", "Use caution", "Consider alternate route"],
    ).astype(str)

    return edges


# ── Step 7: Write GeoJSON ─────────────────────────────────────────────────────

def prepare_output_edges(edges: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    edges_out = edges.to_crs("EPSG:4326").copy()

    keep_cols = [
        "geometry", "crime_count", "crime_density",
        "lit", "length_m", "name", "highway",
        "surface", "wheelchair",
        "has_accessibility_data", "potential_wheelchair_barrier",
        "crime_density_score", "lighting_penalty", "path_type_penalty",
        "accessibility_penalty", "corridor_score", "corridor_level",
    ]
    for col in keep_cols:
        if col not in edges_out.columns:
            edges_out[col] = None
    edges_out = edges_out[keep_cols]

    def _simplify(val):
        if isinstance(val, list):
            return ", ".join(str(v) for v in val)
        return val

    for col in edges_out.columns:
        if col != "geometry":
            edges_out[col] = edges_out[col].apply(_simplify)

    return edges_out


def has_lighting_data(value) -> bool:
    return pd.notna(value) and str(value).strip().lower() not in {"", "nan", "none"}


def write_geojson(edges: gpd.GeoDataFrame) -> None:
    print("[7/7] Writing corridor_safety.geojson and corridor_safety_demo.geojson ...")
    edges_out = prepare_output_edges(edges)
    edges_out.to_file(OUTPUT_FILE, driver="GeoJSON")

    demo_mask = (
        (edges_out["crime_count"].astype(float) > 0)
        | (edges_out["potential_wheelchair_barrier"].astype(str) == "True")
        | edges_out["lit"].apply(has_lighting_data)
    )
    demo_edges = edges_out[demo_mask].copy()
    demo_edges.to_file(DEMO_OUTPUT_FILE, driver="GeoJSON")

    print(f"\n  Output: {OUTPUT_FILE}")
    print(f"  Demo output: {DEMO_OUTPUT_FILE}")
    print(f"  Total segments:          {len(edges_out):,}")
    print(f"  Demo segments:           {len(demo_edges):,}")

    with_crimes = edges_out[edges_out["crime_count"].astype(float) > 0]
    print(f"  Segments with crimes:    {len(with_crimes):,}")

    if not with_crimes.empty:
        top = (
            with_crimes.sort_values("crime_density", ascending=False)
            .head(15)[["name", "highway", "crime_count", "crime_density", "lit"]]
            .copy()
        )
        top["name"] = top["name"].fillna("(unnamed)")
        top["crime_density"] = top["crime_density"].astype(float).round(1)
        print("\n  Top-15 highest-density corridors:")
        print(top.to_string(index=False))


# ── Step 8: Generate interactive Folium map ──────────────────────────────────

SCORE_COLORS = {
    "green": "#2ca25f",
    "yellow": "#fec44f",
    "orange": "#f03b20",
    "red": "#8c2d04",
}


def _score_color(score: float) -> str:
    if score >= 75:
        return SCORE_COLORS["red"]
    if score >= 55:
        return SCORE_COLORS["orange"]
    if score >= 25:
        return SCORE_COLORS["yellow"]
    return SCORE_COLORS["green"]


def _make_popup(row) -> str:
    name = row.get("name") or "(unnamed corridor)"
    return (
        f"<b>{name}</b><br>"
        f"<b>Level:</b> {row.get('corridor_level', 'N/A')}<br>"
        f"<b>Corridor score:</b> {float(row.get('corridor_score', 0)):.0f}<br>"
        f"<b>Nighttime crimes:</b> {int(float(row.get('crime_count', 0)))}<br>"
        f"<b>Crime density:</b> {float(row.get('crime_density', 0)):.1f} / km<br>"
        f"<b>Lighting:</b> {row.get('lit') or 'missing'}<br>"
        f"<b>Path type:</b> {row.get('highway') or 'unknown'}<br>"
        f"<b>Surface:</b> {row.get('surface') or 'missing'}<br>"
        f"<b>Wheelchair:</b> {row.get('wheelchair') or 'missing'}<br>"
        f"<b>Potential barrier:</b> {'yes' if str(row.get('potential_wheelchair_barrier')) == 'True' else 'no'}"
    )


LEGEND_HTML = """
{% macro html(this, kwargs) %}
<div style="
    position: fixed; bottom: 30px; right: 20px; z-index: 1000;
    background: white; padding: 14px 18px; border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.18); font-family: sans-serif;
    font-size: 13px; line-height: 1.8;">
    <b style="font-size:14px">Corridor Score</b><br>
    <span style="background:#2ca25f;width:18px;height:5px;display:inline-block;border-radius:3px"></span> Lower concern (0–24)<br>
    <span style="background:#fec44f;width:18px;height:5px;display:inline-block;border-radius:3px"></span> Use caution (25–54)<br>
    <span style="background:#f03b20;width:18px;height:5px;display:inline-block;border-radius:3px"></span> Consider alternate (55–74)<br>
    <span style="background:#8c2d04;width:18px;height:5px;display:inline-block;border-radius:3px"></span> Highest concern (75–100)<br>
    <hr style="margin:6px 0">
    <span style="color:#666;font-size:11px">Planning aid only. Data may be incomplete.</span>
</div>
{% endmacro %}
"""


def generate_map(edges: gpd.GeoDataFrame) -> None:
    print("[8/8] Generating interactive Folium map ...")
    edges_out = prepare_output_edges(edges)

    map_mask = (
        (edges_out["crime_count"].astype(float) > 0)
        | (edges_out["potential_wheelchair_barrier"].astype(str) == "True")
    )
    map_edges = edges_out[map_mask].copy()
    print(f"       Map features: {len(map_edges):,}")

    m = folium.Map(
        location=[CENTER_POINT[0], CENTER_POINT[1]],
        zoom_start=14,
        tiles="cartodbpositron",
    )

    for _, row in map_edges.iterrows():
        score = float(row.get("corridor_score", 0))
        crime_count = float(row.get("crime_count", 0))
        color = _score_color(score)
        weight = 4 if crime_count > 0 else 2
        opacity = 0.9 if crime_count > 0 else 0.5

        geojson = folium.GeoJson(
            row.geometry.__geo_interface__,
            style_function=lambda _f, c=color, w=weight, o=opacity: {
                "color": c,
                "weight": w,
                "opacity": o,
            },
        )
        geojson.add_child(folium.Popup(_make_popup(row), max_width=280))
        geojson.add_to(m)

    legend = MacroElement()
    legend._template = Template(LEGEND_HTML)
    m.get_root().add_child(legend)

    m.save(str(MAP_OUTPUT_FILE))
    print(f"       Map saved: {MAP_OUTPUT_FILE}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    df = fetch_crime_data()
    if df.empty:
        print("No data returned from API. Check filters / network.")
        return

    df = filter_person_crimes(df)
    if df.empty:
        print("No person-crimes found after filtering.")
        return

    df = filter_nighttime(df)
    if df.empty:
        print("No nighttime crimes found after filtering.")
        return

    edges = fetch_street_network()
    edges = snap_crimes_to_edges(df, edges)
    edges = compute_density(edges)
    edges = add_accessibility_and_score(edges)
    write_geojson(edges)
    generate_map(edges)
    print("\nDone.")


if __name__ == "__main__":
    main()
