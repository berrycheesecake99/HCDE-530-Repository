import csv

# Same folder as this script
INPUT_CSV = "clean_responses.csv"
OUTPUT_CSV = "respnses_cleaned.csv"

# Checks if the name is empty
def name_is_empty(row):
    name = row.get("name")
    if name is None:
        return True
    return str(name).strip() == ""

# Capitalizes the role
def capitalize_role(value):
    if value is None:
        return ""
    return str(value).strip().upper()

# Reads the input CSV and writes the output CSV
rows_out = []
with open(INPUT_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    if reader.fieldnames is None:
        raise SystemExit("CSV has no header row.")
    fieldnames = list(reader.fieldnames)
    if "name" not in fieldnames:
        raise SystemExit(f"CSV must include a 'name' column. Found: {fieldnames!r}")
    if "role" not in fieldnames:
        raise SystemExit(f"CSV must include a 'role' column. Found: {fieldnames!r}")
# Loops through the rows and checks if the name is empty
    for row in reader:
        if name_is_empty(row):
            continue
        row = dict(row)
        row["role"] = capitalize_role(row.get("role"))
        rows_out.append(row)
# Writes the output CSV
with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows_out)
# Prints the number of rows written to the output CSV
print(f"Wrote {len(rows_out)} rows to {OUTPUT_CSV}")
