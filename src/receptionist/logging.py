"""structlog configuration: JSON logs, request/turn context, and PII redaction.

PII policy (DESIGN.md section 9): phones are logged as last-4 plus a salted hash, emails as a
salted hash, names and addresses are dropped. Free-text values are scrubbed for anything that
looks like a phone number or email. Transcripts are never logged.
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import re
import sys
from collections.abc import Mapping
from typing import Any

import structlog

PHONE_KEYS = frozenset(
    {
        "phone",
        "phone_e164",
        "caller_phone",
        "caller_phone_e164",
        "from_number",
        "to_number",
        "attendee_phone",
        "attendee_phone_e164",
        "callback_phone",
    }
)
EMAIL_KEYS = frozenset({"email", "caller_email", "attendee_email", "to", "to_email", "recipient"})
DROP_KEYS = frozenset(
    {
        "name",
        "caller_name",
        "attendee_name",
        "address",
        "service_address",
        "transcript",
        "user_text",
        "content",
    }
)

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
# 10+ digits, optionally with +, spaces, dots, dashes or parentheses between them.
_PHONE_RE = re.compile(r"(?<!\w)\+?(?:\d[\s().-]*){9,14}\d(?!\w)")


class Redactor:
    def __init__(self, salt: str) -> None:
        self._salt = salt.encode()

    def _hash(self, value: str) -> str:
        return hmac.new(self._salt, value.encode(), hashlib.sha256).hexdigest()[:10]

    def phone(self, value: str) -> str:
        digits = re.sub(r"\D", "", value)
        if not digits:
            return "[redacted]"
        # Hash the national significant part so "+1 512..." and "(512) ..." correlate.
        return f"***{digits[-4:]}#{self._hash(digits[-10:])}"

    def email(self, value: str) -> str:
        return f"email#{self._hash(value.strip().lower())}"

    def text(self, value: str) -> str:
        value = _EMAIL_RE.sub(lambda m: self.email(m.group()), value)
        return _PHONE_RE.sub(lambda m: self.phone(m.group()), value)

    def value(self, key: str | None, value: Any) -> Any:
        k = key.lower() if isinstance(key, str) else None
        if k in DROP_KEYS and value is not None:
            return "[redacted]"
        if k in PHONE_KEYS and isinstance(value, str):
            return self.phone(value)
        if k in EMAIL_KEYS and isinstance(value, str):
            return self.email(value)
        if isinstance(value, Mapping):
            return {kk: self.value(kk, vv) for kk, vv in value.items()}
        if isinstance(value, list | tuple):
            return [self.value(k, v) for v in value]
        if isinstance(value, str):
            return self.text(value)
        return value

    def __call__(self, _logger: Any, _method: str, event_dict: dict[str, Any]) -> dict[str, Any]:
        return {k: self.value(k, v) for k, v in event_dict.items()}


def configure_logging(*, level: str = "INFO", fmt: str = "json", hash_salt: str) -> None:
    redactor = Redactor(hash_salt)
    shared: list[Any] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.format_exc_info,
        redactor,
    ]
    renderer: Any = (
        structlog.processors.JSONRenderer()
        if fmt == "json"
        else structlog.dev.ConsoleRenderer(colors=sys.stderr.isatty())
    )
    structlog.configure(
        processors=[*shared, structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(foreign_pre_chain=shared, processor=renderer)
    )
    root = logging.getLogger()
    root.handlers[:] = [handler]
    root.setLevel(level.upper())
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(name)
        lg.handlers[:] = []
        lg.propagate = True


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    return structlog.stdlib.get_logger(name)
