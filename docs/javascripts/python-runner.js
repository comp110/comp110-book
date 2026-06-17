(function () {
  const pyodideUrl = "https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.js";
  const codeMirrorUrls = {
    view: "https://esm.sh/@codemirror/view@6",
    python: "https://esm.sh/@codemirror/lang-python@6",
  };

  let pyodidePromise;
  let codeMirrorPromise;

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
        import(codeMirrorUrls.view),
        import(codeMirrorUrls.python),
      ]).then(([view, pythonLanguage]) => ({
        EditorView: view.EditorView,
        lineNumbers: view.lineNumbers,
        python: pythonLanguage.python,
      }));
    }
    return codeMirrorPromise;
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

  async function installEditor(widget) {
    const codeBlock = widget.querySelector(".python-runner__code");
    const codeElement = codeBlock.querySelector("code");
    const editorHost = document.createElement("div");
    editorHost.className = "python-runner__editor";
    codeBlock.insertAdjacentElement("afterend", editorHost);

    try {
      const { EditorView, lineNumbers, python } = await getCodeMirror();
      if (!widget.isConnected) {
        return;
      }

      widget.pythonRunnerEditor = new EditorView({
        doc: codeElement.textContent,
        parent: editorHost,
        extensions: [
          lineNumbers(),
          python(),
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
      codeBlock.hidden = true;
    } catch (error) {
      editorHost.remove();
      console.warn("CodeMirror failed to load; using static code fallback.", error);
    }
  }

  async function runPython(widget) {
    const button = widget.querySelector(".python-runner__run");
    const output = widget.querySelector(".python-runner__output");
    const code = getSource(widget);

    button.disabled = true;
    outputText(output, "Loading Python...", false);

    try {
      const pyodide = await getPyodide();
      outputText(output, "Running...", false);
      pyodide.globals.set("__markdown_runner_source", code);

      const result = await pyodide.runPythonAsync(`
import contextlib
import io
import traceback

__markdown_runner_stdout = io.StringIO()
__markdown_runner_stderr = io.StringIO()
__markdown_runner_failed = False

try:
    with contextlib.redirect_stdout(__markdown_runner_stdout), contextlib.redirect_stderr(__markdown_runner_stderr):
        exec(__markdown_runner_source, {})
except Exception:
    __markdown_runner_failed = True
    traceback.print_exc(file=__markdown_runner_stderr)

(
    __markdown_runner_stdout.getvalue(),
    __markdown_runner_stderr.getvalue(),
    __markdown_runner_failed,
)
`);
      const [stdout, stderr, failed] = result.toJs();
      result.destroy();

      const text = [stdout, stderr].filter(Boolean).join("\n");
      outputText(output, text, failed);
    } catch (error) {
      outputText(output, error && error.stack ? error.stack : String(error), true);
    } finally {
      button.disabled = false;
    }
  }

  function initialize(root) {
    root.querySelectorAll("[data-python-runner]:not([data-python-runner-ready])")
      .forEach((widget) => {
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
