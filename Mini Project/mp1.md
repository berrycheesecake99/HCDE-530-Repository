# MP1 — Competency Claims

I am claiming **C5**, **C6**, and **C7** for Mini Project 1. Evidence comes from my analysis notebook ([`Mini Project/Mini Project 1.ipynb`](Mini Project/Mini Project%201.ipynb) and [`Week 6/week6_mp1_starter.ipynb`](Week%206/week6_mp1_starter.ipynb)), published on GitHub.

---

## C5 — Data Analysis with Pandas

This notebook answers four analytical questions about how Indian farmers use the KCC helpline across Maharashtra, Karnataka, and Uttar Pradesh. To do that, I used `value_counts()` to rank query types by frequency, `groupby()` across state, year, and query type to build trend tables, and `nlargest()`/`nsmallest()` to identify the highest and lowest volume districts. I also wrote a keyword-based classifier using `apply()` to flag rows in the Cultural Practices category that appeared to be misclassified — cross-checking the current tag against what the query text actually described. The findings were interpreted in writing, not just printed: for example, the Q2 analysis notes that Weather queries declined across all three states between 2023 and 2024 while Government Schemes queries rose, which suggests farmers may be shifting how they use the service rather than calling less overall.

---

## C6 — Data Visualization

Each of the four questions in this notebook is answered with at least one chart, and chart type was chosen based on what the data structure required. Bar charts were used for categorical distributions (Q1, Q3) because the comparisons are between discrete groups with no implied order. Line charts were used for Q2 trends because the data has a time axis and the direction of change is the point. A stacked bar chart was used for Q4 because the goal was to show the proportional split between Government Schemes and Agronomy advice within each district, not just the raw counts. A density heatmap was used for the Cultural Practices audit because it shows a many-to-one mapping between expected and current tags. All charts have titles that state the finding, labeled axes, and are followed by a markdown cell explaining what the chart argues — not what the code does. The notebook is published on GitHub so the full analysis, including code, output, and interpretation, is readable in a browser without running Python.

---

## C7 — Critical Evaluation and Professional Judgment

The Cultural Practices misclassification audit in Section 3 came directly from noticing something in the Q2 trend data that didn't make sense: Cultural Practices queries in Maharashtra jumped from 5–6 per year in 2022–23 to 40 in 2024. That kind of sharp spike in a vaguely defined category is more likely to reflect a labeling change than a real shift in farmer behavior. Rather than accepting the category trend at face value, I wrote a keyword-based diagnostic that checked each Cultural Practices row against the actual query text and flagged rows where the content matched a different category — Plant Protection, Government Schemes, Fertilizer, and so on. The audit showed that a meaningful share of those rows were plausibly miscategorized. This finding is noted in the conclusions as a limitation on how confidently category-level trends can be interpreted, which is the kind of caveat a practitioner would need before acting on the data.
