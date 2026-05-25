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

I used pandas to answer four analytical questions about farmer support demand patterns in the 2019 KCC transcript data across Uttar Pradesh, Madhya Pradesh, and Rajasthan.

**Question 1: What are farmers asking about most?**  
Using `value_counts()` on `QueryType`, Weather queries dominate at 8,233 out of 18,081 total — nearly 45% of all calls. Plant Protection is second at 3,612. This tells us that farmers are primarily calling about immediate threats to their crops rather than planning or market information.

**Question 2: Which queries went unanswered and what were they about?**  
Filtering to rows where `KccAns` is null showed that 8,771 queries — 48.5% of the dataset — have no recorded answer. Weather and Plant Protection dominate the unanswered subset as well, meaning the highest demand topics also have the biggest response gaps. This is a significant service quality finding.

**Question 3: Do farmers in different states call about different problems?**  
Using `groupby()` on `StateName` and `QueryType`, Rajasthan shows a higher concentration of Weather queries relative to its size, while Uttar Pradesh has more Plant Protection calls. This suggests localized support priorities differ by state and that a one-size-fits-all advisory approach may not serve all three states equally well.

**Question 4: Which crops show higher unanswered-query burden?**  
I created a binary indicator with `df["is_unanswered"] = df["KccAns"].isna().astype(int)` and then used `df.groupby("Crop")["is_unanswered"].mean()` to compare average unanswered rates by crop. This extends the analysis from state-level patterns to crop-level service gaps and helps identify where advisory follow-up may be most needed.

All four operations include plain English comments in the notebook explaining what question each cell answers and what the result means about farmer support in India.

## HCD Reflection

Analyzing this dataset matters because the gap between a service's design intent and how people actually use it is a core human-centered design question — and this data makes that gap visible at scale.

KCC was built as a human-staffed agronomic advisory service. The assumption embedded in that design is that farmers primarily need specialized crop expertise. But the data tells a different story: weather queries account for 20.4% of all calls — more than Plant Protection, Nutrient Management, and Fertilizer Use combined. A call agent answering a weather query is likely relaying publicly available forecast information, not the specialized guidance the service was designed to deliver. That mismatch between design intent and actual usage is a signal that the service may need to be redesigned around what farmers are actually asking for — which is a fundamental HCD question: are people getting the help they came for?

The district-level analysis extends this into an equity question. By comparing top and bottom districts by query volume and looking at what each is asking about, the data surfaces who is engaging with the service and who isn't — and whether the nature of that engagement differs by geography. A national service optimized for one usage pattern is underserving communities with different needs. Human-centered design requires knowing not just what the average user does, but where the divergence is and why.

The QueryType audit surfaces a third question: is the system accurately capturing what people need? When you look at the data at scale, patterns of miscategorization become visible that would be invisible in any individual case. The Cultural Practices spike in Maharashtra in 2024 is a wrong categorization of queries which essentially reflects that the people who are giving these advices are also not capable enough to classify this information accurately or provide factual information. If queries are miscategorized, the service cannot be meaningfully improved based on that data. The infrastructure meant to surface farmer needs is quietly distorting them.

Finally, the trend finding — Weather queries declining while Government Schemes queries rise sharply across all three states — raises a behavioral question with direct design implications. Farmers may be shifting from using KCC for farming advice to using it as a workaround for navigating government programs and subsidies. That is not the service's intended purpose, but it may be the need that isn't being met anywhere else. Recognizing that shift is only possible when you look at usage patterns at scale over time — which is exactly what this data enables.
