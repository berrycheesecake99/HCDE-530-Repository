# Project context — HCDE 530 course repository

This file is the human-readable story of **who** maintains this repo, **what** it is for, and **how** code and artifacts should behave at a **course level**. Week 2 assignment details—**how the word count works** and **CSV provenance**—live in **`Week 2 Assignment/context.md`**. Cursor and collaborators should read this file alongside `.cursorrules` at the repo root.

---

## Maintainer

- **Background:** Human-centered design (HCD) practitioner; **UX design** focus.
- **Not a software engineer:** Prefer explanations and changes in **plain language**, small scoped edits, and **run + view** checklists when helpful.

---

## What this repository is for

1. **Course work** for HCDE 530, organized by week and assignment folders.
2. **Demonstration:** Show **how to process a data file effectively** (load structured data, compute simple summaries, present results clearly).
3. **Teaching the code:** Call attention to the **parts of the code that matter** for that pipeline—not clever abstractions, but readable steps a non-developer can follow.

---

## Intended audience for the demonstration

People who should be able to:

- **Run a Python script** (e.g. open a terminal, `cd` into the assignment folder, run the script with `python3`) and read **printed output** (tables, counts, short previews).
- **Optionally open a simple web page** in a browser to see the **same underlying data** in charts and a table—without assuming they are professional developers.

There are **no hard constraints** on environment: opening `dashboard.html` directly is fine; using a tiny local HTTP server is also fine if instructions (or the course) provide a copy-paste command.

---

## Canonical pattern: script + CSV + optional dashboard

The reference layout is **`Week 2 Assignment/`**:

| File | Role |
|------|------|
| `demo_responses.csv` | Source data (participant id, role, free-text response). **Paraphrased from real themes** for class—see **`Week 2 Assignment/context.md`**. |
| `demo_word_count.py` | Reads the CSV, computes metrics (e.g. word counts), prints a scannable summary in the terminal. **How it works:** **`Week 2 Assignment/context.md`**. |
| `Week 2 Assignment/context.md` | Dataset provenance + how `demo_word_count.py` works (Option B walkthrough). |
| `dashboard.html` | Browser view of the same dataset: charts and a table. Uses **embedded CSV** so charts work when the file is opened as `file://`; may **fetch** the live CSV when the page is served over HTTP. |

Rules for dashboards and CSV handling also live in **`.cursor/rules/`** (e.g. `dashboard-html.mdc`, `python-csv-assignments.mdc`).

---

## How “important parts” of the code should be highlighted (**Option B**)

**Preferred pattern:** Explain the script in **sections** in plain language—what each block does and **why it matters**—so the `.py` file does not become a wall of comments. Light comments inside the script are still fine for anchors.

- **Week 2 example:** **`Week 2 Assignment/context.md`** sits next to the script and holds the **word-count walkthrough** plus **dataset provenance** for `demo_responses.csv`.
- The goal is **data in → steps → results out** for readers who are not software engineers.

---

## Dataset provenance (Week 2 CSV)

The Week 2 survey file is **paraphrased from real themes** (not verbatim identifiable quotes); full wording and implications for write-ups are in **`Week 2 Assignment/context.md`**. If you replace that CSV, update **both** that file and this section with a short, accurate one-sentence summary.

---

## Repository and Git (high level)

- **Course root** (`HCDE 530 Repository/`): main Git repo for **Week 2+** style assignments (e.g. `Week 2 Assignment/`).
- **`Week 1/`** is a **separate nested Git repository**. The parent repo **ignores** `Week 1/` so work there is committed **inside** `Week 1/`, not from the parent. Publish Week 1 from that nested repo’s directory.

See **`.cursorrules`** for an up-to-date **directory tree** and instructions to keep it in sync when folders change.

---

## Course logistics (fill in as needed)

Add or update when you have stable details:

- **Course name / quarter:**  
- **Instructor / submission system (Canvas, GitHub Classroom, etc.):**  
- **Due dates or cadence:**  

---

## Related files

| File | Purpose |
|------|---------|
| `context.md` (repo root) | This file: maintainer background, goals, audience, Option B pointer, light Week 2 dataset note. |
| `Week 2 Assignment/context.md` | Week 2: how `demo_word_count.py` works + CSV provenance. |
| `.cursorrules` | Machine- and human-oriented rules: layout, Git, Python/CSV, dashboards, syncing the directory tree. |
| `.cursor/rules/*.mdc` | Focused Cursor rules (optional glob scope). |

If anything here disagrees with assignment instructions, **the assignment wins**.
