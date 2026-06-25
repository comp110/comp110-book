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
    cross_origin_isolated = False

    def end_headers(self) -> None:
        if self.cross_origin_isolated:
            self.send_header("Cross-Origin-Opener-Policy", "same-origin")
            self.send_header("Cross-Origin-Embedder-Policy", "credentialless")
        super().end_headers()

    def log_message(self, format: str, *args: object) -> None:
        pass


def serve_site(*, cross_origin_isolated: bool = False) -> tuple[http.server.ThreadingHTTPServer, str]:
    handler_class = type(
        "ConfiguredQuietHandler",
        (QuietHandler,),
        {"cross_origin_isolated": cross_origin_isolated},
    )
    handler = functools.partial(handler_class, directory=str(ROOT / "site"))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    host, port = server.server_address
    return server, f"http://{host}:{port}"


def expect_runner_preload_ready(page) -> None:
    runner = page.locator("[data-python-runner]").first
    expect(runner).to_have_attribute(
        "data-python-runner-preload",
        "ready",
        timeout=90_000,
    )


def wait_for_terminal_text(page, index: int, text: str, timeout: int = 180_000) -> None:
    page.wait_for_function(
        """
        ({ index, text }) => {
          const widget = document.querySelectorAll("[data-c-terminal-runner]")[index];
          return Boolean(widget && (widget.cTerminalRunnerTranscript || "").includes(text));
        }
        """,
        arg={"index": index, "text": text},
        timeout=timeout,
    )


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

            page.goto(f"{base_url}/python-functions/", wait_until="domcontentloaded")
            page.locator(".cm-editor").first.wait_for(
                state="visible",
                timeout=10_000,
            )

            assert page.locator("[data-python-runner]").count() == 3
            assert page.locator(".cm-editor").count() == 3
            assert page.locator(".python-runner__code:not([hidden])").count() == 0
            expect_runner_preload_ready(page)
            expect(page.locator(".python-runner__output").first).to_be_hidden()

            first_runner = page.locator("[data-python-runner]").nth(0)
            readonly_runner = page.locator("[data-python-runner]").nth(2)
            expect(first_runner).to_have_attribute("data-python-runner-highlight-lines", "1,5")
            expect(first_runner.locator(".python-runner__title")).to_have_text("Tax Calculator")
            expect(readonly_runner).to_have_attribute("data-python-runner-editable", "false")
            expect(readonly_runner).to_have_attribute("data-python-runner-highlight-lines", "1,5")
            expect(first_runner.locator(".python-runner__line-highlight")).to_have_count(2)
            expect(readonly_runner.locator(".python-runner__line-highlight")).to_have_count(2)
            expect(readonly_runner.locator(".cm-content")).to_have_attribute("contenteditable", "false")

            highlight_styles = page.evaluate(
                """
                () => {
                  const line = document.querySelector(".python-runner__line-highlight");
                  const originalRootScheme = document.documentElement.getAttribute("data-md-color-scheme");
                  const originalBodyScheme = document.body.getAttribute("data-md-color-scheme");

                  const styleFor = (scheme) => {
                    document.documentElement.setAttribute("data-md-color-scheme", scheme);
                    document.body.setAttribute("data-md-color-scheme", scheme);
                    const style = getComputedStyle(line);
                    return {
                      background: style.backgroundColor,
                      shadow: style.boxShadow,
                    };
                  };

                  const light = styleFor("default");
                  const dark = styleFor("slate");

                  if (originalRootScheme === null) {
                    document.documentElement.removeAttribute("data-md-color-scheme");
                  } else {
                    document.documentElement.setAttribute("data-md-color-scheme", originalRootScheme);
                  }

                  if (originalBodyScheme === null) {
                    document.body.removeAttribute("data-md-color-scheme");
                  } else {
                    document.body.setAttribute("data-md-color-scheme", originalBodyScheme);
                  }

                  return {
                    darkBackground: dark.background,
                    darkShadow: dark.shadow,
                    lightBackground: light.background,
                    lightShadow: light.shadow,
                  };
                }
                """
            )
            assert "rgba(0, 0, 0, 0)" not in highlight_styles["lightBackground"]
            assert "rgba(0, 0, 0, 0)" not in highlight_styles["darkBackground"]
            assert highlight_styles["lightBackground"] != highlight_styles["darkBackground"]
            assert highlight_styles["lightShadow"] != "none"
            assert highlight_styles["darkShadow"] != "none"

            readonly_source = page.evaluate(
                """
                document
                  .querySelectorAll("[data-python-runner]")[2]
                  .pythonRunnerEditor
                  .state
                  .doc
                  .toString()
                """
            )
            readonly_text = page.evaluate(
                """
                () => {
                  const widget = document.querySelectorAll("[data-python-runner]")[2];
                  widget.querySelector(".cm-content").focus();
                  document.execCommand("insertText", false, 'print("readonly edit attempt")');
                  return widget.pythonRunnerEditor.state.doc.toString();
                }
                """
            )
            assert readonly_text == readonly_source
            expect(readonly_runner.locator(".python-runner__line-highlight")).to_have_count(2)

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
            expect(first_runner.locator(".python-runner__line-highlight")).to_have_count(0)

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
            expect(output).to_contain_text(
                "Line 2, Col 12: error: Incompatible return value type",
                timeout=60_000,
            )
            assert "python-runner.py" not in output.inner_text()
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

            page.goto(f"{base_url}/python-canvas/", wait_until="domcontentloaded")
            page.locator(".cm-editor").first.wait_for(
                state="visible",
                timeout=10_000,
            )

            assert page.locator("[data-python-canvas-demo]").count() == 1
            assert page.locator("[data-python-runner-canvas]").count() == 1
            assert page.locator("[data-python-runner]").count() == 1
            expect_runner_preload_ready(page)

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

            page.goto(f"{base_url}/python-pygame/", wait_until="domcontentloaded")
            page.locator(".cm-editor").first.wait_for(
                state="visible",
                timeout=10_000,
            )

            assert page.locator("[data-python-game-demo]").count() == 1
            assert page.locator("[data-python-game-canvas]").count() == 1
            assert page.locator("[data-python-runner]").count() == 1
            expect_runner_preload_ready(page)

            page.locator(".python-runner__run").first.click()
            game_output = page.locator(".python-runner__output").first
            expect(game_output).to_contain_text("Game ready", timeout=60_000)
            expect(game_output).to_contain_text("physics2d gravity", timeout=60_000)
            expect(game_output).to_contain_text("Game running", timeout=60_000)

            def game_pixel_count() -> int:
                return page.evaluate(
                    """
                    () => {
                      const canvas = document.querySelector("[data-python-game-canvas]");
                      const context = canvas.getContext("2d");
                      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
                      let count = 0;

                      for (let index = 0; index < data.length; index += 4) {
                        if (data[index + 3] > 0) {
                          count += 1;
                        }
                      }

                      return count;
                    }
                    """
                )

            game_pixels = game_pixel_count()
            for _ in range(20):
                if game_pixels > 1000:
                    break
                page.wait_for_timeout(100)
                game_pixels = game_pixel_count()
            assert game_pixels > 1000

            replace_editor_text(
                "import pygame\n\n"
                "screen = pygame.display.set_mode((320, 180))\n"
                "player = pygame.Rect(20, 70, 30, 30)\n\n"
                "def update(dt: float) -> None:\n"
                "    keys = pygame.key.get_pressed()\n"
                "    if keys[pygame.K_RIGHT]:\n"
                "        player.move_ip(260 * dt, 0)\n\n"
                "def draw() -> None:\n"
                "    screen.fill((0, 0, 0))\n"
                "    pygame.draw.rect(screen, (255, 0, 0), player)\n"
                "    pygame.display.flip()\n\n"
                "print('deterministic pygame demo ready')\n"
            )
            page.locator(".python-runner__run").first.click()
            expect(game_output).to_contain_text(
                "deterministic pygame demo ready",
                timeout=60_000,
            )

            def red_bounds() -> dict[str, int]:
                return page.evaluate(
                    """
                    () => {
                      const canvas = document.querySelector("[data-python-game-canvas]");
                      const context = canvas.getContext("2d");
                      const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
                      let count = 0;
                      let minX = canvas.width;
                      let maxX = -1;

                      for (let index = 0; index < data.length; index += 4) {
                        const pixel = index / 4;
                        const x = pixel % canvas.width;
                        const red = data[index];
                        const green = data[index + 1];
                        const blue = data[index + 2];
                        const alpha = data[index + 3];
                        if (alpha > 0 && red > 220 && green < 80 && blue < 80) {
                          count += 1;
                          minX = Math.min(minX, x);
                          maxX = Math.max(maxX, x);
                        }
                      }

                      return { count, minX, maxX };
                    }
                    """
                )

            initial_bounds = red_bounds()
            for _ in range(20):
                if initial_bounds["count"] > 100:
                    break
                page.wait_for_timeout(100)
                initial_bounds = red_bounds()
            assert initial_bounds["count"] > 100

            page.locator("[data-python-game-canvas]").first.click()
            page.keyboard.down("ArrowRight")
            page.wait_for_timeout(600)
            page.keyboard.up("ArrowRight")

            moved_bounds = red_bounds()
            assert moved_bounds["count"] > 100
            assert moved_bounds["minX"] > initial_bounds["minX"] + 40

            assert not any("CodeMirror failed to load" in msg for msg in messages)
            assert not any(msg.startswith("pageerror:") for msg in messages)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


def test_python_diagram_runner_steps_and_reports_errors() -> None:
    subprocess.run(
        [sys.executable, "-m", "zensical", "build", "--clean"],
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

            page.goto(f"{base_url}/python-diagram/", wait_until="domcontentloaded")
            page.locator("[data-python-diagram-runner-ready]").first.wait_for(
                state="attached",
                timeout=10_000,
            )

            assert page.locator("[data-python-diagram-runner]").count() == 1
            assert page.locator("[data-python-diagram-canvas]").count() == 1
            assert page.locator("[data-python-diagram-trace]").count() == 0
            assert page.locator(".python-runner__code:not([hidden])").count() == 0
            page.locator(".python-diagram-runner__editor .cm-editor").first.wait_for(
                state="visible",
                timeout=60_000,
            )
            assert page.locator(".python-diagram-runner__editor .cm-lineNumbers").count() == 1
            assert page.locator(".python-diagram-runner__editor .cm-content .cm-line span").count() > 0
            expect(page.locator(".python-diagram-runner__run-breakpoint")).to_be_disabled()
            expect(page.locator(".python-diagram-runner__step-back")).to_be_disabled()
            assert page.locator(".python-diagram-runner__step-back").count() == 1
            assert page.locator(".python-diagram-runner__step-into").count() == 1
            assert page.locator(".python-diagram-runner__step-over").count() == 1
            assert page.locator(".python-diagram-runner__step-out").count() == 1
            assert page.locator(".python-diagram-runner__play").count() == 1
            assert page.locator(".python-diagram-runner__fullscreen").count() == 1
            assert page.locator(".python-diagram-runner__controls button svg").count() == 9
            assert page.evaluate(
                """
                () => Array.from(
                  document.querySelectorAll(".python-diagram-runner__controls button"),
                ).map((button) => ({
                  label: button.getAttribute("aria-label"),
                  pressed: button.getAttribute("aria-pressed"),
                  title: button.getAttribute("title"),
                  text: button.textContent.trim(),
                }))
                """,
            ) == [
                {"label": "Reset", "pressed": None, "title": "Reset", "text": ""},
                {"label": "Step Back", "pressed": None, "title": "Step Back", "text": ""},
                {"label": "Run to Breakpoint", "pressed": None, "title": "Run to Breakpoint", "text": ""},
                {"label": "Step Into", "pressed": None, "title": "Step Into", "text": ""},
                {"label": "Step Over", "pressed": None, "title": "Step Over", "text": ""},
                {"label": "Step Out", "pressed": None, "title": "Step Out", "text": ""},
                {"label": "Play at 1.0x", "pressed": "false", "title": "Play at 1.0x", "text": "1.0x"},
                {"label": "Run to End", "pressed": None, "title": "Run to End", "text": ""},
                {"label": "Full Screen", "pressed": "false", "title": "Full Screen", "text": ""},
            ]

            page.locator(".python-diagram-runner__fullscreen").click()
            page.wait_for_function(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .getAttribute("data-python-diagram-fullscreen") === "true"
                """,
            )
            fullscreen_layout = page.evaluate(
                """
                () => {
                  const widget = document.querySelector("[data-python-diagram-runner]");
                  const editor = widget.querySelector(".python-diagram-runner__editor");
                  const workspace = widget.querySelector(".python-diagram-runner__workspace");
                  const button = widget.querySelector(".python-diagram-runner__fullscreen");
                  const editorRect = editor.getBoundingClientRect();
                  const workspaceRect = workspace.getBoundingClientRect();
                  const widgetRect = widget.getBoundingClientRect();
                  return {
                    bodyLocked: document.body.classList.contains("python-diagram-runner-fullscreen-open"),
                    buttonLabel: button.getAttribute("aria-label"),
                    buttonPressed: button.getAttribute("aria-pressed"),
                    editorLeft: editorRect.left,
                    editorRight: editorRect.right,
                    editorWidth: editorRect.width,
                    widgetHeight: widgetRect.height,
                    widgetWidth: widgetRect.width,
                    workspaceLeft: workspaceRect.left,
                    workspaceRight: workspaceRect.right,
                    workspaceWidth: workspaceRect.width,
                  };
                }
                """,
            )
            assert fullscreen_layout["bodyLocked"] is True
            assert fullscreen_layout["buttonLabel"] == "Exit Full Screen"
            assert fullscreen_layout["buttonPressed"] == "true"
            assert fullscreen_layout["widgetWidth"] == page.viewport_size["width"]
            assert fullscreen_layout["widgetHeight"] == page.viewport_size["height"]
            assert fullscreen_layout["editorLeft"] < fullscreen_layout["workspaceLeft"]
            assert fullscreen_layout["editorRight"] <= fullscreen_layout["workspaceLeft"] + 1
            assert abs(fullscreen_layout["editorWidth"] - fullscreen_layout["workspaceWidth"]) <= 2

            page.locator(".python-diagram-runner__fullscreen").click()
            page.wait_for_function(
                """
                () => !document
                  .querySelector("[data-python-diagram-runner]")
                  .hasAttribute("data-python-diagram-fullscreen")
                """,
            )
            expect(page.locator(".python-diagram-runner__fullscreen")).to_have_attribute(
                "aria-label",
                "Full Screen",
            )

            page.evaluate(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.setBreakpoint(14, true)
                """
            )
            expect(page.locator(".python-diagram-runner__run-breakpoint")).to_be_enabled()
            assert page.evaluate(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.breakpoints.has(14)
                """
            ) is True
            assert page.locator(".python-diagram-runner__breakpoint-marker").count() >= 1

            current_step = page.locator("[data-python-diagram-current-step]")
            expect(current_step).to_be_hidden()
            assert page.evaluate(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.stepIndex
                """,
            ) == -1

            def selected_source() -> str:
                return page.evaluate(
                    """
                    () => {
                      const source = document
                        .querySelector("[data-python-diagram-runner]")
                        .pythonDiagramRunner.source;
                      if (source.view) {
                        const selection = source.view.state.selection.main;
                        return source.value.slice(selection.from, selection.to);
                      }
                      return source.value.slice(
                        source.element.selectionStart,
                        source.element.selectionEnd,
                      );
                    }
                    """,
                )

            def replace_diagram_source(source: str) -> None:
                page.evaluate(
                    """
                    (source) => document
                      .querySelector("[data-python-diagram-runner]")
                      .pythonDiagramRunner.source.setValue(source)
                    """,
                    source,
                )

            def callout_geometry() -> dict[str, float | bool | str]:
                return page.evaluate(
                    """
                    () => {
                      const widget = document.querySelector("[data-python-diagram-runner]");
                      const callout = widget.querySelector("[data-python-diagram-current-step]");
                      const toolbar = widget.querySelector(".python-runner__toolbar");
                      const source = widget.pythonDiagramRunner.source;
                      const selection = source.view.state.selection.main;
                      const start = source.view.coordsAtPos(selection.from, 1);
                      const end = source.view.coordsAtPos(selection.to, -1) || start;
                      const calloutRect = callout.getBoundingClientRect();
                      const toolbarRect = toolbar.getBoundingClientRect();
                      const anchorCenter = (Math.min(start.left, end.left) + Math.max(start.right || start.left, end.right || end.left)) / 2;
                      const calloutCenter = calloutRect.left + calloutRect.width / 2;
                      return {
                        centerDelta: Math.abs(calloutCenter - anchorCenter),
                        overlapsToolbar: !(calloutRect.right < toolbarRect.left || calloutRect.left > toolbarRect.right || calloutRect.bottom < toolbarRect.top || calloutRect.top > toolbarRect.bottom),
                        placement: callout.dataset.placement || "",
                        pointerX: parseFloat(getComputedStyle(callout).getPropertyValue("--python-diagram-callout-pointer-x")),
                      };
                    }
                    """
                )

            play_button = page.locator(".python-diagram-runner__play")
            expect(play_button).to_be_enabled()
            expect(play_button).to_contain_text("1.0x")
            play_button_metrics = page.evaluate(
                """
                () => {
                  const button = document.querySelector(".python-diagram-runner__play");
                  const icon = button.querySelector(".python-diagram-runner__control-icon");
                  const speed = button.querySelector(".python-diagram-runner__play-speed");
                  return {
                    buttonWidth: button.getBoundingClientRect().width,
                    iconWidth: icon.getBoundingClientRect().width,
                    speedWidth: speed.getBoundingClientRect().width,
                  };
                }
                """,
            )
            assert play_button_metrics["buttonWidth"] >= 80
            assert play_button_metrics["iconWidth"] >= 20
            assert play_button_metrics["speedWidth"] >= 28
            play_button.click()
            expect(play_button).to_have_attribute("aria-pressed", "true")
            expect(play_button).to_have_attribute("aria-label", "Set playback speed to 1.5x")
            expect(play_button).to_contain_text("1.5x")
            active_play_styles = page.evaluate(
                """
                () => {
                  const style = getComputedStyle(document.querySelector(".python-diagram-runner__play"));
                  return { background: style.backgroundColor, color: style.color };
                }
                """,
            )
            assert active_play_styles == {
                "background": "rgb(21, 128, 61)",
                "color": "rgb(255, 255, 255)",
            }
            expect(current_step).to_be_hidden()
            assert page.evaluate(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.stepIndex
                """,
            ) == 0
            assert selected_source() == ""

            play_button.click()
            expect(play_button).to_have_attribute("aria-label", "Set playback speed to 2.0x")
            expect(play_button).to_contain_text("2.0x")
            play_button.click()
            expect(play_button).to_have_attribute("aria-label", "Pause playback")
            expect(play_button).to_have_attribute("data-python-diagram-play-mode", "pause")
            expect(play_button).not_to_contain_text("2.0x")
            play_button.click()
            expect(play_button).to_have_attribute("aria-pressed", "false")
            expect(play_button).to_have_attribute("aria-label", "Play at 1.0x")
            expect(play_button).to_contain_text("1.0x")
            expect(current_step).to_be_visible()

            page.locator(".python-diagram-runner__reset").click()
            expect(current_step).to_be_hidden()

            page.locator(".python-diagram-runner__step").click()
            expect(current_step).to_be_visible()
            expect(current_step).to_contain_text(
                "Established Stack, Heap, and Printed Output",
            )
            assert selected_source() == ""
            expect(page.locator(".python-diagram-runner__step-back")).to_be_enabled()

            page.locator(".python-diagram-runner__step-back").click()
            expect(current_step).to_be_hidden()
            expect(page.locator(".python-diagram-runner__step-back")).to_be_disabled()
            assert selected_source() == ""
            assert page.evaluate(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.stepIndex
                """,
            ) == -1

            page.locator(".python-diagram-runner__step").click()
            expect(current_step).to_be_visible()
            expect(current_step).to_contain_text(
                "Established Stack, Heap, and Printed Output",
            )
            assert selected_source() == ""

            page.locator(".python-diagram-runner__step").click()
            expect(current_step).to_contain_text("Ignored comment.")
            assert selected_source() == "# Edit this example, then step through the diagram."

            page.locator(".python-diagram-runner__step").click()
            expect(current_step).to_contain_text(
                "Function definition: bound square to heap ID:0",
            )
            assert selected_source().startswith("def square(value: int) -> int:")

            diagram_output = page.locator(".python-runner__output").first
            page.locator(".python-diagram-runner__run-breakpoint").click()
            expect(diagram_output).to_contain_text("Paused at breakpoint on line 14")
            expect(current_step).to_contain_text("Line 14")
            assert selected_source() == "current"
            page.wait_for_function(
                """
                () => Boolean(document
                  .querySelector("[data-python-diagram-current-step]")
                  .dataset.placement)
                """
            )
            geometry = callout_geometry()
            assert geometry["placement"] in {"above", "below"}
            assert geometry["centerDelta"] < 32
            assert geometry["pointerX"] > 0
            assert geometry["overlapsToolbar"] is False

            page.locator(".python-diagram-runner__step-over").click()
            expect(current_step).to_contain_text("Line 15")

            page.locator(".python-diagram-runner__step-out").click()
            expect(current_step).to_contain_text("Return statement: stored RV 14")

            page.locator(".python-diagram-runner__run").click()
            expect(diagram_output).to_contain_text("Finished diagram trace.")
            expect(current_step).to_contain_text("Program complete.")

            trace_messages = page.evaluate(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.trace
                  .map((step) => step.message)
                """,
            )
            trace_text = "\n".join(trace_messages)
            assert "Ignored docstring." in trace_text
            assert "Name resolution: square -> ID:0 in Globals." in trace_text
            assert "Arithmetic expression: 3 * 3 -> 9." in trace_text
            assert "Comparison expression: 3 > 0 -> True." in trace_text
            assert "While condition evaluated to True (truthy)." in trace_text
            assert "If condition evaluated to False (falsy)." in trace_text
            assert "Else branch: entering block." in trace_text
            assert "If condition evaluated to True (truthy)." in trace_text
            assert "Return statement: stored RV 14" in trace_text
            assert "Printed Output: 23" in trace_text

            updated_binding = page.evaluate(
                """
                () => {
                  const trace = document
                    .querySelector("[data-python-diagram-runner]")
                    .pythonDiagramRunner.trace;
                  for (const step of trace) {
                    for (const frame of step.snapshot.frames) {
                      const binding = frame.bindings.find((item) => (
                        item.name === "current"
                        && item.previousValue === "3"
                        && item.value === "2"
                      ));
                      if (binding) {
                        return binding;
                      }
                    }
                  }
                  return null;
                }
                """
            )
            assert updated_binding == {
                "declaredType": "int",
                "name": "current",
                "previousValue": "3",
                "value": "2",
            }

            diagram_height = page.evaluate(
                """
                () => {
                  const canvas = document.querySelector("[data-python-diagram-canvas]");
                  return canvas.height / (window.devicePixelRatio || 1);
                }
                """
            )
            assert diagram_height > 640

            non_background_pixels = page.evaluate(
                """
                () => {
                  const canvas = document.querySelector("[data-python-diagram-canvas]");
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

            replace_diagram_source(
                'def double(value: int) -> int:\n'
                '    return value * 2\n'
                '\n'
                'print(double("bad"))\n'
            )
            expect(current_step).to_be_hidden()
            expect(diagram_output).to_be_hidden()
            assert page.evaluate(
                """
                () => {
                  const state = document
                    .querySelector("[data-python-diagram-runner]")
                    .pythonDiagramRunner;
                  return state.stepIndex === -1 && state.trace.length > 0 && state.dirty === false;
                }
                """,
            ) is True
            page.locator(".python-diagram-runner__run").click()
            expect(diagram_output).to_contain_text("Function Call Error on Line 4")
            expect(diagram_output).to_have_class(re.compile(r"\bis-error\b"))
            expect(current_step).to_contain_text("Function Call Error on Line 4")
            assert selected_source() == 'double("bad")'

            assert not any("CodeMirror failed" in msg for msg in messages)
            assert not any(msg.startswith("pageerror:") for msg in messages)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()

def test_c_runner_examples_compile_run_and_report_errors() -> None:
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
            page.set_default_timeout(120_000)
            messages: list[str] = []
            page.on("console", lambda msg: messages.append(f"{msg.type}: {msg.text}"))
            page.on("pageerror", lambda exc: messages.append(f"pageerror: {exc}"))

            page.goto(f"{base_url}/c-runner/", wait_until="domcontentloaded")
            page.locator(".cm-editor").first.wait_for(
                state="visible",
                timeout=10_000,
            )

            assert page.locator("[data-c-runner]").count() == 3
            assert page.locator(".cm-editor").count() == 3
            assert page.locator(".python-runner__stdin").count() == 3
            assert page.locator(".python-runner__code:not([hidden])").count() == 0
            expect(page.locator("[data-c-runner]").first).to_have_attribute(
                "data-c-runner-ready",
                "true",
            )

            page.locator(".python-runner__run").nth(0).click()
            first_output = page.locator(".python-runner__output").nth(0)
            expect(first_output).to_contain_text("1 squared is 1", timeout=120_000)
            expect(first_output).to_contain_text("4 squared is 16", timeout=120_000)

            page.locator(".python-runner__stdin").nth(1).fill("Maya 3\n")
            page.locator(".python-runner__run").nth(1).click()
            stdin_output = page.locator(".python-runner__output").nth(1)
            expect(stdin_output).to_contain_text("Maya #1", timeout=120_000)
            expect(stdin_output).to_contain_text("Maya #3", timeout=120_000)
            expect(stdin_output).to_contain_text("processed 3 item(s)", timeout=120_000)

            page.evaluate(
                """
                (source) => {
                  const editor = document
                    .querySelectorAll("[data-c-runner]")[2]
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
                '#include <stdio.h>\n\n'
                'int main(void) {\n'
                '    int total = ;\n'
                '    printf("%d\\n", total);\n'
                '    return 0;\n'
                '}\n',
            )
            page.locator(".python-runner__run").nth(2).click()
            compiler_output = page.locator(".python-runner__output").nth(2)
            expect(compiler_output).to_contain_text("program.c", timeout=120_000)
            expect(compiler_output).to_contain_text("error:", timeout=120_000)
            expect(compiler_output).to_contain_text("expected expression", timeout=120_000)
            expect(compiler_output).to_have_class(re.compile(r"\bis-error\b"))
            expect(page.locator(".python-runner__diagnostic--error").first).to_be_visible()

            assert not any("CodeMirror failed to load" in msg for msg in messages)
            assert not any(msg.startswith("pageerror:") for msg in messages)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


def test_c_terminal_runner_accepts_interactive_stdin_and_reports_errors() -> None:
    subprocess.run(
        [sys.executable, "-m", "zensical", "build"],
        cwd=ROOT,
        check=True,
    )

    server, base_url = serve_site(cross_origin_isolated=True)
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_default_timeout(180_000)
            messages: list[str] = []
            page.on("console", lambda msg: messages.append(f"{msg.type}: {msg.text}"))
            page.on("pageerror", lambda exc: messages.append(f"pageerror: {exc}"))

            page.goto(f"{base_url}/c-terminal-runner/", wait_until="domcontentloaded")
            page.locator(".cm-editor").first.wait_for(
                state="visible",
                timeout=10_000,
            )

            assert page.evaluate("crossOriginIsolated") is True
            assert page.locator("[data-c-terminal-runner]").count() == 2
            assert page.locator(".python-runner__terminal").count() == 2
            assert page.locator(".cm-editor").count() == 2
            assert page.locator(".python-runner__code:not([hidden])").count() == 0
            expect(page.locator("[data-c-terminal-runner]").first).to_have_attribute(
                "data-c-terminal-runner-ready",
                "true",
            )

            page.locator(".python-runner__run").nth(0).click()
            page.locator(".xterm").first.wait_for(state="visible", timeout=120_000)
            wait_for_terminal_text(page, 0, "Name:")

            page.locator(".python-runner__terminal").first.click()
            page.keyboard.type("Maya")
            page.keyboard.press("Enter")
            wait_for_terminal_text(page, 0, "Count:")

            page.keyboard.type("3")
            page.keyboard.press("Enter")
            wait_for_terminal_text(page, 0, "Maya #3")
            wait_for_terminal_text(page, 0, "processed 3 item(s)")
            wait_for_terminal_text(page, 0, "Process exited with code 0.")
            expect(page.locator(".python-runner__output").nth(0)).to_be_hidden()

            page.evaluate(
                """
                (source) => {
                  const editor = document
                    .querySelectorAll("[data-c-terminal-runner]")[1]
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
                '#include <stdio.h>\n\n'
                'int main(void) {\n'
                '    int total = ;\n'
                '    printf("%d\\n", total);\n'
                '    return 0;\n'
                '}\n',
            )
            page.locator(".python-runner__run").nth(1).click()
            compiler_output = page.locator(".python-runner__output").nth(1)
            expect(compiler_output).to_contain_text("program.c", timeout=120_000)
            expect(compiler_output).to_contain_text("error:", timeout=120_000)
            expect(compiler_output).to_contain_text("expected expression", timeout=120_000)
            expect(compiler_output).to_have_class(re.compile(r"\bis-error\b"))
            expect(page.locator(".python-runner__diagnostic--error").first).to_be_visible()

            assert not any("CodeMirror failed to load" in msg for msg in messages)
            assert not any(msg.startswith("pageerror:") for msg in messages)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
