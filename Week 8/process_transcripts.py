"""
Batch-process interview transcripts from a study on elderly users'
smartphone adoption.

Prepared for: Age-Friendly Tech Initiative (non-profit client).
Audience for outputs: non-technical readers (clear labels, no jargon).

Inputs:
    Plain-text interview files (.txt) in a transcripts/ folder
    (12 interviews collected; analysis not started yet).

Outputs (planned):
    Per-interview stats and a simple combined report (CSV or text).
    Exact metrics TBD — word counts and readable summaries are a
    reasonable first pass.

Usage:
    python process_transcripts.py

Project status: see Project_notes.md in this folder.
"""

from pathlib import Path

# Folder name next to this script — change here if your files live elsewhere.
TRANSCRIPTS_DIR = "transcripts"


def list_transcript_files(directory: str = TRANSCRIPTS_DIR) -> list[Path]:
    """Return paths to every .txt file in directory, sorted by filename.

    This is the first step before reading or analyzing each interview.
    Raises FileNotFoundError if the folder is missing.
    """
    folder = Path(directory)
    if not folder.is_dir():
        raise FileNotFoundError(f"Transcripts folder not found: {folder.resolve()}")

    return sorted(folder.glob("*.txt"))


if __name__ == "__main__":
    script_dir = Path(__file__).resolve().parent
    transcripts_path = script_dir / TRANSCRIPTS_DIR

    try:
        files = list_transcript_files(transcripts_path)
    except FileNotFoundError as err:
        print(err)
        print(f"Create the folder and add your .txt files: {transcripts_path}")
        raise SystemExit(1) from err

    print(f"Found {len(files)} transcript(s) in {transcripts_path.name}/")
    for path in files:
        print(f"  - {path.name}")
