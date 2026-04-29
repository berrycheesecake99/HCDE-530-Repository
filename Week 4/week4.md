# Week 4 Summary

This file explains what I built for Week 4, how I built it, and how the work supports my competency claims.

## What I did

- Wrote `Week 4/fetch_wdfw_deer_areas.py` to call the Washington WDFW Deer Areas API and parse JSON records.
- Extracted all available fields from each deer-area record (`features` -> `attributes`).
- Added `find_largest_deer_areas(data, top_n=5)` to sort by size and print the top five largest deer areas.
- Added `save_to_csv(data, filename="deer_areas.csv")` to export all records to a CSV file.
- Produced a second output file, `Week 4/top_5_largest_deer_areas.csv`, with only the five largest deer areas.
- Improved readability by printing `Unknown` when a field value is missing (for example a blank `DA_Name`).

## How I did it

1. Used Claude first to brainstorm an interesting way to use an API and to iterate on function ideas.
2. Implemented and refined the script in Cursor to match assignment requirements.
3. Read the API URL parameters:
   - `outFields=*` to request all fields
   - `where=1%3D1` to request all records
   - `f=json` to return JSON
4. Inspected the response structure (`features` -> `attributes`) and identified the size field (`Shape.STArea()`).
5. Wrote reusable functions to:
   - fetch JSON from API
   - extract records
   - sort and print largest deer areas
   - save results to CSV files
6. Ran the script and verified:
   - printed top-5 deer areas
   - full export CSV (`deer_areas.csv`)
   - top-5 export CSV (`top_5_largest_deer_areas.csv`)

## Files produced

- `Week 4/fetch_wdfw_deer_areas.py`
- `Week 4/deer_areas.csv`
- `Week 4/top_5_largest_deer_areas.csv`
- `deer_areas.csv` is for full browsing/filtering in Excel, while `top_5_largest_deer_areas.csv` is a quick reference for the largest areas.

## Competency claims

### C1 - Vibecoding and Rapid Prototyping

I used AI tools for ideation and function design, then made scope decisions and implemented in Cursor.

### C2 - Code Literacy and Documentation

I demonstrate C2 by:

- Writing a multi-function Python script with clear structure.
- Adding inline comments that explain why each step is needed (API parameters, field meanings, and CSV export rationale).
- Using docstrings on functions such as:
  - `fetch_deer_areas(api_url)`
  - `extract_records(data)`
  - `find_largest_deer_areas(data, top_n=5)`
  - `save_to_csv(data, filename="deer_areas.csv")`
- Using specific commit language. My Week 4 commit message is: `feat: add deer areas API script with top-5 size ranking and CSV export`.

### C4 - APIs and Data Acquisition

I demonstrate C4 by:

- Choosing the WDFW deer dataset because I am interested in wildlife, especially deer, and the API is publicly available without an API key.
- Making an HTTP request in Python and parsing JSON from a real-world endpoint.
- Explaining the endpoint response: it returns deer management area records with fields such as area ID, area name, in-effect description, polygon area (`Shape.STArea()`), and boundary length (`Shape.STLength()`).
- Converting the response into usable outputs:
  - `deer_areas.csv` contains all 19 records and all available fields for full browsing/filtering in Excel.
  - `top_5_largest_deer_areas.csv` is a quick, pre-filtered view for users who only need the largest areas.
- Applying a human-centered data access lens: the same information is often buried in shapefiles or interactive maps, while CSV makes it accessible to people without GIS tools.
