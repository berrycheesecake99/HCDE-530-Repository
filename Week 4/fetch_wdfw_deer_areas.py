"""
Fetch and summarize Washington WDFW deer area data from ArcGIS REST.
"""
#importing the csv library
import csv

try:
    import requests
except ImportError:  # pragma: no cover - this is a runtime environment safeguard
    requests = None

# This API URL asks the WDFW ArcGIS service for all deer area records.
# - outFields=* means "include every attribute field available"
# - where=1%3D1 means "do not filter; return all records"
# - f=json means "return the response in JSON format"
API_URL = (
    "https://geodataservices.wdfw.wa.gov/arcgis/rest/services/"
    "MapServices/SharedReferenceLayers/MapServer/2/query?outFields=*&where=1%3D1&f=json"
)

#function to fetch the deer areas from the API
def fetch_deer_areas(api_url):
    """Call the API and return the parsed JSON response."""
    response = requests.get(api_url, timeout=30)
    response.raise_for_status()
    return response.json()

#function to extract the records from the API response
def extract_records(data):
    """
    Extract as many fields as possible from each record.

    The response JSON contains:
    - metadata (field names, aliases, and data types)
    - features (a list of deer area records)
    - each feature usually has an "attributes" dictionary with the record fields
    """
    records = []
    for feature in data.get("features", []):
        # "attributes" holds the deer-area fields we care about (ID, name, dates, area, etc.).
        attributes = feature.get("attributes", {})
        if not isinstance(attributes, dict):
            continue
        # Copy all fields so we keep as much data as the API provides.
        records.append(attributes.copy())
    return records

#function to find the largest deer areas
def find_largest_deer_areas(data, top_n=5):
    """
    Sort deer areas by size and print the top N with all fields.

    This is useful for a hunter or wildlife manager because it quickly identifies
    the largest management areas, which can help with trip planning, effort
    allocation, and comparing where broad habitat coverage exists.
    """
    records = extract_records(data)
    if not records:
        print("No deer area records were found in the API response.")
        return []

    # Common size/area field names used in GIS responses.
    size_field_candidates = ("Shape.STArea()", "Shape_Area", "AREA", "Area", "area")
    size_field = next((name for name in size_field_candidates if name in records[0]), None)

    if size_field is None:
        print("Could not find a size field in the records.")
        print(f"Available fields: {', '.join(sorted(records[0].keys()))}")
        return []

    def safe_size_value(record):
        """Return a numeric area value; treat missing or invalid values as zero."""
        value = record.get(size_field, 0)
        return value if isinstance(value, (int, float)) else 0

    largest_records = sorted(records, key=safe_size_value, reverse=True)[:top_n]

    print(f"Top {top_n} largest deer areas (sorted by '{size_field}'):\n")
    for rank, record in enumerate(largest_records, start=1):
        print(f"{rank}. Deer Area")
        for field_name, field_value in record.items():
            # Field meanings from this API:
            # - OBJECTID: internal unique row ID in the ArcGIS layer
            # - DA_Id: deer area number used by WDFW
            # - DA_Name: deer area name
            # - In_Effect_Desc: date range when this area definition is in effect
            # - Shape.STArea(): GIS-computed polygon area value
            # - Shape.STLength(): GIS-computed boundary/perimeter length value
            display_value = "Unknown" if field_value in (None, "") else field_value
            print(f"   {field_name}: {display_value}")
        print("-" * 60)

    return largest_records
#function to save the records to a CSV file

def save_to_csv(data, filename="deer_areas.csv"):
    """Extract all available record fields and save them to a CSV file."""
    records = extract_records(data)
    if not records:
        print("No deer area records were found, so no CSV file was created.")
        return

    # Build a complete header list so we keep every field seen across all records.
    fieldnames = []
    seen = set()
    for record in records:
        for key in record.keys():
            if key not in seen:
                seen.add(key)
                fieldnames.append(key)
#open the file and write the records to the CSV file
    with open(filename, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(record)

    print(f"Saved {len(records)} records to {filename}")

#function to main the program
def main():
    """Fetch deer-area data, then print the top largest areas."""
    if requests is None:
        print("The 'requests' library is required. Install it with: pip install requests")
        return
#try to fetch the deer areas from the API
    try:
        api_data = fetch_deer_areas(API_URL)
    except requests.RequestException as error:
        print(f"API request failed: {error}")
        return
    except ValueError as error:
        print(f"Could not decode JSON response: {error}")
        return

    # Run the size ranking so we can immediately review the largest deer areas.
    find_largest_deer_areas(api_data, top_n=5)
    # Saving to CSV makes the data easy to open in Excel and share without GIS software.
    save_to_csv(api_data, filename="deer_areas.csv")

#function to run the program
if __name__ == "__main__":
    main()
