import csv

INPUT_CSV = "week3_survey_messy.csv"
OUTPUT_CSV = "week3_survey_clean.csv"

# Map spelled-out numbers (lowercase) to integers for experience_years
WORD_TO_INT = {
    "zero": 0,
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10,
    "eleven": 11,
    "twelve": 12,
    "thirteen": 13,
    "fourteen": 14,
    "fifteen": 15,
    "sixteen": 16,
    "seventeen": 17,
    "eighteen": 18,
    "nineteen": 19,
    "twenty": 20,
}

TOOL_CANONICAL = {
    "figma": "Figma",
    "jira": "Jira",
    "notion": "Notion",
    "sketch": "Sketch",
    "asana": "Asana",
    "dovetail": "Dovetail",
    "vs code": "VS Code",
}

# Normalizes the tool
def normalize_tool(raw):
    s = raw.strip()
    if not s:
        return s
    key = s.lower()
    if key in TOOL_CANONICAL:
        return TOOL_CANONICAL[key]
    return s

# Parses the experience years
def parse_experience_years(raw):
    raw = raw.strip()
    if not raw:
        return ""
    try:
        return str(int(raw))
    except ValueError:
        w = WORD_TO_INT.get(raw.lower())
        if w is not None:
            return str(w)
    return ""

# Parses the satisfaction score
def parse_satisfaction(raw):
    raw = raw.strip()
    if not raw:
        return ""
    try:
        return str(int(raw))
    except ValueError:
        return ""

# Cleans the row
def clean_row(row):
    rid = row["response_id"].strip()
    name = row["participant_name"].strip()
    if not name:
        name = f"Participant {rid}"

    role = row["role"].strip().title()
    if not role:
        role = "Unknown"

    dept = row["department"].strip().title()
    age = row["age_range"].strip()
    exp = parse_experience_years(row["experience_years"])
    sat = parse_satisfaction(row["satisfaction_score"])
    tool = normalize_tool(row["primary_tool"])
    text = row["response_text"]

    # Returns the cleaned row
    return {
        "response_id": rid,
        "participant_name": name,
        "role": role,
        "department": dept,
        "age_range": age,
        "experience_years": exp,
        "satisfaction_score": sat,
        "primary_tool": tool,
        "response_text": text,
    }

# Main function
def main():
    rows_out = []
    with open(INPUT_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            rows_out.append(clean_row(row))

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows_out)

    print(f"Wrote {len(rows_out)} rows to {OUTPUT_CSV}")

# Main function
if __name__ == "__main__":
    main()
