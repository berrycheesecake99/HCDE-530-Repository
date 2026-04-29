import csv
import json
import time
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

# iNaturalist public observations endpoint. It returns paginated JSON with:
# - total_results: number of matching observations
# - page/per_page: current pagination window
# - results: list of observation objects (one dict per observation)
API_URL = "https://api.inaturalist.org/v1/observations"
OUTPUT_CSV = Path(__file__).with_name("puget_sound_marine_observations.csv")

# Pull one year of data so the CSV can support simple seasonal analysis.
LAST_YEAR_START = (date.today() - timedelta(days=365)).isoformat()
TODAY = date.today().isoformat()

# We collect at least this many rows across all marine-focused queries.
MIN_RECORDS = 50
PER_PAGE = 50
MAX_RETRIES = 4
REQUESTED_PLACE_ID = 26

# Separate query groups keep the API filters explicit:
# - fish via iconic_taxa=Actinopterygii
# - mollusks via iconic_taxa=Mollusca
# - additional marine invertebrate clades via taxon_name
QUERY_GROUPS = (
    {"group_label": "Fish", "iconic_taxa": "Actinopterygii"},
    {"group_label": "Mollusks", "iconic_taxa": "Mollusca"},
    {"group_label": "Marine Invertebrates", "taxon_name": "Cnidaria"},
    {"group_label": "Marine Invertebrates", "taxon_name": "Echinodermata"},
    {"group_label": "Marine Invertebrates", "taxon_name": "Malacostraca"},
)


def fetch_json(params):
    """Fetch one page of JSON data with retry/rate-limit handling."""
    query = urlencode(params)
    url = f"{API_URL}?{query}"
    request = Request(
        url,
        headers={
            # A custom user agent helps API maintainers identify traffic.
            "User-Agent": "hcde530-puget-sound-marine-observations-script",
            "Accept": "application/json",
        },
    )

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            with urlopen(request, timeout=30) as response:
                if response.status != 200:
                    raise HTTPError(
                        url, response.status, "Unexpected status code", response.headers, None
                    )
                payload = response.read().decode("utf-8")
                return json.loads(payload)
        except HTTPError as error:
            # 429 means rate limit: wait for Retry-After seconds if provided.
            if error.code == 429 and attempt < MAX_RETRIES:
                retry_after = error.headers.get("Retry-After", "2") if error.headers else "2"
                try:
                    wait_seconds = max(1, int(retry_after))
                except ValueError:
                    wait_seconds = 2
                print(f"Rate limited (429). Waiting {wait_seconds}s before retrying...")
                time.sleep(wait_seconds)
                continue

            # 5xx errors are usually temporary; use simple exponential backoff.
            if 500 <= error.code < 600 and attempt < MAX_RETRIES:
                wait_seconds = attempt * 2
                print(f"Server error {error.code}. Retrying in {wait_seconds}s...")
                time.sleep(wait_seconds)
                continue
            raise
        except (URLError, json.JSONDecodeError) as error:
            if attempt < MAX_RETRIES:
                wait_seconds = attempt * 2
                print(f"Request parse/network error ({error}). Retrying in {wait_seconds}s...")
                time.sleep(wait_seconds)
                continue
            raise

    # This line is defensive; loop returns or raises above.
    raise RuntimeError("fetch_json failed after retries")


def parse_location(observation):
    """Extract latitude/longitude from geojson first, then from location string."""
    # JSON key meaning:
    # - geojson.coordinates is [longitude, latitude]
    geojson = observation.get("geojson") or {}
    coordinates = geojson.get("coordinates") or []
    if isinstance(coordinates, list) and len(coordinates) >= 2:
        return coordinates[1], coordinates[0]

    # Fallback JSON key:
    # - location is "latitude,longitude" as a string
    location = observation.get("location", "")
    if isinstance(location, str) and "," in location:
        pieces = location.split(",", 1)
        try:
            return float(pieces[0].strip()), float(pieces[1].strip())
        except ValueError:
            return None, None
    return None, None


def extract_conservation_status(taxon):
    """Convert taxon conservation JSON into a readable status value."""
    # JSON key meaning:
    # - taxon.conservation_status may contain status_name (e.g., "endangered")
    conservation = taxon.get("conservation_status") or {}
    if not isinstance(conservation, dict):
        return ""
    return str(
        conservation.get("status_name")
        or conservation.get("status")
        or conservation.get("iucn")
        or ""
    ).strip()


def build_row(observation, fallback_group):
    """Build one CSV row from an observation dictionary."""
    # JSON key meaning:
    # - taxon holds species-level classification details
    taxon = observation.get("taxon") or {}
    if not isinstance(taxon, dict):
        taxon = {}

    latitude, longitude = parse_location(observation)

    # JSON key meaning:
    # - observed_on is the calendar date the organism was observed
    observed_on = str(observation.get("observed_on") or "").strip()
    observation_month = observed_on[:7] if len(observed_on) >= 7 else ""

    # JSON key meaning:
    # - user.login is the account that created the observation
    user = observation.get("user") or {}
    observer_login = str(user.get("login") or "").strip() if isinstance(user, dict) else ""

    taxon_group = str(taxon.get("iconic_taxon_name") or fallback_group).strip()

    return {
        "observation_id": observation.get("id"),
        "species_name": str(taxon.get("name") or "").strip(),
        "common_name": str(taxon.get("preferred_common_name") or "").strip(),
        "taxon_group": taxon_group,
        "observation_date": observed_on,
        "observation_month": observation_month,
        "latitude": latitude,
        "longitude": longitude,
        # JSON key meaning:
        # - place_guess is a human-readable place string from the observer
        "place_name": str(observation.get("place_guess") or "").strip(),
        "conservation_status": extract_conservation_status(taxon),
        "observer_login": observer_login,
        # We fill observer_count after collecting all rows (unique users per species).
        "observer_count": 0,
    }


def collect_rows_for_mode(min_records, use_place_id):
    """Collect rows for one filtering mode."""
    rows = []
    seen_observation_ids = set()

    for group in QUERY_GROUPS:
        page = 1
        while len(rows) < min_records:
            # Parameter meanings:
            # - place_id=26: requested place filter from assignment prompt
            # - quality_grade=research: community-verified observations
            # - d1/d2: date range (last year)
            # - page/per_page: pagination controls
            # - lat/lng/radius: focus near Seattle / Puget Sound area
            # - order_by=observed_on, order=desc: newest first
            params = {
                "quality_grade": "research",
                "d1": LAST_YEAR_START,
                "d2": TODAY,
                "page": page,
                "per_page": PER_PAGE,
                "lat": 47.6062,
                "lng": -122.3321,
                "radius": 50,
                "order_by": "observed_on",
                "order": "desc",
            }
            if use_place_id:
                params["place_id"] = REQUESTED_PLACE_ID

            if "iconic_taxa" in group:
                # iconic_taxa narrows to broad groups like fish/mollusks.
                params["iconic_taxa"] = group["iconic_taxa"]
            if "taxon_name" in group:
                # taxon_name targets named marine invertebrate clades.
                params["taxon_name"] = group["taxon_name"]

            payload = fetch_json(params)
            if not isinstance(payload, dict):
                raise ValueError("Unexpected API payload: not a JSON object")

            observations = payload.get("results", [])
            if not isinstance(observations, list) or not observations:
                break

            for observation in observations:
                if not isinstance(observation, dict):
                    continue

                observation_id = observation.get("id")
                if observation_id in seen_observation_ids:
                    continue
                seen_observation_ids.add(observation_id)

                row = build_row(observation, fallback_group=group["group_label"])
                rows.append(row)

                if len(rows) >= min_records:
                    break

            # If the API returned fewer than requested, there are no more pages.
            if len(observations) < PER_PAGE or len(rows) >= min_records:
                break
            page += 1

    return rows


def fetch_marine_observations(min_records=MIN_RECORDS):
    """Fetch paginated marine observations near Seattle/Puget Sound."""
    # First pass keeps place_id=26 as requested.
    rows = collect_rows_for_mode(min_records=min_records, use_place_id=True)

    if rows:
        return rows

    # Fallback: if place_id=26 produces no rows, keep Seattle-radius filters only.
    # This makes the script resilient if iNaturalist place IDs are remapped over time.
    print("No records with place_id=26; retrying with Seattle/Puget Sound geo filters only...")
    return collect_rows_for_mode(min_records=min_records, use_place_id=False)


def add_observer_counts(rows):
    """Add per-species unique observer counts for trend analysis."""
    observers_by_species = defaultdict(set)
    for row in rows:
        species_key = row.get("species_name", "")
        observer_login = row.get("observer_login", "")
        if species_key and observer_login:
            observers_by_species[species_key].add(observer_login)

    for row in rows:
        species_key = row.get("species_name", "")
        row["observer_count"] = len(observers_by_species.get(species_key, set()))


def write_csv(rows, filename):
    """Write marine observation rows to CSV."""
    fieldnames = [
        "species_name",
        "common_name",
        "taxon_group",
        "observation_date",
        "observation_month",
        "latitude",
        "longitude",
        "place_name",
        "conservation_status",
        "observer_count",
    ]
    with open(filename, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def main():
    try:
        rows = fetch_marine_observations(min_records=MIN_RECORDS)
    except (HTTPError, URLError, json.JSONDecodeError, ValueError, RuntimeError) as error:
        print(f"Could not collect observations: {error}")
        return

    if not rows:
        print("No marine observations were found for the requested filters.")
        return

    add_observer_counts(rows)
    write_csv(rows, OUTPUT_CSV)

    unique_species = {row["species_name"] for row in rows if row.get("species_name")}
    threatened_rows = [
        row
        for row in rows
        if str(row.get("conservation_status", "")).strip().lower()
        in {"endangered", "threatened", "vulnerable", "near threatened", "critically endangered"}
    ]

    print(f"Saved {len(rows)} records to {OUTPUT_CSV.name}")
    print(f"Unique species: {len(unique_species)}")
    print(f"Records with a conservation status flag: {len(threatened_rows)}")


if __name__ == "__main__":
    main()
