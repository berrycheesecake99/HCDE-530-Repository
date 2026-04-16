import csv


def get_avg_satisfaction_by_role(rows):
    """Average satisfaction score for each normalized role.

    Args:
        rows: Iterable of survey row dicts with ``role`` and ``satisfaction_score``.

    Returns:
        Dict mapping each non-empty normalized role string to its mean
        satisfaction (only rows with a valid integer score are included).
    """
    sums = {}
    counts = {}
    for row in rows:
        role = row["role"].strip().title()
        if not role:
            continue
        raw_score = row["satisfaction_score"].strip()
        if not raw_score:
            continue
        try:
            score = int(raw_score)
        except ValueError:
            continue
        sums[role] = sums.get(role, 0) + score
        counts[role] = counts.get(role, 0) + 1
    return {r: sums[r] / counts[r] for r in sums}


def get_avg_experience_by_role(rows):
    """Average years of experience for each normalized role.

    Args:
        rows: Iterable of survey row dicts with ``role`` and ``experience_years``.

    Returns:
        Dict mapping each non-empty normalized role string to its mean years
        of experience (non-numeric values are skipped).
    """
    sums = {}
    counts = {}
    for row in rows:
        role = row["role"].strip().title()
        if not role:
            continue
        raw = row["experience_years"].strip()
        try:
            years = int(raw)
        except ValueError:
            continue
        sums[role] = sums.get(role, 0) + years
        counts[role] = counts.get(role, 0) + 1
    return {r: sums[r] / counts[r] for r in sums}


def write_week3_analysis_results_to_csv(satisfaction_by_role, experience_by_role):
    """Write per-role averages to ``week3_analysis_results.csv``.

    Creates or overwrites a CSV with columns ``role``, ``avg_satisfaction``,
    and ``avg_experience``. Every role that appears in either input mapping
    gets one row; if a role is missing from one mapping, that cell is empty.

    Args:
        satisfaction_by_role: Role name to average satisfaction score.
        experience_by_role: Role name to average years of experience.

    Returns:
        None.
    """
    out_name = "week3_analysis_results.csv"
    all_roles = sorted(set(satisfaction_by_role) | set(experience_by_role))
    with open(out_name, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["role", "avg_satisfaction", "avg_experience"],
        )
        writer.writeheader()
        for role in all_roles:
            writer.writerow(
                {
                    "role": role,
                    "avg_satisfaction": satisfaction_by_role.get(role, ""),
                    "avg_experience": experience_by_role.get(role, ""),
                }
            )


def main():
    # Load the survey data (cleaned export from week3_survey_messy.csv; see clean_week3_survey.py)
    filename = "week3_survey_clean.csv"
    rows = []

    with open(filename, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)

    # Count responses by role
    # Normalize role names so "ux researcher" and "UX Researcher" are counted together
    role_counts = {}

    for row in rows:
        role = row["role"].strip().title()
        if not role:
            continue
        if role in role_counts:
            role_counts[role] += 1
        else:
            role_counts[role] = 1

    print("Responses by role:")
    for role, count in sorted(role_counts.items()):
        print(f"  {role}: {count}")

    # Calculate the average years of experience (skip non-numeric values, e.g. "fifteen")
    total_experience = 0
    experience_count = 0
    for row in rows:
        raw = row["experience_years"].strip()
        try:
            total_experience += int(raw)
            experience_count += 1
        except ValueError:
            continue

    avg_experience = total_experience / experience_count if experience_count else 0.0
    print(f"\nAverage years of experience: {avg_experience:.1f}")

    # Find the top 5 highest satisfaction scores (skip blank or non-numeric scores)
    scored_rows = []
    for row in rows:
        raw_score = row["satisfaction_score"].strip()
        if not raw_score:
            continue
        try:
            score = int(raw_score)
        except ValueError:
            continue
        scored_rows.append((row["participant_name"], score))

    scored_rows.sort(key=lambda x: x[1], reverse=True)
    top5 = scored_rows[:5]

    print("\nTop 5 satisfaction scores:")
    for name, score in top5:
        print(f"  {name}: {score}")

    write_week3_analysis_results_to_csv(
        get_avg_satisfaction_by_role(rows),
        get_avg_experience_by_role(rows),
    )


if __name__ == "__main__":
    main()
