(function () {
  const pyodideUrl = "https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.js";
  const runnerFilename = "/tmp/python-runner.py";
  const displayFilename = "python-runner.py";
  const canvasModuleFilename = "/tmp/browser_canvas.py";
  const canvasStubFilename = "/tmp/browser_canvas.pyi";
  const canvasBridgeSource = `
from __future__ import annotations

import inspect
from typing import Any

from js import window


def _runner_id() -> str:
    frame: Any = inspect.currentframe()
    while frame is not None:
        value = frame.f_globals.get("__python_canvas_runner_id")
        if isinstance(value, str) and value:
            return value
        frame = frame.f_back
    raise RuntimeError("browser_canvas can only be used from a python_runner example.")


def _call(name: str, *args: object) -> None:
    getattr(window.__pythonRunnerCanvasBridge, name)(_runner_id(), *args)


def set_size(width: int, height: int) -> None:
    _call("setSize", width, height)


def clear(color: str = "#ffffff") -> None:
    _call("clear", color)


def line(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    color: str = "#2563eb",
    width: float = 3,
) -> None:
    _call("line", x1, y1, x2, y2, color, width)


def rectangle(
    x: float,
    y: float,
    width: float,
    height: float,
    fill: str | None = None,
    stroke: str = "#0f172a",
    line_width: float = 2,
) -> None:
    _call("rectangle", x, y, width, height, fill, stroke, line_width)


def circle(
    x: float,
    y: float,
    radius: float,
    fill: str | None = None,
    stroke: str = "#0f172a",
    line_width: float = 2,
) -> None:
    _call("circle", x, y, radius, fill, stroke, line_width)


def text(
    message: str,
    x: float,
    y: float,
    color: str = "#0f172a",
    size: int = 18,
    align: str = "center",
) -> None:
    _call("text", message, x, y, color, size, align)
`;
  const canvasBridgeStub = `
from typing import Literal

TextAlign = Literal["left", "center", "right"]

def set_size(width: int, height: int) -> None: ...
def clear(color: str = "#ffffff") -> None: ...
def line(
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    color: str = "#2563eb",
    width: float = 3,
) -> None: ...
def rectangle(
    x: float,
    y: float,
    width: float,
    height: float,
    fill: str | None = None,
    stroke: str = "#0f172a",
    line_width: float = 2,
) -> None: ...
def circle(
    x: float,
    y: float,
    radius: float,
    fill: str | None = None,
    stroke: str = "#0f172a",
    line_width: float = 2,
) -> None: ...
def text(
    message: str,
    x: float,
    y: float,
    color: str = "#0f172a",
    size: int = 18,
    align: TextAlign = "center",
) -> None: ...
`;
  const codeMirrorUrls = {
    highlight: "https://esm.sh/@lezer/highlight@1",
    language: "https://esm.sh/@codemirror/language@6",
    state: "https://esm.sh/@codemirror/state@6",
    view: "https://esm.sh/@codemirror/view@6",
    python: "https://esm.sh/@codemirror/lang-python@6",
  };

  let pyodidePromise;
  let codeMirrorPromise;
  let canvasModuleReady = false;
  let mypyPromise;
  let nextRunnerId = 0;

  function numberOr(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function colorOr(value, fallback) {
    return typeof value === "string" && value ? value : fallback;
  }

  function ensureRunnerId(widget) {
    if (!widget.dataset.pythonRunnerId) {
      nextRunnerId += 1;
      widget.dataset.pythonRunnerId = `python-runner-${nextRunnerId}`;
    }
    return widget.dataset.pythonRunnerId;
  }

  function findRunnerById(runnerId) {
    return Array.from(document.querySelectorAll("[data-python-runner-id]"))
      .find((widget) => widget.dataset.pythonRunnerId === String(runnerId));
  }

  function getCanvasContext(runnerId) {
    const widget = findRunnerById(runnerId);
    const demo = widget ? widget.closest("[data-python-canvas-demo]") : null;
    const canvas = demo ? demo.querySelector("[data-python-runner-canvas]") : null;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("No HTML canvas is paired with this Python runner.");
    }

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("This browser could not create a 2D canvas context.");
    }

    return { canvas, context };
  }

  window.__pythonRunnerCanvasBridge = {
    setSize(runnerId, width, height) {
      const { canvas } = getCanvasContext(runnerId);
      canvas.width = Math.max(1, Math.floor(numberOr(width, canvas.width)));
      canvas.height = Math.max(1, Math.floor(numberOr(height, canvas.height)));
    },

    clear(runnerId, color) {
      const { canvas, context } = getCanvasContext(runnerId);
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (color) {
        context.fillStyle = colorOr(color, "#ffffff");
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.restore();
    },

    line(runnerId, x1, y1, x2, y2, color, width) {
      const { context } = getCanvasContext(runnerId);
      context.save();
      context.strokeStyle = colorOr(color, "#2563eb");
      context.lineWidth = Math.max(0.5, numberOr(width, 3));
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(numberOr(x1, 0), numberOr(y1, 0));
      context.lineTo(numberOr(x2, 0), numberOr(y2, 0));
      context.stroke();
      context.restore();
    },

    rectangle(runnerId, x, y, width, height, fill, stroke, lineWidth) {
      const { context } = getCanvasContext(runnerId);
      const left = numberOr(x, 0);
      const top = numberOr(y, 0);
      const rectWidth = numberOr(width, 0);
      const rectHeight = numberOr(height, 0);
      context.save();
      if (fill) {
        context.fillStyle = colorOr(fill, "#ffffff");
        context.fillRect(left, top, rectWidth, rectHeight);
      }
      if (stroke) {
        context.strokeStyle = colorOr(stroke, "#0f172a");
        context.lineWidth = Math.max(0.5, numberOr(lineWidth, 2));
        context.strokeRect(left, top, rectWidth, rectHeight);
      }
      context.restore();
    },

    circle(runnerId, x, y, radius, fill, stroke, lineWidth) {
      const { context } = getCanvasContext(runnerId);
      context.save();
      context.beginPath();
      context.arc(
        numberOr(x, 0),
        numberOr(y, 0),
        Math.max(0, numberOr(radius, 0)),
        0,
        Math.PI * 2,
      );
      if (fill) {
        context.fillStyle = colorOr(fill, "#ffffff");
        context.fill();
      }
      if (stroke) {
        context.strokeStyle = colorOr(stroke, "#0f172a");
        context.lineWidth = Math.max(0.5, numberOr(lineWidth, 2));
        context.stroke();
      }
      context.restore();
    },

    text(runnerId, message, x, y, color, size, align) {
      const { context } = getCanvasContext(runnerId);
      const textAlign = ["left", "center", "right"].includes(align) ? align : "center";
      context.save();
      context.fillStyle = colorOr(color, "#0f172a");
      context.font = `${Math.max(1, numberOr(size, 18))}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.textAlign = textAlign;
      context.textBaseline = "middle";
      context.fillText(String(message), numberOr(x, 0), numberOr(y, 0));
      context.restore();
    },
  };

  function loadScript() {
    const existing = document.querySelector(`script[src="${pyodideUrl}"]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        if (window.loadPyodide) {
          resolve();
          return;
        }
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = pyodideUrl;
      script.async = true;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });
  }

  async function getPyodide() {
    if (!pyodidePromise) {
      pyodidePromise = loadScript().then(() => window.loadPyodide());
    }
    return pyodidePromise;
  }

  async function getCodeMirror() {
    if (!codeMirrorPromise) {
      codeMirrorPromise = Promise.all([
        import(codeMirrorUrls.highlight),
        import(codeMirrorUrls.language),
        import(codeMirrorUrls.state),
        import(codeMirrorUrls.view),
        import(codeMirrorUrls.python),
      ]).then(([highlight, language, state, view, pythonLanguage]) => ({
        ...createDiagnosticTools(view.EditorView, view.Decoration, state.StateEffect, state.StateField),
        EditorView: view.EditorView,
        highlightStyle: createHighlightStyle(language.HighlightStyle, highlight.tags),
        lineNumbers: view.lineNumbers,
        python: pythonLanguage.python,
        syntaxHighlighting: language.syntaxHighlighting,
      }));
    }
    return codeMirrorPromise;
  }

  function createHighlightStyle(HighlightStyle, tags) {
    return HighlightStyle.define([
      {
        tag: [tags.keyword, tags.operatorKeyword, tags.modifier],
        color: "var(--md-code-hl-keyword-color, #cf222e)",
      },
      {
        tag: [tags.name, tags.definition(tags.variableName), tags.variableName],
        color: "var(--md-code-fg-color, #24292f)",
      },
      {
        tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
        color: "var(--md-code-hl-function-color, #8250df)",
      },
      {
        tag: [tags.className, tags.typeName, tags.standard(tags.typeName)],
        color: "var(--md-code-hl-constant-color, #0550ae)",
      },
      {
        tag: [tags.string, tags.special(tags.string)],
        color: "var(--md-code-hl-string-color, #0a3069)",
      },
      {
        tag: [tags.number, tags.bool, tags.null],
        color: "var(--md-code-hl-number-color, #0550ae)",
      },
      {
        tag: [tags.comment, tags.docComment],
        color: "var(--md-code-hl-comment-color, #6e7781)",
        fontStyle: "italic",
      },
      {
        tag: [tags.operator, tags.punctuation, tags.separator],
        color: "var(--md-code-hl-operator-color, #24292f)",
      },
      {
        tag: tags.invalid,
        color: "var(--md-code-hl-special-color, #cf222e)",
      },
    ]);
  }

  function createDiagnosticTools(EditorView, Decoration, StateEffect, StateField) {
    const setDiagnosticsEffect = StateEffect.define();
    const diagnosticField = StateField.define({
      create() {
        return Decoration.none;
      },
      update(decorations, transaction) {
        let nextDecorations = decorations.map(transaction.changes);
        for (const effect of transaction.effects) {
          if (effect.is(setDiagnosticsEffect)) {
            nextDecorations = buildDiagnosticDecorations(
              Decoration,
              transaction.state.doc,
              effect.value,
            );
          }
        }
        return nextDecorations;
      },
      provide(field) {
        return EditorView.decorations.from(field);
      },
    });

    return { diagnosticField, setDiagnosticsEffect };
  }

  function buildDiagnosticDecorations(Decoration, doc, diagnostics) {
    const ranges = diagnostics
      .map((diagnostic) => {
        const range = diagnosticRange(doc, diagnostic);
        if (!range) {
          return undefined;
        }

        const severity = diagnostic.severity || "error";
        return Decoration.mark({
          attributes: {
            "data-python-runner-diagnostic": severity,
            title: diagnostic.message || "Python error",
          },
          class: `python-runner__diagnostic python-runner__diagnostic--${severity}`,
        }).range(range.from, range.to);
      })
      .filter(Boolean);

    return Decoration.set(ranges, true);
  }

  function diagnosticRange(doc, diagnostic) {
    if (!doc.length || !diagnostic.line) {
      return undefined;
    }

    const lineNumber = clampInteger(diagnostic.line, 1, doc.lines);
    const line = doc.line(lineNumber);
    const column = clampInteger(diagnostic.column || 1, 1, Math.max(1, line.length + 1));
    let from = Math.min(line.to, line.from + column - 1);
    let to = line.to;

    if (diagnostic.endLine || diagnostic.endColumn) {
      const endLineNumber = clampInteger(diagnostic.endLine || lineNumber, lineNumber, doc.lines);
      const endLine = doc.line(endLineNumber);
      const endColumn = clampInteger(
        diagnostic.endColumn || column + 1,
        1,
        Math.max(1, endLine.length + 1),
      );
      to = Math.min(endLine.to, endLine.from + endColumn - 1);
    }

    if (to <= from) {
      to = Math.min(doc.length, from + 1);
    }
    if (to <= from && from > line.from) {
      from -= 1;
    }
    if (to <= from) {
      return undefined;
    }

    return { from, to };
  }

  function clampInteger(value, min, max) {
    const integer = Number.parseInt(value, 10);
    if (Number.isNaN(integer)) {
      return min;
    }
    return Math.max(min, Math.min(max, integer));
  }

  function outputText(output, text, isError) {
    output.hidden = false;
    output.classList.toggle("is-error", isError);
    output.textContent = text || "(no output)";
  }

  function getSource(widget) {
    if (widget.pythonRunnerEditor) {
      return widget.pythonRunnerEditor.state.doc.toString();
    }
    return widget.querySelector(".python-runner__code code").textContent;
  }

  function setEditorDiagnostics(widget, diagnostics) {
    widget.pythonRunnerDiagnostics = diagnostics;
    if (!widget.pythonRunnerEditor || !widget.pythonRunnerDiagnosticsEffect) {
      return;
    }

    widget.pythonRunnerEditor.dispatch({
      effects: widget.pythonRunnerDiagnosticsEffect.of(diagnostics),
    });
  }

  function cleanRunnerOutput(text) {
    return (text || "")
      .split(runnerFilename).join(displayFilename)
      .split("<python-runner>").join(displayFilename)
      .trim();
  }

  async function installEditor(widget) {
    const codeBlock = widget.querySelector(".python-runner__code");
    const codeElement = codeBlock.querySelector("code");
    const editorHost = document.createElement("div");
    editorHost.className = "python-runner__editor";
    codeBlock.insertAdjacentElement("afterend", editorHost);

    try {
      const {
        EditorView,
        diagnosticField,
        highlightStyle,
        lineNumbers,
        python,
        setDiagnosticsEffect,
        syntaxHighlighting,
      } = await getCodeMirror();
      if (!widget.isConnected) {
        return;
      }

      widget.pythonRunnerDiagnosticsEffect = setDiagnosticsEffect;
      widget.pythonRunnerEditor = new EditorView({
        doc: codeElement.textContent,
        parent: editorHost,
        extensions: [
          lineNumbers(),
          python(),
          syntaxHighlighting(highlightStyle, { fallback: true }),
          diagnosticField,
          EditorView.lineWrapping,
          EditorView.theme({
            "&": {
              backgroundColor: "var(--md-code-bg-color)",
              color: "var(--md-code-fg-color)",
            },
            ".cm-content": {
              caretColor: "var(--md-default-fg-color)",
              padding: "0.85rem 0",
            },
            ".cm-gutters": {
              backgroundColor: "var(--md-code-bg-color)",
              borderRightColor: "var(--md-default-fg-color--lightest)",
              color: "var(--md-default-fg-color--light)",
            },
            ".cm-line": {
              padding: "0 1rem 0 0.7rem",
            },
            ".cm-scroller": {
              fontFamily: "var(--md-code-font, monospace)",
              lineHeight: "1.5",
            },
            "&.cm-focused": {
              outline: "2px solid var(--md-accent-fg-color)",
              outlineOffset: "-2px",
            },
          }),
        ],
      });
      if (widget.pythonRunnerDiagnostics) {
        setEditorDiagnostics(widget, widget.pythonRunnerDiagnostics);
      }
      codeBlock.hidden = true;
    } catch (error) {
      editorHost.remove();
      console.warn("CodeMirror failed to load; using static code fallback.", error);
    }
  }

  async function ensureMypy(pyodide) {
    if (!mypyPromise) {
      mypyPromise = pyodide
        .loadPackage(["micropip", "typing-extensions", "mypy"])
        .then(() => pyodide.runPythonAsync(`
import micropip
await micropip.install(["mypy-extensions==1.1.0", "pathspec==0.12.1"])
`));
    }
    return mypyPromise;
  }

  async function ensureCanvasModule(pyodide) {
    if (canvasModuleReady) {
      return;
    }

    pyodide.FS.writeFile(canvasModuleFilename, canvasBridgeSource.trimStart());
    pyodide.FS.writeFile(canvasStubFilename, canvasBridgeStub.trimStart());
    await pyodide.runPythonAsync(`
import sys
if "/tmp" not in sys.path:
    sys.path.insert(0, "/tmp")
`);
    canvasModuleReady = true;
  }

  async function checkSyntax(pyodide, code) {
    pyodide.globals.set("__markdown_runner_source", code);

    const result = await pyodide.runPythonAsync(`
import io
import json
import traceback

__markdown_runner_stderr = io.StringIO()
__markdown_runner_failed = False
__markdown_runner_diagnostics = []

try:
    compile(__markdown_runner_source, "${displayFilename}", "exec")
except SyntaxError as __markdown_runner_error:
    __markdown_runner_failed = True
    traceback.print_exc(file=__markdown_runner_stderr)
    __markdown_runner_lineno = __markdown_runner_error.lineno or 1
    __markdown_runner_offset = __markdown_runner_error.offset or 1
    __markdown_runner_diagnostics.append({
        "line": __markdown_runner_lineno,
        "column": __markdown_runner_offset,
        "endLine": __markdown_runner_error.end_lineno or __markdown_runner_lineno,
        "endColumn": __markdown_runner_error.end_offset or (__markdown_runner_offset + 1),
        "message": f"{type(__markdown_runner_error).__name__}: {__markdown_runner_error.msg}",
        "severity": "error",
        "source": "syntax",
    })

(
    __markdown_runner_stderr.getvalue(),
    __markdown_runner_failed,
    json.dumps(__markdown_runner_diagnostics),
)
`);
    const [stderr, failed, diagnosticsJson] = result.toJs();
    result.destroy();

    return {
      diagnostics: JSON.parse(diagnosticsJson),
      failed,
      output: cleanRunnerOutput(stderr),
    };
  }

  async function typeCheckPython(pyodide, code) {
    await ensureMypy(pyodide);
    pyodide.globals.set("__markdown_runner_source", code);

    const result = await pyodide.runPythonAsync(`
import json
import re
from mypy import api as mypy_api

with open("${runnerFilename}", "w", encoding="utf-8") as __markdown_runner_file:
    __markdown_runner_file.write(__markdown_runner_source)

__markdown_runner_stdout, __markdown_runner_stderr, __markdown_runner_status = mypy_api.run([
    "--check-untyped-defs",
    "--show-column-numbers",
    "--show-error-codes",
    "--no-color-output",
    "--no-error-summary",
    "--hide-error-context",
    "--cache-dir=/tmp/.mypy_cache",
    "${runnerFilename}",
])
__markdown_runner_pattern = re.compile(
    rf"^{re.escape('${runnerFilename}')}:(\\d+)(?::(\\d+))?:\\s*(error|warning|note):\\s*(.*)$"
)
__markdown_runner_diagnostics = []

for __markdown_runner_line in __markdown_runner_stdout.splitlines():
    __markdown_runner_match = __markdown_runner_pattern.match(__markdown_runner_line)
    if not __markdown_runner_match:
        continue

    __markdown_runner_severity = __markdown_runner_match.group(3)
    if __markdown_runner_severity == "note":
        __markdown_runner_severity = "info"

    __markdown_runner_diagnostics.append({
        "line": int(__markdown_runner_match.group(1)),
        "column": int(__markdown_runner_match.group(2) or 1),
        "message": f"mypy: {__markdown_runner_match.group(4)}",
        "severity": __markdown_runner_severity,
        "source": "mypy",
    })

(
    __markdown_runner_stdout,
    __markdown_runner_stderr,
    __markdown_runner_status,
    json.dumps(__markdown_runner_diagnostics),
)
`);
    const [stdout, stderr, status, diagnosticsJson] = result.toJs();
    result.destroy();

    return {
      diagnostics: JSON.parse(diagnosticsJson),
      failed: status !== 0,
      output: cleanRunnerOutput([stdout, stderr].filter(Boolean).join("\n")),
    };
  }

  async function executePython(pyodide, code, widget) {
    pyodide.globals.set("__markdown_runner_source", code);
    pyodide.globals.set("__markdown_runner_canvas_runner_id", ensureRunnerId(widget));

    const result = await pyodide.runPythonAsync(`
import contextlib
import io
import json
import traceback

__markdown_runner_stdout = io.StringIO()
__markdown_runner_stderr = io.StringIO()
__markdown_runner_failed = False
__markdown_runner_diagnostics = []

try:
    __markdown_runner_code = compile(__markdown_runner_source, "${displayFilename}", "exec")
    __markdown_runner_globals = {
        "__python_canvas_runner_id": __markdown_runner_canvas_runner_id,
    }
    with contextlib.redirect_stdout(__markdown_runner_stdout), contextlib.redirect_stderr(__markdown_runner_stderr):
        exec(__markdown_runner_code, __markdown_runner_globals)
except Exception as __markdown_runner_error:
    __markdown_runner_failed = True
    traceback.print_exc(file=__markdown_runner_stderr)
    for __markdown_runner_frame in traceback.extract_tb(__markdown_runner_error.__traceback__):
        if __markdown_runner_frame.filename == "${displayFilename}":
            __markdown_runner_diagnostics.append({
                "line": __markdown_runner_frame.lineno,
                "column": 1,
                "message": f"{type(__markdown_runner_error).__name__}: {__markdown_runner_error}",
                "severity": "error",
                "source": "runtime",
            })

(
    __markdown_runner_stdout.getvalue(),
    __markdown_runner_stderr.getvalue(),
    __markdown_runner_failed,
    json.dumps(__markdown_runner_diagnostics),
)
`);
    const [stdout, stderr, failed, diagnosticsJson] = result.toJs();
    result.destroy();

    return {
      diagnostics: JSON.parse(diagnosticsJson),
      failed,
      output: cleanRunnerOutput([stdout, stderr].filter(Boolean).join("\n")),
    };
  }

  async function runPython(widget) {
    const button = widget.querySelector(".python-runner__run");
    const output = widget.querySelector(".python-runner__output");
    const code = getSource(widget);

    button.disabled = true;
    setEditorDiagnostics(widget, []);
    outputText(output, "Loading Python...", false);

    try {
      const pyodide = await getPyodide();
      outputText(output, "Checking syntax...", false);

      const syntaxResult = await checkSyntax(pyodide, code);
      if (syntaxResult.failed) {
        setEditorDiagnostics(widget, syntaxResult.diagnostics);
        outputText(output, syntaxResult.output, true);
        return;
      }

      outputText(output, "Preparing canvas helpers...", false);
      await ensureCanvasModule(pyodide);

      outputText(output, "Type checking...", false);
      const typeCheckResult = await typeCheckPython(pyodide, code);
      if (typeCheckResult.failed) {
        setEditorDiagnostics(widget, typeCheckResult.diagnostics);
        outputText(output, typeCheckResult.output || "Type checking failed.", true);
        return;
      }

      outputText(output, "Running...", false);
      const executionResult = await executePython(pyodide, code, widget);
      setEditorDiagnostics(widget, executionResult.diagnostics);
      outputText(output, executionResult.output, executionResult.failed);
    } catch (error) {
      outputText(output, error && error.stack ? error.stack : String(error), true);
    } finally {
      button.disabled = false;
    }
  }

  function initialize(root) {
    root.querySelectorAll("[data-python-runner]:not([data-python-runner-ready])")
      .forEach((widget) => {
        ensureRunnerId(widget);
        widget.setAttribute("data-python-runner-ready", "true");
        installEditor(widget);
        widget.querySelector(".python-runner__run")
          .addEventListener("click", () => runPython(widget));
      });
  }

  document.addEventListener("DOMContentLoaded", () => initialize(document));

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => initialize(document));
  }

  initialize(document);
}());
