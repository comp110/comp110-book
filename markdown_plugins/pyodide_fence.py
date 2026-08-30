"""Custom SuperFences formatters for runnable code examples."""

from __future__ import annotations

from html import escape
import re
from typing import Any


def _debug_icon(paths: str) -> str:
    return (
        '<svg class="python-diagram-runner__control-icon" '
        'viewBox="0 0 24 24" fill="none" stroke="currentColor" '
        'stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" '
        'aria-hidden="true" focusable="false">'
        f'{paths}</svg>'
    )


def _diagram_icon_button(classes: str, label: str, icon: str) -> str:
    escaped_label = escape(label, quote=True)
    return (
        f'<button class="{classes}" type="button" '
        f'title="{escaped_label}" aria-label="{escaped_label}">'
        f'{icon}</button>'
    )


def _diagram_play_button() -> str:
    return "".join(
        (
            "<button class=\"python-diagram-runner__play\" type=\"button\" ",
            "title=\"Play\" aria-label=\"Play\" aria-pressed=\"false\" ",
            "data-python-diagram-play-mode=\"play\">",
            DEBUG_ICONS["play"],
            "</button>",
        )
    )


DEBUG_ICONS = {
    "reset": _debug_icon(
        '<path d="M4 12a8 8 0 1 0 2.35-5.65"></path>'
        '<path d="M4 4v5h5"></path>'
    ),
    "run_breakpoint": _debug_icon(
        '<polygon points="6.7 5.5 14.2 12 6.7 18.5 6.7 5.5" fill="currentColor" stroke="none"></polygon>'
        '<circle class="python-diagram-runner__icon-breakpoint-ring" cx="18" cy="12" r="3.35"></circle>'
        '<circle class="python-diagram-runner__icon-breakpoint-dot" cx="18" cy="12" r="2.45"></circle>'
    ),
    "play": _debug_icon(
        '<polygon points="7.5 5.5 17 12 7.5 18.5 7.5 5.5" fill="currentColor" stroke="none"></polygon>'
    ),
    "step_back": _debug_icon(
        '<path d="M6 5v14"></path>'
        '<path d="M18 12H8"></path>'
        '<path d="m12 8-4 4 4 4"></path>'
    ),
    "step_into": _debug_icon(
        '<path d="M12 4v11"></path>'
        '<path d="m7.5 10.5 4.5 4.5 4.5-4.5"></path>'
        '<path d="M6.5 20h11"></path>'
    ),
    "step_over": _debug_icon(
        '<path d="M5 14a7 7 0 0 1 12.4-4.45"></path>'
        '<path d="M17.4 5.8V9.55H13.6"></path>'
        '<path d="M8 19h8"></path>'
    ),
    "step_out": _debug_icon(
        '<path d="M12 20V9"></path>'
        '<path d="m7.5 13.5 4.5-4.5 4.5 4.5"></path>'
        '<path d="M6.5 4h11"></path>'
    ),
    "run": _debug_icon(
        '<polygon points="6.7 5.5 15.2 12 6.7 18.5 6.7 5.5" fill="currentColor" stroke="none"></polygon>'
        '<path d="M18 5.5v13"></path>'
    ),
    "fullscreen": _debug_icon(
        '<path d="M8 3H5a2 2 0 0 0-2 2v3"></path>'
        '<path d="M16 3h3a2 2 0 0 1 2 2v3"></path>'
        '<path d="M21 16v3a2 2 0 0 1-2 2h-3"></path>'
        '<path d="M8 21H5a2 2 0 0 1-2-2v-3"></path>'
    ),
}


def _format_runner(
    source: str,
    class_name: str,
    *,
    code_language: str,
    data_attribute: str,
    default_title: str,
    extra_attributes: str = "",
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

    attributes = f"{data_attribute}{extra_attributes}"

    return (
        f'<div class="{classes}" {attributes}>'
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


def _boolean_option(value: object, *, default: bool) -> bool:
    if value is None:
        return default

    normalized = str(value).strip().casefold()
    if normalized in {"0", "false", "no", "off"}:
        return False
    if normalized in {"1", "true", "yes", "on"}:
        return True
    return default


def _highlight_lines(attrs: dict[str, Any]) -> str:
    value = next(
        (
            attrs[name]
            for name in (
                "highlight",
                "highlights",
                "line_highlight",
                "line_highlights",
                "line-highlight",
                "line-highlights",
                "highlight_lines",
                "hl_lines",
            )
            if name in attrs
        ),
        None,
    )
    if value is None:
        return ""

    lines: list[str] = []
    seen: set[int] = set()
    for part in re.split(r"[\s,]+", str(value).strip()):
        if not part:
            continue
        try:
            line = int(part)
        except ValueError:
            continue
        if line > 0 and line not in seen:
            seen.add(line)
            lines.append(str(line))
    return ",".join(lines)


def _runner_attributes(params: dict[str, Any]) -> str:
    attributes = []
    if not _boolean_option(params.get("editable"), default=True):
        attributes.append('data-runner-editable="false"')

    highlight_lines = _highlight_lines(params)
    if highlight_lines:
        attributes.append(f'data-runner-highlight-lines="{escape(highlight_lines, quote=True)}"')

    return f" {' '.join(attributes)}" if attributes else ""


def _runner_params(attrs: dict[str, Any], options: dict[str, Any]) -> dict[str, Any]:
    params = dict(attrs)
    for key, value in options.items():
        if key.startswith("_runner_"):
            params[key.removeprefix("_runner_")] = value
        elif key == "title" and key not in params:
            params[key] = value
    return params


def _is_runnable(params: dict[str, Any]) -> bool:
    return (
        _boolean_option(params.get("runnable"), default=False)
        or _boolean_option(params.get("run"), default=False)
    )


def _standard_fence_validator(
    language: str,
    inputs: dict[str, Any],
    options: dict[str, Any],
    attrs: dict[str, Any],
    md: Any,
) -> bool:
    """Validate standard language fences with optional runner controls."""
    from pymdownx.superfences import highlight_validator

    requested_runnable = (
        _boolean_option(inputs.get("runnable"), default=False)
        or _boolean_option(inputs.get("run"), default=False)
    )
    runner_names = {
        "runnable",
        "run",
        "editable",
        "highlight",
        "highlights",
        "line_highlight",
        "line_highlights",
        "line-highlight",
        "line-highlights",
        "highlight_lines",
    }
    if requested_runnable:
        runner_names.update({"hl_lines", "stdin"})

    highlight_inputs = {}
    for key, value in inputs.items():
        if key in runner_names:
            options[f"_runner_{key.replace('-', '_')}"] = value
        else:
            highlight_inputs[key] = value

    return highlight_validator(language, highlight_inputs, options, attrs, md)


def python_fence_validator(
    language: str,
    inputs: dict[str, Any],
    options: dict[str, Any],
    attrs: dict[str, Any],
    md: Any,
) -> bool:
    """Validate standard ``python`` fences with optional runner controls."""
    return _standard_fence_validator(language, inputs, options, attrs, md)


def c_fence_validator(
    language: str,
    inputs: dict[str, Any],
    options: dict[str, Any],
    attrs: dict[str, Any],
    md: Any,
) -> bool:
    """Validate standard ``c`` fences with optional runner controls."""
    return _standard_fence_validator(language, inputs, options, attrs, md)


def _highlight_fence(
    source: str,
    language: str,
    options: dict[str, Any],
    md: Any,
    **kwargs: Any,
) -> str:
    preprocessor = md.preprocessors["fenced_code_block"]
    highlight_options = {
        key: value
        for key, value in options.items()
        if not key.startswith("_runner_")
    }
    return preprocessor.highlight(source, language, highlight_options, md, **kwargs)


def format_python_fence(
    source: str,
    language: str,
    class_name: str,
    options: dict[str, Any],
    md: Any,
    **kwargs: Any,
) -> str:
    """Render standard ``python`` fences, optionally as Pyodide runners."""
    attrs = kwargs.get("attrs") or {}
    params = _runner_params(attrs, options)
    if not _is_runnable(params):
        return _highlight_fence(source, language, options, md, **kwargs)

    return _format_runner(
        source,
        "python-runner",
        code_language="python",
        data_attribute="data-python-runner",
        default_title="Runnable Python",
        extra_attributes=_runner_attributes(params),
        title=params.get("title"),
    )


def format_c_fence(
    source: str,
    language: str,
    class_name: str,
    options: dict[str, Any],
    md: Any,
    **kwargs: Any,
) -> str:
    """Render standard ``c`` fences, optionally as browser-compiled runners."""
    attrs = kwargs.get("attrs") or {}
    params = _runner_params(attrs, options)
    if not _is_runnable(params):
        return _highlight_fence(source, language, options, md, **kwargs)

    return _format_runner(
        source,
        "c-runner",
        code_language="c",
        data_attribute="data-c-runner",
        default_title="Runnable C",
        extra_attributes=_runner_attributes(params),
        stdin=str(params.get("stdin", "")),
        title=params.get("title"),
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
    title = attrs.get("title")
    editable_attribute = (
        "" if _boolean_option(attrs.get("editable"), default=False)
        else " data-runner-editable=\"false\""
    )
    escaped_source = escape(source)
    classes = "python-runner python-diagram-runner"
    if class_name and class_name not in {"python-runner", "python-diagram-runner"}:
        classes = f"{classes} {escape(class_name, quote=True)}"

    title_markup = ""
    if title:
        escaped_title = escape(str(title), quote=True)
        classes = f"{classes} python-diagram-runner--titled"
        title_markup = (
            "<div class=\"python-runner__toolbar\">"
            f"<span class=\"python-runner__title\">{escaped_title}</span>"
            "</div>"
        )

    controls_markup = "".join(
        (
            "<div class=\"python-diagram-runner__controls\">",
            _diagram_icon_button("python-diagram-runner__reset", "Reset", DEBUG_ICONS["reset"]),
            _diagram_icon_button("python-diagram-runner__step-back", "Step Back", DEBUG_ICONS["step_back"]),
            _diagram_icon_button("python-diagram-runner__run-breakpoint", "Run to Breakpoint", DEBUG_ICONS["run_breakpoint"]),
            _diagram_icon_button("python-diagram-runner__step python-diagram-runner__step-into", "Step Into", DEBUG_ICONS["step_into"]),
            _diagram_icon_button("python-diagram-runner__step-over", "Step Over", DEBUG_ICONS["step_over"]),
            _diagram_icon_button("python-diagram-runner__step-out", "Step Out", DEBUG_ICONS["step_out"]),
            _diagram_play_button(),
            _diagram_icon_button("python-diagram-runner__run", "Run to End", DEBUG_ICONS["run"]),
            _diagram_icon_button("python-diagram-runner__fullscreen", "Full Screen", DEBUG_ICONS["fullscreen"]),
            "</div>",
        )
    )

    return (
        f"<div class=\"{classes}\" data-python-diagram-runner{editable_attribute}>"
        f"{title_markup}"
        "<pre class=\"python-runner__code\"><code class=\"language-python\">"
        f"{escaped_source}</code></pre>"
        f"{controls_markup}"
        "<div class=\"python-diagram-runner__current-step\" "
        "data-python-diagram-current-step aria-live=\"polite\"></div>"
        "<div class=\"python-diagram-runner__workspace\">"
        "<canvas class=\"python-diagram-runner__canvas\" "
        "data-python-diagram-canvas width=\"1080\" height=\"640\" "
        "aria-label=\"Python memory diagram canvas\">"
        "Your browser does not support the canvas element."
        "</canvas>"
        "</div>"
        "<pre class=\"python-runner__output\" aria-live=\"polite\" hidden></pre>"
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
        extra_attributes=_runner_attributes(attrs),
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
