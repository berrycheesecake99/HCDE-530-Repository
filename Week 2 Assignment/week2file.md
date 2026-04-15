# Week 2 — competency reflections (draft)

*Draft: reflections added from interview.*

---

## C1 — Vibecoding and rapid prototyping

### What this competency means to me

Use a generative tool (e.g. Lovable, Bolt) to go from plain-language ideas to a **working web app**, **iterate** on what it produces, and judge what worked vs what you had to fix—often with a **shareable deployed URL**.

### What I did this week (evidence)

- **Tool(s) used:** **Cursor** (AI-assisted editing in the IDE), not Lovable/Bolt-style “deploy from prompt” tools this week.
- **Deployed URL:** **None** for Week 2 — no separate hosted app; the “shareable view” is a **static `dashboard.html`** opened locally (or via a simple local server if someone prefers).
- **Iterations / how you refined the output:** Iterated in **Cursor** on Python and HTML (e.g. word-count script behavior, CSV export, dashboard layout and embedded-vs-fetch data behavior). **`dashboard.html`** is a static prototype you can open in a browser without a build step — rapid to change and re-open.
- **One thing that worked well:** Cursor sped up **boilerplate and structure** (CSV read/write patterns, HTML scaffolding) so you could focus on **what** the assignment should demonstrate.
- **One thing you had to correct or redirect:** **Judgment calls** on what belongs in code vs **`context.md`** (e.g. line map placement, design rationale for the dashboard, provenance text) so documentation stayed readable for a **non-developer** audience rather than turning `.py` files into long comment walls.
- **Honest gap vs typical C1 examples:** The course version of this competency often emphasizes a **generative web builder + deployed URL**. This week’s work is closer to **“rapid prototyping without a deploy”**: static dashboard + scripted data pipeline. You can still point to **iteration + judgment calls** as the part that aligns.

### What I learned or noticed

*Cursor handled the repetitive parts fast enough that I could focus on what the prototype actually needed to show. That was useful — the bottleneck shifted from "getting it to run" to "deciding what it should do.*

### Friction or surprises

*I liked that as I was doing the assignment I could think with cursor to figure out what was working in my code or find issues about why my code wasn't updating in Git.*

### Tie to UX research / UX design practice

*Even without a deployed URL, the core question was the same as any prototype: will someone who didn't build this understand what my code means? That's the part that connects to UX practice.*

### One thing I'll do differently next time

*Document as I go. The reasoning behind decisions was clearest while I was making them — writing context.md after the fact meant some of that got lost*

---

## C2 — Code literacy and documentation

### What this competency means to me

Read and change code with confidence, and **document it** (comments, docstrings, commits, short reader-facing markdown) so **someone else—or future you—can follow** what the script does and why.

### What I did this week (evidence)

- **Script(s) you want to point to:** **`survey_response_word_counts.py`** as the primary Week 2 script for C2. *(You typed `survey_word_counts_output.py`; there is no file by that name — the script that **writes** `survey_word_counts_output.csv` is `survey_response_word_counts.py`.)* **`demo_word_count.py`** remains the paired “read CSV → print table” demo described in `context.md`; cite it if the assignment asks for both styles.
- **Where a reader can find non-technical explanation:** **`Week 2 Assignment/context.md` only** for this week’s evidence. It walks through **`demo_word_count.py`** by section, includes a **line map**, **dataset provenance**, and **why `dashboard.html` is designed** the way it is. *(The repo also has a root `context.md` for course-wide framing; for Week 2 competency claims you are standardizing on **this folder’s** `context.md`.)*
- **One comment you are proud of (why, not what):** Above the final **`print`** in **`survey_response_word_counts.py`** (after `writer.writerows`), a short comment block explains **why** that print exists: the earlier summary only reflects **in-memory** stats, while this line **closes the loop** by confirming the **CSV export** finished and how many rows were **persisted**—so a reader can sanity-check “terminal table + disk file” together and catch a **silent failure** between stats and write. *(Started from a one-line note about rows written; expanded so the “why” is explicit.)*
- **Functions + docstrings:** In **`survey_response_word_counts.py`**, both **`row_id`** and **`count_words`** have docstrings that state **what goes in**, **what comes out**, and **what the function is for**. Open that file in the editor to quote them verbatim in a write-up.
- **Alignment note:** **`context.md`** in this folder still centers **`demo_word_count.py`** for the long walkthrough; **`survey_response_word_counts.py`** is documented mainly **in code** (section comments + these docstrings). Optional polish: add a short “survey export script” subsection to `context.md` if you want one non-technical doc to cover **both** scripts end-to-end.
- **Commit messages you cited:**
  - *“added additional app reviews to the CSV file.”* — *Optional refinement:* name the file (`demo_responses.csv`) and outcome (e.g. “regenerated `survey_word_counts_output.csv` + synced `dashboard.html` embed”).
  - *“added comments above the print line”* — *Optional refinement:* say *which* prints (e.g. “summary block + post-export confirmation”) and *why* (terminal vs disk).

### What I learned or noticed

*Writing docstrings for row_id and count_words made me check whether I actually understood the functions, not just that they ran. It's a useful habit*

### Friction or surprises

*The line between code comments and context.md was blurrier than I expected. A few times I started writing a comment and realized it was really a design decision that belonged in the non-technical doc instead.*

### Tie to UX research / UX design practice

*Deciding where an explanation lives and who it's written for is an information architecture problem — the same kind of call I make in design work when deciding what goes in a report versus an appendix*

### One thing I'll do differently next time

*Write documentation alongside the code, not after. The judgment calls are easier to capture in the moment.*

---

## C6 — Data visualization

### What this competency means to me

Turn data into **charts that support a clear point**, pick a **chart type that fits** the structure of the data and the question you are asking, and **explain your reasoning** so someone else can follow how you read the graphic.

### What I did this week (evidence)

- **Chart in Python (matplotlib / seaborn / pandas)?** **No** for Week 2. There is **no Jupyter notebook** in this folder for these charts.
- **Charts in another form:** **`Week 2 Assignment/dashboard.html`** using **Chart.js** (loaded from a CDN):
  - **Bar chart — “Words per response”** — one bar per **participant ID**; bar **color follows role** so you can relate individuals to the role mix.
  - **Doughnut chart — “Responses by role”** — shows **counts per role** as parts of a whole (how the sample is composed).
  - **Metric cards** at the top echo the **summary statistics** idea from the Python scripts (total, average, shortest, longest word counts).
- **Argument these charts support:** “**How long** did people write?” (bar + numbers) and “**who** is in this sample by role?” (doughnut)—same dataset as `demo_responses.csv`, complementary to the terminal table from the scripts.
- **Why these chart types (written justification):** Documented in **`Week 2 Assignment/context.md`** under **Dashboard design choices (`dashboard.html`)** — e.g. **bar** for comparing **many ordered categories** (P01…), **doughnut** for **simple part-of-whole** role counts, **dark panel layout** for legibility, **embedded CSV** so `file://` still works, **`textContent`** for table cells for trust.
- **Notebook link:** **Not applicable** this week.
- **Gap you are naming clearly:** Some course wording for C6 expects **Python-generated charts** and a **Jupyter-on-GitHub** story. Your Week 2 evidence is **stronger on “chart type fits the question + written justification”** and **weaker on that exact Python + notebook delivery**. A small follow-up (e.g. one `matplotlib` plot in a `.ipynb` reading the same CSV) would close the gap without changing the dashboard story.

### What I learned or noticed

*Using Chart.js meant I had to justify chart type choices explicitly in context.md since there was no notebook narrative. That ended up being useful — it made the reasoning visible rather than implied*

### Friction or surprises

*The dashboard works as a presentation artifact but doesn't show the analytical layer as clearly. I'm more comfortable with the design side of visualization — layout, color, legibility — than with the "what does this distribution actually say" side.*

### Tie to UX research / UX design practice

*Each chart in a research deliverable is making a claim. Thinking about what question each chart answers, and for whom, is the same framing I use in research readouts*

### One thing I'll do differently next time

*Use real data from interviews and survey responses to analyse the dynamic nature of data and interpretation*
