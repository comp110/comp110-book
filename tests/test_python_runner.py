from __future__ import annotations

import functools
import http.server
import re
import subprocess
import sys
import threading
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


def serve_site() -> tuple[http.server.ThreadingHTTPServer, str]:
    handler = functools.partial(QuietHandler, directory=str(ROOT / "site"))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    return server, f"http://{host}:{port}"


def test_python_runner_examples_are_editable_and_run() -> None:
    subprocess.run(
        [sys.executable, "-m", "zensical", "build"],
        cwd=ROOT,
        check=True,
    )

    server, base_url = serve_site()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()
            messages: list[str] = []
            page.on("console", lambda msg: messages.append(f"{msg.type}: {msg.text}"))
            page.on("pageerror", lambda exc: messages.append(f"pageerror: {exc}"))

            page.goto(f"{base_url}/python-functions/", wait_until="networkidle")
            page.locator(".cm-editor").first.wait_for(
                state="visible",
                timeout=10_000,
            )

            assert page.locator("[data-python-runner]").count() == 3
            assert page.locator(".cm-editor").count() == 3
            assert page.locator(".python-runner__code:not([hidden])").count() == 0

            page.locator(".cm-editor").first.click()
            page.keyboard.press("Control+A")
            page.keyboard.type('print("edited in codemirror")')

            editor_text = page.evaluate(
                """
                document
                  .querySelector("[data-python-runner]")
                  .pythonRunnerEditor
                  .state
                  .doc
                  .toString()
                """
            )
            assert editor_text == 'print("edited in codemirror")'

            page.locator(".python-runner__run").first.click()
            output = page.locator(".python-runner__output").first
            expect(output).to_contain_text("edited in codemirror", timeout=60_000)

            def replace_editor_text(source: str) -> None:
                page.evaluate(
                    """
                    (source) => {
                      const editor = document
                        .querySelector("[data-python-runner]")
                        .pythonRunnerEditor;
                      editor.dispatch({
                        changes: {
                          from: 0,
                          to: editor.state.doc.length,
                          insert: source,
                        },
                      });
                    }
                    """,
                    source,
                )

            replace_editor_text(
                'def answer() -> int:\n'
                '    return "wrong"\n\n'
                'print(answer())\n'
            )
            page.locator(".python-runner__run").first.click()
            expect(output).to_contain_text("Incompatible return value type", timeout=60_000)
            expect(output).to_have_class(re.compile(r"\bis-error\b"))
            expect(page.locator(".python-runner__diagnostic--error").first).to_be_visible()

            replace_editor_text("def broken(:\n    pass\n")
            page.locator(".python-runner__run").first.click()
            expect(output).to_contain_text("SyntaxError", timeout=30_000)
            expect(output).to_contain_text("python-runner.py")
            expect(page.locator(".python-runner__diagnostic--error").first).to_be_visible()

            replace_editor_text(
                "def divide(left: int, right: int) -> float:\n"
                "    return left / right\n\n"
                "print(divide(1, 0))\n"
            )
            page.locator(".python-runner__run").first.click()
            expect(output).to_contain_text("ZeroDivisionError", timeout=30_000)
            expect(page.locator(".python-runner__diagnostic--error").first).to_be_visible()

            page.goto(f"{base_url}/python-canvas/", wait_until="networkidle")
            page.locator(".cm-editor").first.wait_for(
                state="visible",
                timeout=10_000,
            )

            assert page.locator("[data-python-canvas-demo]").count() == 1
            assert page.locator("[data-python-runner-canvas]").count() == 1
            assert page.locator("[data-python-runner]").count() == 1

            page.locator(".python-runner__run").first.click()
            canvas_output = page.locator(".python-runner__output").first
            expect(canvas_output).to_contain_text(
                "Drew a turtle-style spiral",
                timeout=60_000,
            )

            non_background_pixels = page.evaluate(
                """
                () => {
                  const canvas = document.querySelector("[data-python-runner-canvas]");
                  const context = canvas.getContext("2d");
                  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
                  let count = 0;

                  for (let index = 0; index < data.length; index += 4) {
                    const red = data[index];
                    const green = data[index + 1];
                    const blue = data[index + 2];
                    const alpha = data[index + 3];
                    if (alpha > 0 && !(red === 248 && green === 250 && blue === 252)) {
                      count += 1;
                    }
                  }

                  return count;
                }
                """
            )
            assert non_background_pixels > 1000

            assert not any("CodeMirror failed to load" in msg for msg in messages)
            assert not any(msg.startswith("pageerror:") for msg in messages)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
