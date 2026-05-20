#!/usr/bin/env python3
"""Combine KCC CSVs (Maharashtra, Karnataka, Uttar Pradesh) and add KccAns_en.

Requires: pandas, deep-translator (pip install pandas deep-translator)

A full run translates roughly five thousand non-ASCII answers — expect a long run and
possible rate limits. Progress is written to --output every --checkpoint-every translator
calls so you can re-run with --resume after an interruption.

Examples:
  python combine_translate_kcc.py --no-translate
  python combine_translate_kcc.py --max-rows 50
  python combine_translate_kcc.py --resume
  python combine_translate_kcc.py
"""
# combine_translate_kcc.py
# This script combines the KCC CSVs for Maharashtra, Karnataka, and Uttar Pradesh, and adds a KccAns_en column.
# It also translates the KccAns column to English using the Google Translate API.
# It writes the output to a CSV file.
# It can be run with the --no-translate flag to only combine the CSVs, or with the --resume flag to resume a previous run.
# It can also be run with the --max-rows flag to limit the number of rows to translate.
# It can also be run with the --max-chars flag to limit the number of characters to translate.
from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import pandas as pd

STATE_SUBDIRS = ("Maharashtra", "Karnataka", "Uttar Pradesh ")
DEFAULT_MAX_CHARS = 4500
DEFAULT_CHUNK_SLEEP = 1.0

# This function returns the path to the week 6 folder.
def _repo_week6() -> Path:
    return Path(__file__).resolve().parent

# This function collects the paths to the CSV files for the KCC CSVs.
def collect_csv_paths(data_root: Path) -> list[Path]:
    paths: list[Path] = []
    for state in STATE_SUBDIRS:
        d = data_root / state
        if not d.is_dir():
            raise FileNotFoundError(f"Missing state folder: {d}")
        for p in sorted(d.rglob("*.csv")):
            if p.name.startswith("."):
                continue
            paths.append(p)
    return paths

# This function loads and concatenates the CSV files for the KCC CSVs.
def load_and_concat(paths: list[Path], data_root: Path) -> pd.DataFrame:
    frames: list[pd.DataFrame] = []
    for p in paths:
        rel = p.relative_to(data_root)
        df = pd.read_csv(p, encoding="utf-8", low_memory=False)
        df["_source_file"] = str(rel.as_posix())
        frames.append(df)
    if not frames:
        return pd.DataFrame()
    return pd.concat(frames, ignore_index=True)

# This function checks if the string is mostly ASCII.
def _mostly_ascii(s: str) -> bool:
    if not s:
        return True
    return all(ord(c) < 128 for c in s)

# This function fills the KccAns_en column with the translated KccAns column.
def fill_kcc_ans_en(
    combined: pd.DataFrame,
    *,
    prior_en: pd.Series,
    out_path: Path,
    checkpoint_every: int,
    max_chars: int,
    chunk_size: int,
    chunk_sleep: float,
    max_rows: int | None,
    max_retries: int = 4,
) -> None:
    from deep_translator import GoogleTranslator

    translator = GoogleTranslator(source="auto", target="en")
    col_idx = combined.columns.get_loc("KccAns_en")
    series = combined["KccAns"]
    n = len(series)
    limit = n if max_rows is None else min(n, max_rows)
    api_calls = 0

    for i in range(n):
        prev = prior_en.iloc[i] if i < len(prior_en) else ""
        if not pd.isna(prev) and str(prev).strip():
            continue

        raw = series.iloc[i]
        if pd.isna(raw) or raw is None:
            combined.iat[i, col_idx] = ""
            continue

        text = str(raw).strip()
        if not text:
            combined.iat[i, col_idx] = ""
            continue

        if _mostly_ascii(text):
            combined.iat[i, col_idx] = text
            continue

        if i >= limit:
            combined.iat[i, col_idx] = ""
            continue

        snippet = text[:max_chars]
        translated = ""
        wait = chunk_sleep
        for attempt in range(max_retries):
            try:
                translated = translator.translate(snippet)
                break
            except Exception as exc:  # noqa: BLE001 — network/API quirks vary by environment
                if attempt == max_retries - 1:
                    print(f"[warn] row {i} translate failed after retries: {exc}", file=sys.stderr)
                    translated = ""
                else:
                    print(
                        f"[warn] row {i} attempt {attempt + 1}/{max_retries}: {exc}",
                        file=sys.stderr,
                    )
                    time.sleep(wait)
                    wait = min(wait * 2, 60.0)

        combined.iat[i, col_idx] = translated
        api_calls += 1

        if checkpoint_every > 0 and out_path and api_calls % checkpoint_every == 0:
            combined.to_csv(out_path, index=False, encoding="utf-8-sig")
            print(f"[checkpoint] saved after {api_calls} translator calls (row index {i})", file=sys.stderr)

        if chunk_size > 0 and api_calls % chunk_size == 0:
            time.sleep(chunk_sleep)

# This function parses the arguments.
def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    week6 = _repo_week6()
    default_root = week6 / "KCC Data "
    default_out = week6 / "KCC Data " / "combined_kcc_3states_en.csv"

    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument(
        "--data-root",
        type=Path,
        default=default_root,
        help=f"Folder containing state subfolders (default: {default_root})",
    )
    p.add_argument(
        "--output",
        type=Path,
        default=default_out,
        help=f"Output CSV path (default: {default_out})",
    )
    p.add_argument(
        "--no-translate",
        action="store_true",
        help="Only merge CSVs; write blank KccAns_en.",
    )
    p.add_argument(
        "--max-rows",
        type=int,
        default=None,
        help="Translate only non-ASCII KccAns in rows with index < N; other rows still get ASCII copied.",
    )
    p.add_argument(
        "--max-chars",
        type=int,
        default=DEFAULT_MAX_CHARS,
        help=f"Truncate KccAns before translate (default {DEFAULT_MAX_CHARS}).",
    )
    p.add_argument(
        "--resume",
        action="store_true",
        help="Load --output CSV instead of re-merging; only fill empty KccAns_en for non-ASCII KccAns.",
    )
    p.add_argument(
        "--chunk-size",
        type=int,
        default=40,
        help="Sleep after every N translator API calls (ASCII-only rows do not count).",
    )
    p.add_argument(
        "--chunk-sleep",
        type=float,
        default=DEFAULT_CHUNK_SLEEP,
        help=f"Seconds to sleep each chunk (default {DEFAULT_CHUNK_SLEEP}).",
    )
    p.add_argument(
        "--checkpoint-every",
        type=int,
        default=80,
        help="After this many translator API calls, write --output (0 = only save at end).",
    )
    return p.parse_args(argv)
# This function is the main function.

def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    data_root = args.data_root.resolve()
    out_path = args.output.resolve()

    if args.resume and args.no_translate:
        print("Cannot combine --resume with --no-translate.", file=sys.stderr)
        return 1

    if args.resume:
        if not out_path.is_file():
            print(f"--resume requires an existing file at {out_path}", file=sys.stderr)
            return 1
        combined = pd.read_csv(out_path, encoding="utf-8-sig", low_memory=False)
        print(f"Resumed from {out_path} — shape {combined.shape}")
    else:
        print(f"Data root: {data_root}", flush=True)
        paths = collect_csv_paths(data_root)
        print(f"Found {len(paths)} CSV files", flush=True)
        combined = load_and_concat(paths, data_root)
        print(f"Combined shape: {combined.shape}", flush=True)

    if "KccAns" not in combined.columns:
        print("No KccAns column after merge — check input files.", file=sys.stderr)
        return 1

    if args.no_translate:
        combined["KccAns_en"] = ""
        print("Skipped translation (--no-translate); KccAns_en is empty.", file=sys.stderr)
    else:
        if "KccAns_en" not in combined.columns:
            combined["KccAns_en"] = ""
        prior_en = combined["KccAns_en"].copy()
        print(
            "Translating KccAns → KccAns_en (copies ASCII-only answers; translates others)…",
            file=sys.stderr,
        )
        fill_kcc_ans_en(
            combined,
            prior_en=prior_en,
            out_path=out_path,
            checkpoint_every=args.checkpoint_every,
            max_chars=args.max_chars,
            chunk_size=args.chunk_size,
            chunk_sleep=args.chunk_sleep,
            max_rows=args.max_rows,
        )
# This function writes the output to a CSV file.
    out_path.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"Wrote {out_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
