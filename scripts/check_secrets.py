#!/usr/bin/env python3
"""Fail if a committed (or staged) file contains something that looks like an API key.

Patterns: Anthropic (sk-ant-...), Cal.com (cal_...), Retell-style (key_...). It also rejects any
committed .env file other than .env.example. A line can opt out with the marker
"secret-scan: allow" (use sparingly, e.g. for documented fake examples).

  python scripts/check_secrets.py --staged   # pre-commit hook: staged contents
  python scripts/check_secrets.py --all      # CI: every tracked file
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import PurePosixPath

PATTERNS: dict[str, re.Pattern[str]] = {
    "anthropic": re.compile(r"sk-ant-[A-Za-z0-9_\-]{16,}"),
    "calcom": re.compile(r"(?<![A-Za-z0-9_])cal_(?:live_|test_)?[A-Za-z0-9]{16,}"),
    "key_": re.compile(r"(?<![A-Za-z0-9_])key_[A-Za-z0-9]{16,}"),
}
ALLOW_MARKER = "secret-scan: allow"
ALLOWED_ENV_FILES = {".env.example"}


def _git(*args: str) -> str:
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True).stdout


def _files(staged: bool) -> list[str]:
    if staged:
        out = _git("diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")
    else:
        out = _git("ls-files", "-z")
    return [f for f in out.split("\0") if f]


def _content(path: str, staged: bool) -> str | None:
    try:
        if staged:
            raw = subprocess.run(
                ["git", "show", f":{path}"], check=True, capture_output=True
            ).stdout
        else:
            with open(path, "rb") as fh:
                raw = fh.read()
    except (subprocess.CalledProcessError, OSError):
        return None
    if b"\0" in raw[:8192]:
        return None  # binary
    return raw.decode("utf-8", errors="replace")


def scan_text(path: str, text: str) -> list[str]:
    findings = []
    for lineno, line in enumerate(text.splitlines(), 1):
        if ALLOW_MARKER in line:
            continue
        for name, pattern in PATTERNS.items():
            m = pattern.search(line)
            if m:
                shown = m.group()[:10] + "..."
                findings.append(f"{path}:{lineno}: possible {name} key ({shown})")
    return findings


def scan_path_name(path: str) -> list[str]:
    name = PurePosixPath(path).name
    if (name == ".env" or name.startswith(".env.")) and name not in ALLOWED_ENV_FILES:
        return [f"{path}: .env files must never be committed"]
    return []


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--staged", action="store_true")
    mode.add_argument("--all", action="store_true")
    args = parser.parse_args(argv)

    findings: list[str] = []
    for path in _files(args.staged):
        findings += scan_path_name(path)
        text = _content(path, args.staged)
        if text is not None:
            findings += scan_text(path, text)
    if findings:
        print("Secret scan FAILED:", file=sys.stderr)
        for f in findings:
            print(f"  {f}", file=sys.stderr)
        print(
            f"Remove the secret (and rotate it). Mark false positives with '{ALLOW_MARKER}'.",
            file=sys.stderr,
        )
        return 1
    print("Secret scan passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
