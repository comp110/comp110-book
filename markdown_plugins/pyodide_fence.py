"""Custom SuperFences formatters for runnable code examples."""

from __future__ import annotations

from html import escape
from typing import Any


def _format_runner(
    source: str,
    class_name: str,
    *,
    code_language: str,
    data_attribute: str,
    default_title: str,
    stdin: str | None = None,
    terminal: bool = False,
    title: object | None = None,
) -> str:
    """Render a runnable code fence with the shared runner markup."""
    title = title or default_title
    escaped_source = escape(source)
    escaped_title = escape(str(title), quote=True)

    classes = "python-runner"
    if class_name and class_name != "python-runner":
        classes = f"{classes} {escape(class_name, quote=True)}"

    stdin_markup = ""
    if stdin is not None:
        escaped_stdin = escape(stdin)
        stdin_markup = (
            '<label class="python-runner__stdin-label">'
            "<span>stdin</span>"
            '<textarea class="python-runner__stdin" data-c-runner-stdin '
            'spellcheck="false">'
            f"{escaped_stdin}</textarea>"
            "</label>"
        )

    terminal_markup = ""
    if terminal:
        terminal_markup = (
            '<div class="python-runner__terminal" '
            'data-c-terminal-runner-terminal '
            'aria-label="Interactive C terminal"></div>'
        )

    return (
        f'<div class="{classes}" {data_attribute}>'
        '<div class="python-runner__toolbar">'
        f'<span class="python-runner__title">{escaped_title}</span>'
        '<button class="python-runner__run" type="button">Run</button>'
        "</div>"
        f'<pre class="python-runner__code"><code class="language-{code_language}">'
        f"{escaped_source}</code></pre>"
        f"{stdin_markup}"
        f"{terminal_markup}"
        '<pre class="python-runner__output" aria-live="polite" hidden></pre>'
        "</div>"
    )


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
    return _format_runner(
        source,
        class_name,
        code_language="python",
        data_attribute="data-python-runner",
        default_title="Runnable Python",
        title=attrs.get("title"),
    )


def format_python_diagram_runner(
    source: str,
    language: str,
    class_name: str,
    options: dict[str, Any],
    md: Any,
    **kwargs: Any,
) -> str:
    """Render a ``python_diagram_runner`` fence as a memory-diagram stepper."""
    attrs = kwargs.get("attrs") or {}
    title = attrs.get("title") or "Python Memory Diagram"
    escaped_source = escape(source)
    escaped_title = escape(str(title), quote=True)
    classes = "python-runner python-diagram-runner"
    if class_name and class_name not in {"python-runner", "python-diagram-runner"}:
        classes = f"{classes} {escape(class_name, quote=True)}"

    return (
        f'<div class="{classes}" data-python-diagram-runner>'
        '<div class="python-runner__toolbar">'
        f'<span class="python-runner__title">{escaped_title}</span>'
        '<div class="python-diagram-runner__controls">'
        '<button class="python-diagram-runner__reset" type="button">Reset</button>'
        '<button class="python-diagram-runner__step" type="button">Step</button>'
        '<button class="python-runner__run python-diagram-runner__run" '
        'type="button">Run</button>'
        "</div>"
        "</div>"
        '<pre class="python-runner__code"><code class="language-python">'
        f"{escaped_source}</code></pre>"
        '<div class="python-diagram-runner__current-step" '
        'data-python-diagram-current-step aria-live="polite"></div>'
        '<div class="python-diagram-runner__workspace">'
        '<canvas class="python-diagram-runner__canvas" '
        'data-python-diagram-canvas width="1080" height="640" '
        'aria-label="Python memory diagram canvas">'
        "Your browser does not support the canvas element."
        "</canvas>"
        "</div>"
        '<pre class="python-runner__output" aria-live="polite" hidden></pre>'
        "</div>"
    )


def format_c_runner(
    source: str,
    language: str,
    class_name: str,
    options: dict[str, Any],
    md: Any,
    **kwargs: Any,
) -> str:
    """Render a ``c_runner`` fence as a browser-compiled C runner."""
    attrs = kwargs.get("attrs") or {}
    return _format_runner(
        source,
        class_name,
        code_language="c",
        data_attribute="data-c-runner",
        default_title="Runnable C",
        stdin=str(attrs.get("stdin", "")),
        title=attrs.get("title"),
    )


def format_c_terminal_runner(
    source: str,
    language: str,
    class_name: str,
    options: dict[str, Any],
    md: Any,
    **kwargs: Any,
) -> str:
    """Render a ``c_terminal_runner`` fence as an interactive C terminal."""
    attrs = kwargs.get("attrs") or {}
    return _format_runner(
        source,
        class_name,
        code_language="c",
        data_attribute="data-c-terminal-runner",
        default_title="Interactive C",
        terminal=True,
        title=attrs.get("title"),
    )
