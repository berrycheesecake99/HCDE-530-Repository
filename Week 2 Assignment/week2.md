# Week 2 — A2 competency claim

This repo documents work that supports **UX research–adjacent** practice: handling rows of participant-style responses, summarizing text in a lightweight way, and leaving a clear trail for anyone reviewing the method (instructor, teammate, or future me).

## Handling structured survey / interview-style responses

I can treat a CSV of open-ended answers as a table where each row is one voice, with stable column names so roles and IDs stay tied to the right text. Reading the file with proper encoding matters for real study exports; here the demo CSV stands in for that workflow so I can practice without using sensitive participant data.

## Descriptive passes on qualitative text

Word count is not “the analysis,” but it is a common **first desk check** in research-adjacent work: it helps spot very short or very long answers before deeper coding or theming. The script walks every response in order, prints a scannable table with a short preview, and ends with min / max / average so I can describe spread in one glance.

## Explaining the pipeline in plain language

I annotated the script with everyday explanations so a **non-engineer UX researcher or designer** can follow what the computer is doing at each step. That mirrors how I want to work in cross-functional teams: small, readable utilities and documentation that make handoff and critique easier, not black-box scripts only I understand.

## AI-assisted drafting, human ownership

I used AI tools to speed up drafting and checking, then **rewrote comments and this claim in my own words** and confirmed the script runs on the demo data. For research-adjacent work, that balance matters: tools can accelerate mechanics, but judgment about what to measure and how to describe it stays with the practitioner.

## Version control and submission

The GitHub repo holds the runnable script, the demo CSV, and this claim so reviewers can verify the work in one place; I submit the repo URL on Canvas as the assignment deliverable.
