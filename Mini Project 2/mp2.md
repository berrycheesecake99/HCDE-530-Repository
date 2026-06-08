# MP2 Competency Claims - SafeWalk UW

## C1 - Vibecoding and Rapid Prototyping

I used Lovable and Cursor as rapid prototyping tools to build SafeWalk, a deployed mobile-first web app for UW students walking through the U-District at night. This was not a single-prompt build. I compared several outputs and directions before choosing the final version. Cursor helped me build functional prototypes, including a vanilla HTML/Leaflet version, but the visual design and interaction detail did not feel refined enough for a safety-focused app. I also compared Leaflet, Mapbox, and Google Maps approaches, then chose Google Maps in Lovable because it gave the strongest route-search and navigation experience for the deployed prototype.

The final Lovable app is deployed at <https://bright-stride-shine.lovable.app>. It includes a mock UW NetID login, Google Maps navigation, color-coded safety corridors, walking buddy groups, incident reporting, and SOS emergency contacts. I kept the earlier Leaflet version in the repo as evidence of the prototyping path, but the Lovable version became the final public tool because it better matched the level of polish I wanted.

**Evidence:** `SafeWalk/` contains the Lovable app; `index.html`, `app.js`, `map.js`, and `style.css` contain the earlier vanilla/Leaflet prototype; the deployed app is linked in `README.md`.

## C2 - Code Literacy and Documentation

I documented the project so someone outside the class can understand what SafeWalk does, who it is for, how to access it, and how to run it locally. The `README.md` explains the deployed Lovable app, the Python data pipeline, the data sources, and the project structure in plain language. I also refined the README after checking the code, correcting places where the wording was too broad or inaccurate, such as clarifying that the deployed app uses a lighter demo subset of the GeoJSON and that local Google Maps features may require API environment variables.

My commit messages describe what changed and why, not just "update." For example, I used separate commits for the safety data pipeline, the SafeWalk app/prototype, and the submission files. The Python file is also organized into named functions for each major step: fetching crime data, filtering person-crimes, filtering nighttime hours, pulling the street network, snapping crimes to street segments, computing density, scoring corridors, writing GeoJSON, and generating the map.

**Evidence:** `README.md`, `safety_pipeline.py`, and commit messages including "Add MP2 safety data pipeline and corridor GeoJSON output" and "Add SafeWalk app: Lovable prototype and vanilla HTML fallback."

## C4 - APIs and Data Acquisition

SafeWalk uses multiple APIs and structured data sources. The Python pipeline calls the Seattle Open Data API endpoint `https://data.seattle.gov/resource/tazs-3rd5.json` to pull SPD crime records. It filters those records by precinct, neighborhood, date, crime category, and nighttime hour. The same pipeline uses OSMnx to pull OpenStreetMap walking-network data around the U-District, including lighting, surface, and wheelchair-accessibility tags.

In addition to structured API data, I also used qualitative community data from Reddit/r/udub posts. I translated those student-reported concerns into a set of `COMMUNITY_HOTSPOTS` in the Lovable app, with names, coordinates, radius values, and short safety tips. These hotspots appear as a separate community layer on the map, so the app combines official SPD data with student-reported lived experience.

The app also uses Google Maps APIs through the Lovable connector. The navigate screen uses place search for destination lookup and walking route computation for turn-by-turn-style route display. I did not commit API keys to the public repository. The README now notes that the live Lovable deployment is the easiest way to view the full map experience, while local development may require Google Maps and Lovable connector environment variables.

**Evidence:** `safety_pipeline.py` (`API_URL`, `fetch_crime_data()`, `fetch_street_network()`), `SafeWalk/src/lib/safewalk-data.ts` (`COMMUNITY_HOTSPOTS`), `SafeWalk/src/lib/maps.functions.ts` (Google Places and Routes server functions), and `SafeWalk/src/routes/_app.navigate.tsx` (Google Maps client integration and hotspot rendering).

## C7 - Critical Evaluation and Professional Judgment

I evaluated the AI-generated and platform-generated output instead of accepting the first working version. One example was the map platform decision: the Cursor/Leaflet prototype was functional, but it did not have the level of visual refinement and navigation detail I wanted for a safety app. I compared Leaflet, Mapbox, and Google Maps, then chose Google Maps in Lovable because it produced a clearer, more familiar route-search and walking-navigation experience.

I also verified claims about the deployed app and data connection. At first, the deployment URL was inferred incorrectly from metadata, so I checked and used the actual Lovable URL: <https://bright-stride-shine.lovable.app>. I also compared the local GeoJSON files and confirmed that the app's `SafeWalk/public/corridor_safety.geojson` matches the lighter `corridor_safety_demo.geojson`, not the full 19 MB output. That led me to update the README so it accurately describes the deployed app as using a demo subset for performance. I also corrected the README's crime-category wording so it matched the actual pipeline instead of overstating what was filtered.

I also decided to supplement official SPD data with qualitative r/udub student reports because public crime records do not capture every place students perceive as unsafe. I kept those hotspots separate from the SPD corridor score so the app does not present qualitative reports as official crime statistics.

**Evidence:** `README.md` corrections, `SafeWalk/public/corridor_safety.geojson`, `corridor_safety_demo.geojson`, and `safety_pipeline.py`.

## C8 - Building and Deploying a Complete Tool

My MP2 deliverable is a complete deployed tool, not just a local script. SafeWalk is available at <https://bright-stride-shine.lovable.app> and is designed for UW students, professors, and campus police walking through the U-District after dark. The tool combines a real data pipeline with an interactive app: the pipeline creates corridor safety data from SPD crime records and OpenStreetMap street attributes, and the app turns that data into a mobile map experience with navigation, alerts, reporting, buddies, and emergency resources.

The project repository contains the complete code, the deployed app link, a README for non-technical readers, this competency claim file, and `reflection.md`. One limitation is that the app is still a prototype: authentication, walking buddy matching, and incident reports are stored locally rather than in a shared backend. If I continued this project, I would add a real database and shared reporting system so reports and buddy coordination work across devices.

**Evidence:** `SafeWalk/`, `safety_pipeline.py`, `README.md`, `reflection.md`, deployed Lovable URL, and the committed GitHub repository.
