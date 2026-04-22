import csv

INPUT_CSV = "clean_responses.csv"


def name_is_empty(row):
    name = row.get("name")
    if name is None:
        return True
    return str(name).strip() == ""

# Reads the input CSV and counts the roles
rows = []
with open(INPUT_CSV, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    if reader.fieldnames is None:
        raise SystemExit("CSV has no header row.")
    if "name" not in reader.fieldnames or "role" not in reader.fieldnames:
        raise SystemExit(f"CSV must include 'name' and 'role'. Found: {list(reader.fieldnames)!r}")
    if "response" not in reader.fieldnames:
        raise SystemExit(f"CSV must include 'response'. Found: {list(reader.fieldnames)!r}")
    for row in reader:
        if name_is_empty(row):
            continue
        rows.append(row)
# Counts the roles
unique_roles = []
seen = set()
for row in rows:
    role = row.get("role")
    if role is None:
        continue
    role = str(role)
    if role == "":
        continue
    if role not in seen:
        seen.add(role)
        unique_roles.append(role)
# Counts the occurrences of each role
counts = {role: 0 for role in unique_roles}
for row in rows:
    text = row.get("response") or ""
    text = str(text)
    for role in unique_roles:
        counts[role] += text.count(role)
# Prints the results
print(f"Rows with non-empty name: {len(rows)}")
print(f"Unique role strings (exact): {len(unique_roles)}")
print()
print("Occurrences of each role string inside response text (exact substring match):")
for role in sorted(unique_roles, key=lambda r: (-counts[r], r)):
    print(f"  {counts[role]:4d}  {role!r}")
# Main function
if __name__ == "__main__":
    main() # Runs the main function
    