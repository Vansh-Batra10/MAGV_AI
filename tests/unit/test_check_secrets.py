"""The secret scanner must catch key-shaped strings and ignore ordinary identifiers.

Fake keys are assembled at runtime so this file never contains a key-shaped literal.
"""

import importlib.util
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
_spec = importlib.util.spec_from_file_location("check_secrets", ROOT / "scripts/check_secrets.py")
assert _spec and _spec.loader
check_secrets = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(check_secrets)

FAKE_ANTHROPIC = "sk-" + "ant-" + "api03-" + "A1b2C3d4E5f6G7h8I9j0"
FAKE_CAL = "cal" + "_live_" + "0123456789abcdef0123"
FAKE_RETELL = "key" + "_" + "9f8e7d6c5b4a39281706"


@pytest.mark.parametrize("secret", [FAKE_ANTHROPIC, FAKE_CAL, FAKE_RETELL])
def test_detects_key_patterns(secret: str) -> None:
    findings = check_secrets.scan_text("x.py", f'API_KEY = "{secret}"\n')
    assert len(findings) == 1
    assert secret not in findings[0]  # never echo the full secret


@pytest.mark.parametrize(
    "line",
    [
        'api_key_env = "CALCOM_DEMO_API_KEY"',
        "idempotency_key_for_session = compute()",
        "placeholder_local_part = 'jb-demo'",
        "local_variable_name_that_is_long = 1",
        "monkey_business_is_not_a_key_value = 2",
    ],
)
def test_ignores_ordinary_identifiers(line: str) -> None:
    assert check_secrets.scan_text("x.py", line) == []


def test_allow_marker() -> None:
    line = f'EXAMPLE = "{FAKE_CAL}"  # secret-scan: allow'
    assert check_secrets.scan_text("README.md", line) == []


@pytest.mark.parametrize(
    ("path", "bad"),
    [(".env", True), ("config/.env.local", True), (".env.example", False), ("env.py", False)],
)
def test_env_files_rejected(path: str, bad: bool) -> None:
    assert bool(check_secrets.scan_path_name(path)) is bad


@pytest.mark.skipif(shutil.which("git") is None, reason="git not installed")
def test_pre_commit_hook_blocks_staged_secret(tmp_path: Path) -> None:
    repo = tmp_path / "repo"
    (repo / "scripts").mkdir(parents=True)
    shutil.copy(ROOT / "scripts/check_secrets.py", repo / "scripts/check_secrets.py")

    def git(*args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(["git", *args], cwd=repo, capture_output=True, text=True)

    git("init", "-q")
    git("config", "user.email", "t@example.com")
    git("config", "user.name", "t")
    (repo / "ok.py").write_text("x = 1\n")
    (repo / "leak.py").write_text(f'KEY = "{FAKE_ANTHROPIC}"\n')

    def hook() -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["python3", "scripts/check_secrets.py", "--staged"],
            cwd=repo,
            capture_output=True,
            text=True,
        )

    git("add", "ok.py")
    assert hook().returncode == 0
    git("add", "leak.py")
    result = hook()
    assert result.returncode == 1
    assert "leak.py:1" in result.stderr
