"""Custom SuperFences formatter for runnable Python examples."""

from __future__ import annotations

from html import escape
from typing import Any


def format_python_runner(
    source: str,
    language: str,
    class_name: str,
    options: dict[str, Any],
    md: Any,
    **kwargs: Any,
) -> str:
    """Render a ``python_runner`` fence as a Pyodide-backed runner."""
    attrs = kwargs.get("attrs") or {}
    title = attrs.get("title") or "Runnable Python"
    escaped_source = escape(source)
    escaped_title = escape(str(title), quote=True)

    classes = "python-runner"
    if class_name and class_name != "python-runner":
        classes = f"{classes} {escape(class_name, quote=True)}"

    return (
        f'<div class="{classes}" data-python-runner>'
        '<div class="python-runner__toolbar">'
        f'<span class="python-runner__title">{escaped_title}</span>'
        '<button class="python-runner__run" type="button">Run</button>'
        "</div>"
        '<pre class="python-runner__code"><code class="language-python">'
        f"{escaped_source}</code></pre>"
        '<pre class="python-runner__output" aria-live="polite" hidden></pre>'
        "</div>"
    )
