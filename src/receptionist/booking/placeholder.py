"""Placeholder attendee email for Cal.com (DESIGN.md 11.2, rev 3).

Template example: "myname+jb-{session_short}@gmail.com". {session_short} is the only field.
"""

from __future__ import annotations

import re
import string

_EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")


class PlaceholderTemplateError(ValueError):
    pass


def validate_template(template: str) -> None:
    fields = {f for _, f, _, _ in string.Formatter().parse(template) if f is not None}
    if fields != {"session_short"}:
        raise PlaceholderTemplateError(
            "placeholder template must use exactly the field {session_short}, "
            f"got {fields or 'none'}"
        )
    if not _EMAIL_RE.match(template.format(session_short="abc123")):
        raise PlaceholderTemplateError(f"{template!r} does not render to a valid email address")


def render_placeholder(template: str, conversation_id: str) -> str:
    validate_template(template)
    short = conversation_id.replace("-", "")[:6].lower()
    return template.format(session_short=short)
