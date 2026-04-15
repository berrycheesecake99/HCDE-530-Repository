import csv

# --- Configuration: input and output file names (same folder as this script) ---
INPUT_CSV = "demo_responses.csv"
OUTPUT_CSV = "survey_word_counts_output.csv"


# --- Helper: pick a stable row identifier for printing and export ---
def row_id(row, row_index):
    """Return an ID string from common survey columns, or a synthetic index if none match."""
    for key in ("participant_id", "id", "respondent_id", "user_id"):
        if key in row and row[key] is not None and str(row[key]).strip() != "":
            return str(row[key]).strip()
    return f"row_{row_index + 1}"


# --- Count words in one response string (same idea as demo_word_count.py) ---
def count_words(response):
    """Split on whitespace and return how many tokens appear."""
    text = response if response is not None else ""
    return len(text.split()) if text.strip() else 0


# --- Load every row from the CSV; each row must have a column named `response` ---
rows = []
with open(INPUT_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    if reader.fieldnames is None or "response" not in reader.fieldnames:
        raise SystemExit(
            f"CSV must include a column named 'response'. Found: {reader.fieldnames!r}"
        )
    for row in reader:
        rows.append(row)


# --- Build per-row results: id, word count, and a 60-character preview for display ---
results = []
for i, row in enumerate(rows):
    rid = row_id(row, i)
    response = row.get("response") or ""
    w = count_words(response)
    if len(response) > 60:
        preview = response[:60] + "..."
    else:
        preview = response
    results.append({"id": rid, "word_count": w, "response_preview": preview})


# --- Print each row: ID, word count, first 60 characters of the response ---
print(f"{'ID':<14} {'Words':<8} {'Response (first 60 chars)'}")
print("-" * 90)
for r in results:
    print(f"{r['id']:<14} {r['word_count']:<8} {r['response_preview']}")


# --- Print summary: how many responses, shortest, longest, and average word count ---
print()
print("── Summary ─────────────────────────────────")
n = len(results)
if n == 0:
    print("  No rows loaded; nothing to summarize.")
else:
    counts = [r["word_count"] for r in results]
    print(f"  Total responses : {n}")
    print(f"  Shortest        : {min(counts)} words")
    print(f"  Longest         : {max(counts)} words")
    print(f"  Average         : {sum(counts) / n:.1f} words")


# --- Write the same per-row results to a new CSV file for spreadsheets or grading ---
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as out:
    writer = csv.DictWriter(
        out,
        fieldnames=["id", "word_count", "response_preview"],
        extrasaction="ignore",
    )
    writer.writeheader()
    writer.writerows(results)
#print the number of rows written to the output CSV
print()
print(f"Wrote {len(results)} rows to {OUTPUT_CSV}")
