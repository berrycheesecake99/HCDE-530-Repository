# Week 3 Summary

This file summarizes what I changed in Week 3, which commits contain those changes, and which competency claims are supported by my evidence.

## Script changes by commit

| Script | Commit | Commit message | Change summary |
|---|---|---|---|
| `Week 3/week3_analysis_buggy.py` | `9b1572a` | `updating the repository` | Added the Week 3 analysis script. Included role cleanup, safe handling of non-numeric `experience_years`, average experience calculation, and top-5 satisfaction output. |
| `Week 3/week3_analysis_buggy.py` | `317fcb9` | `made changes to the bugge code` | Improved `satisfaction_score` parsing by skipping blanks and catching non-numeric values before converting to `int`. |
| `Week 3/week3_analysis_buggy.py` | `a8cfcfb` | `Reorganised the buggy text and wrote a new function.` | Refactored script into well-named functions with docstrings and added structured output writing to `week3_analysis_results.csv`. |
| `Week 3/clean_week3_survey.py` | `a8cfcfb` | `Reorganised the buggy text and wrote a new function.` | Added a cleaning script that normalizes values and writes cleaned data to `week3_survey_clean.csv`. |
| `Week 3/clean_responses.py` | `9b1572a` | `updating the repository` | Added CSV cleaning helper script for responses. |
| `Week 3/count_roles_in_responses.py` | `9b1572a` | `updating the repository` | Added role-count script with input checks and text counting logic. |

## Bugs I found and fixed

- **ValueError on numeric conversion:** `ValueError: invalid literal for int() with base 10: 'fifteen'` in `experience_years`.
- **Unsafe satisfaction parsing:** score values could be blank or non-numeric and crash without validation.
- **Blank role values:** empty roles needed to be skipped to keep grouped outputs clean.

## Competency claims (Week 3 evidence)

### C2 — Code Literacy and Documentation
I reorganized `week3_analysis_buggy.py` into named functions, each with a single
responsibility and a Google-style docstring. For example, `get_avg_satisfaction_by_role`
takes a list of cleaned rows and returns a dict of normalized role to average satisfaction
score, skipping blank roles and invalid values. `get_avg_experience_by_role` takes the
same input and returns a dict of role to average years of experience.
`write_week3_analysis_results_to_csv` takes those two dicts, merges all roles that appear
in either, and writes `week3_analysis_results.csv` with columns `role`, `avg_satisfaction`,
and `avg_experience` — the docstring documents what happens when a role appears in only one
of the two dicts. I also added inline `#` comments to the cleaning script explaining what
the loop does, what each cleaning step targets, and what gets written to the output file.

### C3 — Data Cleaning and File Handling
The buggy CSV contained non-numeric data in a numeric field (`"fifteen"` in
`experience_years`), blank `role` fields, and non-numeric `satisfaction_score` values.
The script crashed with `ValueError: invalid literal for int() with base 10: 'fifteen'` —
I traced that to the specific cell, added `try/except ValueError` for both numeric fields,
skipped blank role rows with `if not role: continue`, and produced two clean output files:
`week3_survey_clean.csv` and `week3_analysis_results.csv`.

## Not claimed from Week 3

- **C1 — Vibecoding and Rapid Prototyping** is not included here because Week 3
evidence does not show a deployed app URL with multiple app iterations.
- **C7 — Critical Evaluation and Professional Judgment** is not claimed this week
because I do not have a specific example of catching, correcting, or overriding
AI-generated output.
