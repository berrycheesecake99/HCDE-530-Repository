# Week 2 — context for the word-count assignment

This folder holds `demo_responses.csv`, `demo_word_count.py`, and optional `dashboard.html`. Use this file for **how the word count works** (walkthrough + line map), **dataset provenance**, and **why the dashboard HTML is built the way it is** when you write up the assignment.

Open `demo_word_count.py` next to this document while you read.

---

## Dataset provenance and privacy (`demo_responses.csv`)

**For readers and write-ups:** The free-text responses are **paraphrased from real themes** that commonly appear in UX and research work (e.g. time pressure, synthesis, stakeholder alignment). They are **not verbatim quotes** from identifiable individuals. IDs like **P01–P25** and **role labels** support the exercise; treat the file as **illustrative course material**, not a dataset of real participants.

If you replace this CSV with different material, update this section with a clear **one-sentence** description of the new source (fictional only, paraphrased themes, or de-identified real data) so privacy expectations stay accurate. If the course expects a single repo-wide note, align with **`context.md`** at the repository root as well.

---

## How `demo_word_count.py` works

Section-by-section: what each part of the script does and **why it matters** for processing a CSV.

### 1. Import `csv`

Python’s built-in **`csv`** module knows how to split comma-separated lines **without breaking** when commas or line breaks appear **inside quoted fields**. That matters for survey answers that contain commas or long sentences.

### 2. Filename in one variable + empty list

`filename = "demo_responses.csv"` keeps the path in **one place** so you—or a grader—can point the script at a different file later without hunting through the code.

`responses = []` is an empty container that will hold **one dictionary per row** after reading.

### 3. Open the file and read every row

`open(..., newline="", encoding="utf-8")`:

- **`encoding="utf-8"`** — Handles curly quotes and special characters common in survey text.
- **`newline=""`** — Required when using the `csv` module so quoted fields that contain real line breaks are read correctly.

`csv.DictReader` uses the **first line of the file as column names**. Each row becomes a small lookup: `row["participant_id"]`, `row["role"]`, `row["response"]`, which reads like the header row of the spreadsheet.

The loop **appends** each row dict to `responses`, so after this block you have the **full table in memory** as a list of dicts.

### 4. The `count_words` function

This is the **analysis rule** in one place: split the answer string on whitespace and count the pieces. That is a simple stand-in for “how long did people write,” so you can compare lengths without reading every answer in full.

Keeping it in a **named function** makes the main loop easier to read and lets you change the counting rule in one place later.

### 5. Table header in the terminal

The first `print` lines draw column labels and a divider. The `{...:<6}` style is **spacing for alignment** so IDs, roles, and counts line up in a scannable table.

### 6. Main loop: one printed line per person

For each `row` in `responses`:

- Pull out **id**, **role**, and **response** by column name.
- Call `count_words` and store the number in `word_counts` for the summary at the end.
- Build a **preview** (first 60 characters + `...` if longer) so the terminal table stays readable.

This is the core **“shape data → compute → present”** pipeline.

### 7. Summary across everyone

After the loop, `word_counts` holds every person’s count. The script prints **total count**, **min**, **max**, and **average**—quick desk-check numbers that match the idea of the optional **`dashboard.html`** view of the same dataset.

### Section-by-section map (line numbers)

Jump in **`demo_word_count.py`** by line. If you add or remove lines in the script, **update this table** so it stays accurate.

| Top-to-bottom in file | Lines | Maps to § above | What is there |
|------------------------|------:|-----------------|---------------|
| `import csv` | 1 | **1** | Standard library import for reading the CSV safely. |
| Reader pointer comment | 3–4 | — | Tells you this walkthrough lives in `context.md`. |
| Filename + empty list | 5–10 | **2** | Comments, `filename = ...`, `responses = []`. |
| Read whole CSV into memory | 12–19 | **3** | `with open`, `DictReader`, append each `row`. |
| `count_words` function | 22–31 | **4** | Docstring + word-count rule. |
| Table header in terminal | 34–36 | **5** | `print` column labels and divider. |
| Per-person rows + preview | 38–57 | **6** | `word_counts`, `for` loop, `print` each line. |
| Summary statistics | 59–65 | **7** | Totals, min, max, average word counts. |

### Run it

From this folder:

```bash
python3 demo_word_count.py
```

You should see a table in the terminal, then the summary block.

---

## Dashboard design choices (`dashboard.html`)

These are the **intent** decisions behind the static dashboard—not a line-by-line tutorial, but enough to explain *why* the page looks and behaves as it does in a write-up or critique.

### Format and stack

- **One static HTML file** — No install step, no React/Vue build. A reader with a browser can open the file from the Week 2 folder, which matches the course goal of keeping the assignment **easy to run and grade**.
- **Chart.js (CDN)** — Gives bar and doughnut charts without writing low-level drawing code. **Tradeoff:** first open needs network (or a cached script) for charts to appear.

### Visual and layout design

- **Dark “instrument panel” look** — Deep background (`#0f1419`), slightly lighter **panels** for charts and table, and a single **accent** blue for numbers and highlights. Muted label color keeps **hierarchy** clear: titles and data read first, chrome second.
- **Responsive layout** — A centered **max-width** column so lines do not stretch uncomfortably wide on large monitors. **Metric cards** reflow in a simple grid; on wide screens the **two charts** sit side by side (wider column for the bar chart) so overview + detail stay on one scroll for most laptops.
- **Typography** — System UI stack for fast, familiar rendering without bundling webfonts.

### Information architecture (what appears where)

1. **Header** — States what the page is and how it relates to `demo_word_count.py` and `demo_responses.csv` (including the embedded-vs-fetch behavior in one sentence).
2. **Metric strip** — Total responses, average / shortest / longest word count: same **“desk check”** idea as the Python summary block at the end of the script.
3. **Bar chart: words per response** — Lets you **compare individuals** at a glance; bar **color follows role** so the chart links visually to the role breakdown next to it.
4. **Doughnut: responses by role** — Shows **composition of the sample** (how many UX Researchers vs Designers, etc.) without implying statistical generalization beyond this demo file.
5. **Table** — ID, role (as a **pill** for quick scanning), word count (right-aligned **tabular numbers**), and a **text preview** (longer snippet than the 60-character terminal preview). **Row hover** uses a subtle tint so scanning rows is easier.

### Data loading and parity with Python

- **Embedded CSV** inside the page — Lets charts and table work when the file is opened as **`file://`** (many browsers block `fetch` for local files). **Design obligation:** when `demo_responses.csv` changes, the embedded block must be **updated to match** or the dashboard will lie.
- **`fetch` when served over HTTP** — If you use a tiny local server, the page can load the **live CSV** from disk; if that fails, it **falls back** to the embedded copy so something always renders.
- **Word counts** — JavaScript uses trim + split on whitespace so counts stay **close in spirit** to the Python script (small edge-case differences are possible on odd whitespace; both are “length as words” for this assignment).

### Trust and accessibility

- **Table cells use the DOM API (`textContent`)** for response previews, not raw `innerHTML`, so changing the CSV later does not risk **HTML injection** from a malicious or accidental string in the data.
- **Light a11y** — `aria-live` on the metrics region and `aria-label` on chart canvases so screen-reader users get a bit more context than “blank graphic.”

### Honest constraints

- **Offline:** charts need Chart.js loaded at least once; fully offline use requires caching or self-hosting the library.
- **Embedded data duplication** — Convenience for `file://` vs. one source of truth; document the tradeoff in any methods section.
