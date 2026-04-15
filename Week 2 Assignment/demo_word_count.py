import csv


# --- Load the survey data from disk ---
# We keep the file name in one place so it is easy to change if the instructor
# gives us a different dataset later.
filename = "demo_responses.csv"
# This empty list will hold every row of the survey once we finish reading.
responses = []

# Open the CSV as text in UTF-8 (handles smart quotes and special characters).
# newline="" is required by Python's csv module so line breaks inside fields work.
with open(filename, newline="", encoding="utf-8") as f:
    # DictReader uses the first row as column names, so each row becomes a
    # small lookup table: participant_id, role, response, etc.
    reader = csv.DictReader(f)
    for row in reader:
        responses.append(row)


def count_words(response):
    """Count the number of words in a response string.

    Takes a string, splits it on whitespace, and returns the word count.
    Used to measure response length across all participants.
    """
    # Split the answer on spaces (and other whitespace). The number of pieces
    # is a simple stand-in for "how long did people write," which helps compare
    # responses at a glance without reading every word.
    return len(response.split())


# --- Print one line per person so we can scan the table in the terminal ---
print(f"{'ID':<6} {'Role':<22} {'Words':<6} {'Response (first 60 chars)'}")
print("-" * 75)

# We collect every word count here so we can compute overall stats afterward.
word_counts = []

# Go through each survey response one at a time, in the order they appear in the file.
for row in responses:
    participant = row["participant_id"]
    role = row["role"]
    response = row["response"]

    # Count the words by splitting on spaces and counting the pieces.
    count = count_words(response)
    word_counts.append(count)

    # Keep the printed table readable: show only the start of long answers.
    if len(response) > 60:
        preview = response[:60] + "..."
    else:
        preview = response

    print(f"{participant:<6} {role:<22} {count:<6} {preview}")

# --- Summary across everyone ---
# These numbers answer "how long are answers overall?" for a quick desk check.
print()
print("── Summary ─────────────────────────────────")
print(f"  Total responses : {len(word_counts)}")
print(f"  Shortest        : {min(word_counts)} words")
print(f"  Longest         : {max(word_counts)} words")
print(f"  Average         : {sum(word_counts) / len(word_counts):.1f} words")
