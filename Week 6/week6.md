# Week 6 — Mini Project 1 Competency Claims

I am claiming **C3**, **C5**, and **C6** for this project. Each claim below cites specific work from my notebook (`week6_mp1_starter.ipynb`) and supporting script (`combine_translate_kcc.py`).

---

## C3 — Data Cleaning and File Handling

My dataset comes from **data.gov.in** (the Indian government's open-data portal for KCC farmer queries). The API does not provide a single download for multiple states and years, so I filtered and downloaded CSV files individually — one per state (Maharashtra, Karnataka, Uttar Pradesh) and one per year (2022, 2023, 2024) — resulting in roughly 36 separate CSV files organized into per-state folders.

I intentionally focused on **March, April, June, July, September, and October** because these align with India's major cropping cycle checkpoints: late **Rabi** season and harvest (March-April), **Kharif** sowing and early growth with monsoon onset (June-July), and late-season/harvest decision periods (September-October). Choosing the same season-linked months across all three states made the year-to-year and state-to-state comparisons more meaningful.

I wrote `combine_translate_kcc.py` to merge all of those per-state, per-year CSVs into a single `combined_kcc_3states_en.csv`. I also used Google Translate (via `deep_translator`) to translate `KccAns` into English and store it in `KccAns_en`, so I could analyze responses consistently across Marathi, Kannada, and Hindi entries. During that process I handled several real data problems:

- **Encoding issues:** The source CSVs contained Marathi, Kannada, and Hindi text. I used `utf-8-sig` encoding to read them without mojibake.
- **Inconsistent formatting:** The `QueryType` column had leading/trailing whitespace that caused the same category to appear as separate values in `value_counts()`. I fixed this with `.str.strip()` to create a clean `QueryType_clean` column.
- **Mismatched time windows:** Maharashtra's data included 2025 rows while the other two states only went through 2024. I filtered out Maharashtra 2025 so all three states cover the same 2022–2024 window and comparisons are fair.
- **Bad source file:** I initially downloaded a wrong file for Karnataka, which created duplicate entries for March 2023 and inflated that month's count. I diagnosed the spike in my Q2 line chart, traced it back to the source CSV, re-downloaded the correct file from data.gov.in, and rebuilt the pipeline.

I also diagnosed a `FileNotFoundError` traceback in the notebook. The error occurred because the Jupyter kernel's working directory did not match the notebook's location, so all relative paths failed. The traceback pointed to the `raise FileNotFoundError(...)` line I had written, and the printed candidate list showed none of the paths existed from the kernel's CWD. I fixed it by adding an absolute-path candidate first (`pathlib.Path('/Users/.../combined_kcc_3states_en.csv')`) with relative-path fallbacks, so the notebook loads correctly regardless of where the kernel starts.

---

## C5 — Data Analysis with Pandas

My notebook answers six analytical questions about 5,400 KCC farmer queries using pandas. I used at least the following pandas operations across these questions:

- **`value_counts()`** — to compute the overall query-type distribution (Q1) and identify dominant categories (Q4).
- **`groupby().size().reset_index()`** — to aggregate query counts by state, year, and query type for the Q2 trend analysis, and by district for Q3 and Q5.
- **`pivot_table()`** — to reshape district-level data into a wide format comparing Government Schemes vs. Agronomy Advice demand (Q5).
- **`nsmallest()` and `nlargest()`** — to identify the bottom-5 lowest-volume districts (Q3) and the top-40 districts for the scatter comparison (Q5).
- **Boolean filtering** — `df[df['year'].between(2022, 2024)]` to restrict the time window, `df[df['QueryType_clean'].isin(TECH_TYPES)]` to isolate technical queries (Q6).
- **Derived columns** — I created `demand_group` (classifying each row as "Government Schemes", "Agronomy Advice", or "Other") and `district_label` (combining district and state names for readable axis labels).

One finding I interpreted in the notebook: I grouped queries by `QueryType_clean` and `StateName` across years and found that Weather queries are declining in all three states while Government Schemes queries are rising sharply. That pattern suggested farmers are finding alternative weather sources (e.g., smartphone apps) and increasingly turning to KCC for help navigating government programs — a shift that has staffing implications for KCC call centers.

I also built a keyword-based misclassification audit for the "Cultural Practices" category. Using regex pattern matching on `QueryText`, I inferred an expected category for each row and compared it to the existing tag. About 79% of "Cultural Practices" rows appeared to be mistagged (e.g., queries about pesticides tagged as Cultural Practices instead of Plant Protection). I visualized this with a heatmap and documented the finding as a data-quality limitation.

---

## C6 — Data Visualization and Chart Justification

I am also claiming **C6** because my notebook uses charts to answer specific analytical questions, not just display outputs. I chose each chart type based on the structure of the question and the comparison the reader needed to make:

- **Q1 bar chart:** I used a bar chart for the overall query-type distribution because `QueryType_clean` is categorical. Bars make it easy to compare which farmer issues are most common across the three states, especially when the categories have no natural time order.
- **Q2 line charts:** I used separate line charts for Karnataka, Maharashtra, and Uttar Pradesh because this question is about change from 2022 to 2024. Lines make the direction of change visible, such as Weather declining while Government Schemes rise.
- **Cultural Practices heatmap:** I used a heatmap for the misclassification audit because the goal was to compare current tags against expected keyword-based categories. The heatmap makes the mismatch pattern visible at a glance instead of requiring the reader to inspect rows one by one.
- **Q3 bar charts:** I used bar charts to compare bottom-5 and top-5 districts by call volume, and then to compare what those districts were asking about. This fit the question because the key comparison was across discrete districts and query categories.
- **Q4 Government Schemes vs. Agronomy Advice chart:** I used a grouped bar chart because the question compares two demand types within the same districts. Placing the two bars side by side makes it easier to see whether a district is calling more for administrative help or technical farming advice.
- **Q5 crop/technical-query chart:** I used a bar chart for the top crops generating technical queries by state because the question compares crop-specific support needs across categories. The chart helps show which crops drive the most technical demand in different states.

Together, these chart choices make the analysis easier to evaluate because each visual matches the structure of the question: category comparison, time trend, district comparison, or data-quality audit. I also exported the charts as static PNGs in `chart_pngs/` so the visual evidence renders reliably on GitHub even if interactive Plotly output does not load.
