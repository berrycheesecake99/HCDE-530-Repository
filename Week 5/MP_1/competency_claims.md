# Week 5 — Competency Claims

## C4 — APIs and Data Acquisition

This week I attempted to pull farmer query data from the Kisan Call Centre (KCC) dataset using the data.gov.in API:  
https://api.data.gov.in/resource/cef25fe2-9231-4128-8aec-2c948fedd43f

My original plan was to fetch data for Maharashtra, Uttar Pradesh, and Karnataka across 2023, 2024, and 2025 — three states over three recent years to look at trends over time. I set up API key handling via a `.env` file and `dotenv` so the key never appeared in my code. I wrote a fetch function that made separate calls filtering by `StateName` for each state, combining results using `pd.concat()`. I added retry logic with `backoff_factor` and a timeout of 120 seconds.

The API consistently failed with `ReadTimeout` errors — `requests.exceptions.ReadTimeout` from urllib3 underneath. I diagnosed this as a server-side issue: `api.data.gov.in` was not returning responses within the timeout window. I confirmed this by stripping the request down to a minimal call with no state filter and `limit=5`, which also timed out. The CSV download on the dataset page also failed. A second site I tried, `kcc-chakshu.icar-web.com`, was completely down.

Rather than staying blocked I searched for the same dataset on GitHub and found a 2019 KCC extract at:  
https://github.com/hritiksk392/Farmer-Query-Data-Analysis/tree/master/data/States

This required two changes from my original plan:

1. **States changed**: Maharashtra and Karnataka were not available in this extract. I switched to Madhya Pradesh and Rajasthan alongside Uttar Pradesh.
2. **Year changed**: Instead of 2023–2025 data, this extract covers 2019 only.

I downloaded `MP, UP and Raj.csv` which contains 18,081 rows across Uttar Pradesh, Madhya Pradesh, and Rajasthan. Unlike the API which would have returned state-level aggregates, this file includes district and block level detail — columns include `StateName`, `DistrictName`, `BlockName`, `QueryType`, `Crop`, `KccAns`, `Season`, and `CreatedOn`.

The key change in code: instead of fetching data at runtime via `requests.get()`, I load it once locally with `pd.read_csv("MP, UP and Raj.csv")`. The analysis is identical — only the data source, states, and year changed. I documented the API failure in the notebook loading cell.

## C5 — Data Analysis with Pandas

I used pandas to answer three analytical questions about farmer support demand patterns in the 2019 KCC transcript data across Uttar Pradesh, Madhya Pradesh, and Rajasthan.

**Question 1: What are farmers asking about most?**  
Using `value_counts()` on `QueryType`, Weather queries dominate at 8,233 out of 18,081 total — nearly 45% of all calls. Plant Protection is second at 3,612. This tells us that farmers are primarily calling about immediate threats to their crops rather than planning or market information.

**Question 2: Which queries went unanswered and what were they about?**  
Filtering to rows where `KccAns` is null showed that 8,771 queries — 48.5% of the dataset — have no recorded answer. Weather and Plant Protection dominate the unanswered subset as well, meaning the highest demand topics also have the biggest response gaps. This is a significant service quality finding.

**Question 3: Do farmers in different states call about different problems?**  
Using `groupby()` on `StateName` and `QueryType`, Rajasthan shows a higher concentration of Weather queries relative to its size, while Uttar Pradesh has more Plant Protection calls. This suggests localized support priorities differ by state and that a one-size-fits-all advisory approach may not serve all three states equally well.

All three operations include plain English comments in the notebook explaining what question each cell answers and what the result means about farmer support in India.
