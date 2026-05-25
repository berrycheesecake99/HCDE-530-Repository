# Week 4 Summary

This file explains what I built for Week 4, how I built it, and how the work supports my competency claims.

## What I did

- Wrote `Week 4/fetch_wdfw_deer_areas.py` to call the Washington WDFW 2026-2027 deer hunting areas API and parse JSON records.
- Extracted all available fields from each deer hunting area record (`features` -> `attributes`).
- Added `find_largest_deer_areas(data, top_n=5)` to sort by the available spatial size field and print the top five deer hunting areas.
- Added `save_to_csv(data, filename="deer_hunting_areas_2026_2027.csv")` to export all records to a CSV file.
- Produced a second output file, `top_5_largest_deer_hunting_areas_2026_2027.csv`, with only the top five records.
- Improved readability by printing `Unknown` when a field value is missing (for example a blank `DA_Name`).

## How I did it

1. Used Claude first to brainstorm an interesting way to use an API and to iterate on function ideas.
2. Implemented and refined the script in Cursor to match assignment requirements.
3. Read the API URL parameters:
   - `outFields=*` to request all fields
   - `where=1%3D1` to request all records
   - `f=json` to return JSON
4. Inspected the response structure (`features` -> `attributes`) and identified available spatial fields in this layer (including `Shape.STLength()`).
5. Wrote reusable functions to:
   - fetch JSON from API
   - extract records
   - sort and print deer hunting areas by available spatial size field
   - save results to CSV files
6. Ran the script and verified:
   - printed top-5 deer hunting areas
   - full export CSV (`deer_hunting_areas_2026_2027.csv`)
   - top-5 export CSV (`top_5_largest_deer_hunting_areas_2026_2027.csv`)

## Files produced

- `Week 4/fetch_wdfw_deer_areas.py`
- `deer_hunting_areas_2026_2027.csv` - full dataset with all records/fields for browsing and filtering in Excel
- `top_5_largest_deer_hunting_areas_2026_2027.csv` - quick reference with the top five records ranked by the available spatial size field

## Competency claims

### C1 - Vibecoding and Rapid Prototyping

I used Claude to brainstorm function ideas and scope the assignment, then implemented and refined the script in Cursor. I made judgment calls about what to include, focusing on top-5 ranking and CSV outputs rather than implementing everything the AI suggested.

### C2 - Code Literacy and Documentation

I demonstrate C2 by:

- Writing a multi-function Python script with clear structure.
- Adding inline comments that explain why each step is needed (API parameters, field meanings, and CSV export rationale).
- Using docstrings on functions such as:
  - `fetch_deer_areas(api_url)`
  - `extract_records(data)`
  - `find_largest_deer_areas(data, top_n=5)`
  - `save_to_csv(data, filename="deer_hunting_areas_2026_2027.csv")`
- Using specific commit language. My Week 4 commit message is: `feat: update WDFW 2026-2027 deer hunting dataset URL, filenames, and top-5 ranking fallback`.

### C4 - APIs and Data Acquisition

I demonstrate C4 by:

- Choosing the WDFW deer hunting dataset because I am interested in wildlife, especially deer, and the API is publicly available without an API key.
- Making an HTTP request in Python and parsing JSON from a real-world endpoint.
- Explaining the endpoint response: it returns legally defined deer hunting area records for Washington State (2026-2027 season), with fields such as area identifiers/names, in-effect description, active indicator, and spatial attributes.
- Converting the response into usable outputs:
  - `deer_hunting_areas_2026_2027.csv` contains all records and all available fields for full browsing/filtering in Excel.
  - `top_5_largest_deer_hunting_areas_2026_2027.csv` is a quick, pre-filtered view for users who only need the top five records.
- Applying a human-centered data access lens: the same information is often buried in shapefiles or interactive maps, while CSV makes it accessible to people without GIS tools.

## HCD Reflection

As a UX researcher, I think about whether systems are actually working for the people they were built for. Government data is technically public, but that doesn't mean it's actually accessible. Most people don't have GIS software or know how to work with shapefiles — so even though this data exists, it isn't reaching the people who need it.

That matters more than it might seem. WDFW is actively managing deer populations through a complex and frequently updated set of regulations — CWD testing requirements, baiting bans, carcass transport restrictions, lottery draws replacing over-the-counter tags in struggling regions. These are not minor rules. Getting them wrong has real consequences for hunters, for wildlife, and for public health. A hunter who doesn't know they're required to submit a deer head for CWD testing within five days, or that they can't transport a carcass out of Eastern Washington, is not just breaking a rule — they could be contributing to the spread of a fatal disease.

This dataset is also directly useful for WDFW itself. Biologists and wildlife managers need to monitor deer populations and herd health across a large and geographically varied state. Having hunting area data in a clean, structured format makes it easier to cross-reference boundary data with disease outbreak reports, EHD tracking, and harvest numbers. When data is locked in specialist formats, even people inside the agency may struggle to work across datasets quickly.

For the general public, the same accessibility problem becomes a safety problem. If hunting area boundaries and regulation changes are only available in formats that require specialist tools, the people most affected — hunters, rural residents, farmers near these areas — won't find that information when they need it. A local community group, a hunting forum, a journalist covering an EHD outbreak, or a first-time hunter planning a trip can now actually use this data.

That's what HCD means to me here: the gap between data that exists and data that people can act on is a design problem. And closing that gap, even in a small way, is part of what it means to build systems that actually serve the public.
