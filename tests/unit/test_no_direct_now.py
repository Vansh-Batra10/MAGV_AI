"""Clock discipline: only clock.py may read the wall clock (DESIGN.md section 5.5)."""

import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2] / "src" / "receptionist"
PATTERN = re.compile(r"datetime\.(now|utcnow|today)\(|date\.today\(|time\.time\(")


def test_only_clock_module_reads_wall_clock() -> None:
    offenders = []
    for path in SRC.rglob("*.py"):
        if path.name == "clock.py":
            continue
        for lineno, line in enumerate(path.read_text().splitlines(), 1):
            if PATTERN.search(line):
                offenders.append(f"{path.relative_to(SRC)}:{lineno}: {line.strip()}")
    assert not offenders, "Use the injected Clock or real_utc_now():\n" + "\n".join(offenders)
