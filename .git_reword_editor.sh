#!/bin/sh
# Used once by: GIT_SEQUENCE_EDITOR + GIT_EDITOR during git rebase -i
f="$1"
subj=$(grep -v '^#' "$f" | grep -v '^[[:space:]]*$' | head -1)
case "$subj" in
  "updating the repository")
    cat > "$f" <<'EOF'
Add Week 3 survey CSV and analysis script (messy data)

Adds week3_survey_messy.csv and week3_analysis_buggy.py with fixes for
empty roles, non-numeric experience_years (avoid ValueError), and
descending sort so top-5 satisfaction scores are the highest.
EOF
    ;;
  "made changes to the bugge code")
    cat > "$f" <<'EOF'
fix: parse satisfaction_score safely (try/except ValueError)
EOF
    ;;
  "Reorganised the buggy text and wrote a new function.")
    cat > "$f" <<'EOF'
Refactor week3 analysis: helper functions, cleaned CSV input, export CSV
EOF
    ;;
  "fixed issues with file names")
    cat > "$f" <<'EOF'
fix: rename responses_cleaned.csv; extend .gitignore; remove .DS_Store
EOF
    ;;
esac
