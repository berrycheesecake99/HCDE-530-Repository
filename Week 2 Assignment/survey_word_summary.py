"""Write fake survey responses to a CSV, then summarize word counts per response."""

import csv

filename = "survey_responses.csv"

FAKE_RESPONSES = [
    {"participant_id": "S01", "topic": "Onboarding", "response": "The first-time setup felt clear. I finished in under five minutes."},
    {"participant_id": "S02", "topic": "Onboarding", "response": "Too many steps before I could try the main feature. Almost quit twice."},
    {"participant_id": "S03", "topic": "Support", "response": "Support replied quickly but the answer did not solve my billing issue."},
    {"participant_id": "S04", "topic": "Features", "response": "I only use two features weekly. The rest feels like clutter in the menu."},
    {"participant_id": "S05", "topic": "Trust", "response": "I am cautious about linking my bank account. A clearer security page would help."},
    {"participant_id": "S06", "topic": "Accessibility", "response": "Text is readable but some buttons are too small on my phone."},
    {"participant_id": "S07", "topic": "Onboarding", "response": "Loved the short video. It showed exactly what I could do first."},
    {"participant_id": "S08", "topic": "Features", "response": "Search works well. Filters could remember what I picked last time."},
    {"participant_id": "S09", "topic": "Support", "response": "Great chat experience. The bot handed off to a human when I asked."},
    {"participant_id": "S10", "topic": "Trust", "response": "Privacy policy was long. A simple summary at the top would be nicer."},
]


def count_words(text):
    """Count words by splitting on whitespace (same approach as demo_word_count.py)."""
    return len(text.split()) if text.strip() else 0


fieldnames = ["participant_id", "topic", "response"]
with open(filename, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(FAKE_RESPONSES)

rows = []
with open(filename, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows.append(row)

word_counts = [count_words(row["response"]) for row in rows]
shortest = min(word_counts)
longest = max(word_counts)
average = sum(word_counts) / len(word_counts)

print(f"Wrote {len(FAKE_RESPONSES)} fake survey rows to {filename}\n")
print(f"{'ID':<6} {'Topic':<14} {'Words':<8} Preview")
print("-" * 70)
for row, n in zip(rows, word_counts):
    r = row["response"]
    preview = r[:48] + ("..." if len(r) > 48 else "")
    print(f"{row['participant_id']:<6} {row['topic']:<14} {n:<8} {preview}")

print()
print("── Summary ─────────────────────────────────────────────")
print(f"  Responses counted : {len(word_counts)}")
print(f"  Shortest          : {shortest} words")
print(f"  Longest           : {longest} words")
print(f"  Average           : {average:.1f} words")
