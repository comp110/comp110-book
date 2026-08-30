from __future__ import annotations

import functools
import http.server
import re
import subprocess
import sys
import threading
from pathlib import Path

from markdown import Markdown
from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]


def render_runner_markdown(source: str) -> str:
    if str(ROOT) not in sys.path:
        sys.path.insert(0, str(ROOT))
    from markdown_plugins.pyodide_fence import (
        c_fence_validator,
        format_c_fence,
        format_python_diagram_runner,
        format_python_fence,
        python_fence_validator,
    )

    md = Markdown(
        extensions=["attr_list", "pymdownx.highlight", "pymdownx.superfences"],
        extension_configs={
            "pymdownx.highlight": {
                "anchor_linenums": True,
                "line_spans": "__span",
                "pygments_lang_class": True,
            },
            "pymdownx.superfences": {
                "custom_fences": [
                    {
                        "name": "python",
                        "class": "python",
                        "format": format_python_fence,
                        "validator": python_fence_validator,
                    },
                    {
                        "name": "c",
                        "class": "c",
                        "format": format_c_fence,
                        "validator": c_fence_validator,
                    },
                    {
                        "name": "python_diagram_runner",
                        "class": "python-diagram-runner",
                        "format": format_python_diagram_runner,
                    },
                ],
            },
        },
    )
    return md.convert(source)


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


def test_standard_language_fences_opt_into_runners_with_runnable_parameter() -> None:
    plain_python_html = render_runner_markdown('```python\nprint("plain")\n```')
    assert "data-python-runner" not in plain_python_html
    assert 'class="language-python highlight"' in plain_python_html
    assert 'class="python-runner__run"' not in plain_python_html

    highlighted_python_html = render_runner_markdown(
        '```python { title="Plain Python" hl_lines="1" }\n'
        'print("highlighted")\n'
        '```'
    )
    assert "data-python-runner" not in highlighted_python_html
    assert '<span class="filename">Plain Python</span>' in highlighted_python_html
    assert '<span class="hll">' in highlighted_python_html

    python_runnable_html = render_runner_markdown(
        '```python { runnable=true title="Runnable Python" editable=false highlight="1,2" }\n'
        'print("runner")\n'
        '```'
    )
    assert "data-python-runner" in python_runnable_html
    assert 'data-runner-editable="false"' in python_runnable_html
    assert 'data-runner-highlight-lines="1,2"' in python_runnable_html
    assert '<span class="python-runner__title">Runnable Python</span>' in python_runnable_html

    plain_c_html = render_runner_markdown('```c\nputs("plain");\n```')
    assert "data-c-runner" not in plain_c_html
    assert 'class="language-c highlight"' in plain_c_html

    c_runner_html = render_runner_markdown(
        '```c { runnable=true title="Runnable C" editable=false highlight="1" stdin="Maya 3\\n" }\n'
        '#include <stdio.h>\n'
        'int main(void) { return 0; }\n'
        '```'
    )
    assert "data-c-runner" in c_runner_html
    assert 'data-runner-editable="false"' in c_runner_html
    assert 'data-runner-highlight-lines="1"' in c_runner_html
    assert '<span class="python-runner__title">Runnable C</span>' in c_runner_html
    assert 'Maya 3' in c_runner_html

    static_diagram_html = render_runner_markdown(
        '```python_diagram_runner\nvalue: int = 1\n```'
    )
    assert "data-python-diagram-runner" in static_diagram_html
    assert "Python Memory Diagram" not in static_diagram_html
    assert "python-runner__toolbar" not in static_diagram_html
    assert "python-diagram-runner--titled" not in static_diagram_html
    assert "python-diagram-runner__play-speed" not in static_diagram_html
    assert static_diagram_html.index("python-runner__code") < static_diagram_html.index("python-diagram-runner__controls") < static_diagram_html.index("python-diagram-runner__workspace")
    assert 'data-runner-editable="false"' in static_diagram_html

    editable_diagram_html = render_runner_markdown(
        '```python_diagram_runner { editable=true title="Editable Diagram" }\n'
        'value: int = 1\n'
        '```'
    )
    assert "data-python-diagram-runner" in editable_diagram_html
    assert 'data-runner-editable="false"' not in editable_diagram_html
    assert '<span class="python-runner__title">Editable Diagram</span>' in editable_diagram_html
    assert "python-diagram-runner--titled" in editable_diagram_html
    assert editable_diagram_html.count("Editable Diagram") == 1
    assert editable_diagram_html.index("python-runner__toolbar") < editable_diagram_html.index("python-runner__code") < editable_diagram_html.index("python-diagram-runner__controls") < editable_diagram_html.index("python-diagram-runner__workspace")


def test_runnable_python_examples_are_editable_and_run() -> None:
    subprocess.run(
        [sys.executable, "-m", "zensical", "build"],
        cwd=ROOT,
        check=True,
    )
    about_html = (ROOT / "site" / "about" / "index.html").read_text(encoding="utf-8")
    assert 'src="../javascripts/python-runner-loader.js"' in about_html
    assert 'src="../javascripts/python-runner.js"' not in about_html
    assert 'src="../javascripts/python-diagram-runner.js"' not in about_html
    assert "Copyright (c) 2026 Kris Jordan and Izzi Hinks" in about_html
    assert "Made with" not in about_html

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
            assert first_runner.get_attribute("data-runner-highlight-lines") is None
            expect(first_runner.locator(".python-runner__title")).to_have_text("Tax Calculator")
            expect(readonly_runner).to_have_attribute("data-runner-editable", "false")
            expect(readonly_runner).to_have_attribute("data-runner-highlight-lines", "1,5")
            expect(first_runner.locator(".python-runner__line-highlight")).to_have_count(0)
            expect(readonly_runner.locator(".python-runner__line-highlight")).to_have_count(2)
            expect(readonly_runner.locator(".cm-content")).to_have_attribute("contenteditable", "false")
            first_editor_source = page.evaluate(
                """
                document
                  .querySelector("[data-python-runner]")
                  .pythonRunnerEditor
                  .state
                  .doc
                  .toString()
                """
            )
            assert "# (1)" not in first_editor_source
            assert "# (2)" not in first_editor_source
            assert first_editor_source.startswith("def add_tax(price: float, tax_rate: float) -> float:\n")
            assert "total: float = add_tax(20.00, 0.075)\n" in first_editor_source

            expect(first_runner.locator(".python-runner__annotation-gutter")).to_have_count(1)
            expect(page.locator("[data-python-runner]").nth(1).locator(".python-runner__annotation-gutter")).to_have_count(0)
            annotation_marker = first_runner.locator(".python-runner__annotation-marker")
            expect(annotation_marker).to_have_count(2)
            expect(annotation_marker).to_have_text(["1", "2"])
            first_annotation_marker = annotation_marker.first
            expect(first_annotation_marker).to_have_attribute("data-python-runner-annotations", "1")
            expect(first_annotation_marker).to_have_text("1")
            annotation_heading = page.locator("[data-python-runner] + .python-runner__annotation-heading")
            expect(annotation_heading).to_be_visible()
            expect(annotation_heading).to_have_text("Annotations")
            expect(annotation_heading.locator(".python-runner__annotation-icon")).to_have_count(1)
            assert page.evaluate(
                """
                () => document
                  .querySelector(".python-runner__annotation-heading")
                  .tagName === "DIV"
                """
            )
            annotation_list = page.locator(".python-runner__annotation-heading + .python-runner__annotation-list")
            expect(annotation_list).to_be_visible()
            expect(annotation_list).to_have_attribute("data-python-runner-annotations", "")
            expect(annotation_list.locator("li")).to_have_text([
                "Notice the type of price and tax_rate parameters are float.",
                "The corresponding arguments that add_tax is called with provide values to pass to the function call evaluation.",
            ])
            list_styles = page.evaluate(
                """
                () => {
                  const runner = document.querySelector("[data-python-runner]");
                  const heading = document.querySelector(".python-runner__annotation-heading");
                  const list = document.querySelector(".python-runner__annotation-list");
                  const item = list.querySelector("li");
                  const gutters = runner.querySelector(".cm-gutters");
                  const content = heading.closest(".md-typeset");
                  const bodyStyle = getComputedStyle(content);
                  const headingStyle = getComputedStyle(heading);
                  const listStyle = getComputedStyle(list);
                  const itemStyle = getComputedStyle(item);
                  const headingRect = heading.getBoundingClientRect();
                  const itemRect = item.getBoundingClientRect();
                  const listRect = list.getBoundingClientRect();
                  return {
                    background: listStyle.backgroundColor,
                    bodyFontSize: bodyStyle.fontSize,
                    borderLeftWidth: listStyle.borderLeftWidth,
                    gutterWidth: gutters.getBoundingClientRect().width,
                    headingFontSize: headingStyle.fontSize,
                    headingLeft: headingRect.left,
                    headingMarginLeft: Number.parseFloat(headingStyle.marginLeft),
                    itemBackground: itemStyle.backgroundColor,
                    itemLeft: itemRect.left,
                    itemMarginLeft: itemStyle.marginLeft,
                    listFontSize: listStyle.fontSize,
                    listLeft: listRect.left,
                    listMarginLeft: Number.parseFloat(listStyle.marginLeft),
                    listPaddingLeft: listStyle.paddingLeft,
                    listStylePosition: listStyle.listStylePosition,
                    listStyleType: listStyle.listStyleType,
                  };
                }
                """
            )
            assert list_styles["background"] == "rgba(0, 0, 0, 0)"
            assert list_styles["borderLeftWidth"] == "0px"
            assert abs(list_styles["headingMarginLeft"] - list_styles["gutterWidth"]) < 1
            assert abs(list_styles["listMarginLeft"] - list_styles["gutterWidth"]) < 1
            assert abs(list_styles["listLeft"] - list_styles["headingLeft"]) < 1
            assert abs(list_styles["itemLeft"] - list_styles["headingLeft"]) < 1
            assert list_styles["headingFontSize"] == list_styles["bodyFontSize"]
            assert list_styles["listFontSize"] == list_styles["bodyFontSize"]
            assert list_styles["itemMarginLeft"] == "0px"
            assert list_styles["listPaddingLeft"] == "0px"
            assert list_styles["listStylePosition"] == "inside"
            assert list_styles["listStyleType"] == "decimal"
            assert list_styles["itemBackground"] == "rgba(0, 0, 0, 0)"
            assert not page.locator(".md-nav a", has_text="Annotations").count()
            assert not page.evaluate(
                """
                () => document
                  .querySelector("[data-python-runner] .cm-line")
                  .classList
                  .contains("python-runner__annotation-note-highlight")
                """
            )
            annotation_list.locator("li").first.hover()
            assert page.evaluate(
                """
                () => document
                  .querySelector("[data-python-runner] .cm-line")
                  .classList
                  .contains("python-runner__annotation-note-highlight")
                """
            )
            page.locator(".python-runner__title").first.hover()
            assert not page.evaluate(
                """
                () => document
                  .querySelector("[data-python-runner] .cm-line")
                  .classList
                  .contains("python-runner__annotation-note-highlight")
                """
            )
            marker_styles = page.evaluate(
                """
                () => {
                  const marker = document.querySelector(".python-runner__annotation-marker");
                  const number = marker.querySelector(".python-runner__annotation-marker-number");
                  const markerStyle = getComputedStyle(marker);
                  const markerRect = marker.getBoundingClientRect();
                  const numberRect = number.getBoundingClientRect();
                  return {
                    background: markerStyle.backgroundColor,
                    borderWidth: markerStyle.borderTopWidth,
                    markerCenterY: markerRect.top + markerRect.height / 2,
                    numberCenterY: numberRect.top + numberRect.height / 2,
                  };
                }
                """
            )
            assert marker_styles["background"] != "rgba(0, 0, 0, 0)"
            assert marker_styles["borderWidth"] == "0px"
            assert abs(marker_styles["markerCenterY"] - marker_styles["numberCenterY"]) < 1

            first_annotation_marker.hover()
            popover = page.locator(".python-runner__annotation-popover")
            expect(popover).to_be_visible()
            expect(popover).to_have_attribute("data-placement", "above")
            expect(popover).to_contain_text("Notice the type of price and tax_rate parameters are float.")
            expect(popover.locator(".python-runner__annotation-number")).to_have_text("1")
            annotation_number_background = page.evaluate(
                """
                () => getComputedStyle(
                  document.querySelector(".python-runner__annotation-number"),
                ).backgroundColor
                """
            )
            assert annotation_number_background == "rgb(245, 159, 0)"
            position = page.evaluate(
                """
                () => {
                  const marker = document.querySelector(".python-runner__annotation-marker");
                  const popover = document.querySelector(".python-runner__annotation-popover");
                  const markerRect = marker.getBoundingClientRect();
                  const popoverRect = popover.getBoundingClientRect();
                  return {
                    markerBottom: markerRect.bottom,
                    markerTop: markerRect.top,
                    placement: popover.dataset.placement,
                    popoverBottom: popoverRect.bottom,
                    popoverTop: popoverRect.top,
                  };
                }
                """
            )
            assert position["placement"] == "above"
            assert position["popoverBottom"] <= position["markerTop"]

            page.evaluate(
                """
                () => {
                  const marker = document.querySelector(".python-runner__annotation-marker");
                  const markerTop = marker.getBoundingClientRect().top + window.scrollY;
                  window.scrollTo(0, Math.max(0, markerTop - 58));
                }
                """
            )
            first_annotation_marker.hover()
            expect(popover).to_have_attribute("data-placement", "below")
            below_position = page.evaluate(
                """
                () => {
                  const marker = document.querySelector(".python-runner__annotation-marker");
                  const popover = document.querySelector(".python-runner__annotation-popover");
                  const markerRect = marker.getBoundingClientRect();
                  const popoverRect = popover.getBoundingClientRect();
                  return {
                    markerBottom: markerRect.bottom,
                    markerTop: markerRect.top,
                    placement: popover.dataset.placement,
                    popoverBottom: popoverRect.bottom,
                    popoverTop: popoverRect.top,
                  };
                }
                """
            )
            assert below_position["placement"] == "below"
            assert below_position["popoverTop"] >= below_position["markerBottom"]

            page.locator(".python-runner__title").first.hover()

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
            page.keyboard.press("Meta+A" if sys.platform == "darwin" else "Control+A")
            page.keyboard.type('print("edited in codemirror")')
            page.keyboard.press("Tab")
            assert page.evaluate(
                """
                () => {
                  const editor = document
                    .querySelector("[data-python-runner]")
                    .pythonRunnerEditor;
                  return {
                    focused: editor.hasFocus,
                    value: editor.state.doc.toString(),
                  };
                }
                """,
            ) == {"focused": True, "value": '    print("edited in codemirror")'}
            page.keyboard.press("Shift+Tab")

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
            expect(first_runner.locator(".python-runner__annotation-marker")).to_have_count(0)
            expect(page.locator(".python-runner__annotation-popover")).to_have_count(0)
            expect(annotation_list).to_be_visible()

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
            frame_hot_path = page.evaluate(
                """
                () => {
                  const widget = document.querySelector("[data-python-runner]");
                  const originalQuerySelectorAll = document.querySelectorAll;
                  let runnerLookups = 0;
                  document.querySelectorAll = function (selector) {
                    if (selector === "[data-python-runner-id]") {
                      runnerLookups += 1;
                    }
                    return originalQuerySelectorAll.call(this, selector);
                  };

                  const result = widget.pythonRunnerGameRuntime.stepGame(
                    widget.dataset.pythonRunnerId,
                    1 / 60,
                  );
                  const usedFastResult = result == null;
                  if (result && typeof result.destroy === "function") {
                    result.destroy();
                  }
                  document.querySelectorAll = originalQuerySelectorAll;
                  return { runnerLookups, usedFastResult };
                }
                """
            )
            assert frame_hot_path == {"runnerLookups": 0, "usedFastResult": True}

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
            diagram_runner = page.locator("[data-python-diagram-runner]").first
            assert diagram_runner.get_attribute("data-runner-editable") is None
            expect(diagram_runner.locator(".python-runner__toolbar")).to_have_count(0)
            expect(diagram_runner.locator(".python-runner__title")).to_have_count(0)
            assert "python-diagram-runner--titled" not in (diagram_runner.get_attribute("class") or "")
            normal_layout = diagram_runner.evaluate(
                """
                (element) => {
                  const editor = element.querySelector(".python-diagram-runner__editor");
                  const controls = element.querySelector(".python-diagram-runner__controls");
                  const workspace = element.querySelector(".python-diagram-runner__workspace");
                  const editorRect = editor.getBoundingClientRect();
                  const controlsRect = controls.getBoundingClientRect();
                  const workspaceRect = workspace.getBoundingClientRect();
                  return {
                    controlsBottom: controlsRect.bottom,
                    controlsJustify: getComputedStyle(controls).justifyContent,
                    controlsTop: controlsRect.top,
                    editorBottom: editorRect.bottom,
                    workspaceTop: workspaceRect.top,
                  };
                }
                """,
            )
            assert normal_layout["controlsJustify"] == "flex-start"
            assert abs(normal_layout["editorBottom"] - normal_layout["controlsTop"]) <= 1
            assert abs(normal_layout["controlsBottom"] - normal_layout["workspaceTop"]) <= 1
            expect(diagram_runner.locator(".cm-content")).to_have_attribute(
                "contenteditable",
                "true",
            )

            page.evaluate(
                """
                () => {
                  const widget = document.querySelector("[data-python-diagram-runner]");
                  const clone = widget.cloneNode(true);
                  clone.id = "static-python-diagram-test";
                  clone.removeAttribute("data-python-diagram-runner-ready");
                  clone.setAttribute("data-runner-editable", "false");
                  clone.querySelector(".python-diagram-runner__editor").remove();
                  clone.querySelector(".python-runner__code").hidden = false;
                  clone.querySelector(".python-runner__code code").textContent = "value: int = 1";
                  document.body.append(clone);
                  document.dispatchEvent(new Event("DOMContentLoaded"));
                }
                """,
            )
            static_diagram = page.locator("#static-python-diagram-test")
            static_diagram.locator(".cm-editor").wait_for(state="visible", timeout=60_000)
            expect(static_diagram.locator(".cm-content")).to_have_attribute(
                "contenteditable",
                "true",
            )
            expect(static_diagram.locator(".cm-content")).to_have_attribute(
                "aria-readonly",
                "true",
            )
            expect(static_diagram.locator(".cm-lineNumbers")).to_have_count(1)
            assert static_diagram.locator(".cm-content .cm-line span").count() > 0
            short_editor_layout = static_diagram.evaluate(
                """
                (element) => {
                  const editor = element.querySelector(".cm-editor");
                  const content = element.querySelector(".cm-content");
                  const lines = Array.from(element.querySelectorAll(".cm-line"));
                  const controls = element.querySelector(".python-diagram-runner__controls");
                  const editorRect = editor.getBoundingClientRect();
                  const lastLineRect = lines[lines.length - 1].getBoundingClientRect();
                  return {
                    contentMinHeight: Number.parseFloat(getComputedStyle(content).minHeight),
                    controlsGap: controls.getBoundingClientRect().top - lastLineRect.bottom,
                    editorHeight: editorRect.height,
                    editorMinHeight: Number.parseFloat(getComputedStyle(editor).minHeight),
                    lineCount: lines.length,
                  };
                }
                """,
            )
            assert short_editor_layout["lineCount"] == 1
            assert short_editor_layout["contentMinHeight"] <= 80
            assert short_editor_layout["editorMinHeight"] <= 80
            assert short_editor_layout["editorHeight"] <= 90
            assert short_editor_layout["controlsGap"] <= 50
            static_source = page.evaluate(
                """
                () => document
                  .querySelector("#static-python-diagram-test")
                  .pythonDiagramRunner.source.value
                """,
            )
            static_text = page.evaluate(
                """
                () => {
                  const widget = document.querySelector("#static-python-diagram-test");
                  widget.querySelector(".cm-content").focus();
                  document.execCommand("insertText", false, "this should not be inserted");
                  return widget.pythonDiagramRunner.source.value;
                }
                """,
            )
            assert static_text == static_source
            page.evaluate("document.querySelector('#static-python-diagram-test').remove()")

            original_source = page.evaluate(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.source.value
                """,
            )
            editor_content = page.locator(".python-diagram-runner__editor .cm-content")
            editor_content.click()
            page.keyboard.press("Control+A")
            page.keyboard.type("abc")
            assert page.evaluate(
                """
                () => {
                  const source = document
                    .querySelector("[data-python-diagram-runner]")
                    .pythonDiagramRunner.source;
                  return {
                    selection: source.view.state.selection.main.anchor,
                    value: source.value,
                  };
                }
                """,
            ) == {"selection": 3, "value": "abc"}
            page.keyboard.press("Tab")
            assert page.evaluate(
                """
                () => {
                  const source = document
                    .querySelector("[data-python-diagram-runner]")
                    .pythonDiagramRunner.source;
                  return {
                    focused: source.view.hasFocus,
                    selection: source.view.state.selection.main.anchor,
                    value: source.value,
                  };
                }
                """,
            ) == {"focused": True, "selection": 7, "value": "    abc"}
            page.keyboard.press("Shift+Tab")
            assert page.evaluate(
                """
                () => {
                  const source = document
                    .querySelector("[data-python-diagram-runner]")
                    .pythonDiagramRunner.source;
                  return {
                    selection: source.view.state.selection.main.anchor,
                    value: source.value,
                  };
                }
                """,
            ) == {"selection": 3, "value": "abc"}
            page.evaluate(
                """
                (source) => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.source.setValue(source)
                """,
                original_source,
            )
            page.locator(".python-diagram-runner__reset").click()
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
                {"label": "Play", "pressed": "false", "title": "Play", "text": ""},
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
                  const controls = widget.querySelector(".python-diagram-runner__controls");
                  const workspace = widget.querySelector(".python-diagram-runner__workspace");
                  const button = widget.querySelector(".python-diagram-runner__fullscreen");
                  const editorRect = editor.getBoundingClientRect();
                  const controlsRect = controls.getBoundingClientRect();
                  const workspaceRect = workspace.getBoundingClientRect();
                  const widgetRect = widget.getBoundingClientRect();
                  return {
                    bodyLocked: document.body.classList.contains("python-diagram-runner-fullscreen-open"),
                    buttonLabel: button.getAttribute("aria-label"),
                    buttonPressed: button.getAttribute("aria-pressed"),
                    controlsBottom: controlsRect.bottom,
                    controlsWidth: controlsRect.width,
                    editorLeft: editorRect.left,
                    editorRight: editorRect.right,
                    editorTop: editorRect.top,
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
            assert abs(fullscreen_layout["controlsWidth"] - fullscreen_layout["widgetWidth"]) <= 1
            assert abs(fullscreen_layout["controlsBottom"] - fullscreen_layout["editorTop"]) <= 1
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
                      const controls = widget.querySelector(".python-diagram-runner__controls");
                      const source = widget.pythonDiagramRunner.source;
                      const selection = source.view.state.selection.main;
                      const start = source.view.coordsAtPos(selection.from, 1);
                      const end = source.view.coordsAtPos(selection.to, -1) || start;
                      const calloutRect = callout.getBoundingClientRect();
                      const controlsRect = controls.getBoundingClientRect();
                      const anchorCenter = (Math.min(start.left, end.left) + Math.max(start.right || start.left, end.right || end.left)) / 2;
                      const calloutCenter = calloutRect.left + calloutRect.width / 2;
                      return {
                        centerDelta: Math.abs(calloutCenter - anchorCenter),
                        overlapsControls: !(calloutRect.right < controlsRect.left || calloutRect.left > controlsRect.right || calloutRect.bottom < controlsRect.top || calloutRect.top > controlsRect.bottom),
                        placement: callout.dataset.placement || "",
                        pointerX: parseFloat(getComputedStyle(callout).getPropertyValue("--python-diagram-callout-pointer-x")),
                      };
                    }
                    """
                )

            def diagram_status_pixel() -> list[int]:
                return page.evaluate(
                    """
                    () => {
                      const canvas = document.querySelector("[data-python-diagram-canvas]");
                      const scale = canvas.width / 1080;
                      return Array.from(canvas.getContext("2d").getImageData(
                        Math.round(456 * scale),
                        Math.round(30 * scale),
                        1,
                        1,
                      ).data);
                    }
                    """,
                )

            assert diagram_status_pixel() == [248, 250, 252, 255]

            play_button = page.locator(".python-diagram-runner__play")
            expect(play_button).to_be_enabled()
            expect(play_button).to_have_text("")
            play_button_metrics = page.evaluate(
                """
                () => {
                  const button = document.querySelector(".python-diagram-runner__play");
                  const icon = button.querySelector(".python-diagram-runner__control-icon");
                  return {
                    buttonWidth: button.getBoundingClientRect().width,
                    iconWidth: icon.getBoundingClientRect().width,
                    speedCount: button.querySelectorAll(".python-diagram-runner__play-speed").length,
                  };
                }
                """,
            )
            assert play_button_metrics["buttonWidth"] >= 32
            assert play_button_metrics["iconWidth"] >= 18
            assert play_button_metrics["speedCount"] == 0

            play_button.click()
            expect(play_button).to_have_attribute("aria-pressed", "true")
            expect(play_button).to_have_attribute("aria-label", "Pause")
            expect(play_button).to_have_attribute("title", "Pause")
            expect(play_button).to_have_attribute("data-python-diagram-play-mode", "pause")
            expect(play_button).to_have_text("")
            assert diagram_status_pixel() == [224, 242, 254, 255]
            assert page.evaluate(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.source.view.hasFocus
                """,
            ) is True
            page.wait_for_function(
                """
                () => document
                  .querySelector("[data-python-diagram-runner]")
                  .pythonDiagramRunner.stepIndex >= 1
                """,
            )
            assert page.evaluate(
                """
                () => {
                  const source = document
                    .querySelector("[data-python-diagram-runner]")
                    .pythonDiagramRunner.source;
                  const selection = source.view.state.selection.main;
                  return source.view.hasFocus && selection.to > selection.from;
                }
                """,
            ) is True
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
            ) >= 1
            assert selected_source() != ""

            play_button.click()
            expect(play_button).to_have_attribute("aria-pressed", "false")
            expect(play_button).to_have_attribute("aria-label", "Play")
            expect(play_button).to_have_attribute("title", "Play")
            expect(play_button).to_have_attribute("data-python-diagram-play-mode", "play")
            expect(play_button).to_have_text("")
            expect(current_step).to_be_visible()
            assert diagram_status_pixel() == [248, 250, 252, 255]

            page.locator(".python-diagram-runner__reset").click()
            expect(current_step).to_be_hidden()

            page.locator(".python-diagram-runner__step").click()
            expect(current_step).to_be_visible()
            assert diagram_status_pixel() == [248, 250, 252, 255]
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
            assert geometry["overlapsControls"] is False
            callout_colors = page.evaluate(
                """
                () => {
                  const callout = document.querySelector("[data-python-diagram-current-step]");
                  const pointer = getComputedStyle(callout, "::after");
                  return {
                    background: getComputedStyle(callout).backgroundColor,
                    pointer: callout.dataset.placement === "above"
                      ? pointer.borderTopColor
                      : pointer.borderBottomColor,
                  };
                }
                """,
            )
            assert callout_colors == {
                "background": "rgb(255, 248, 197)",
                "pointer": "rgb(255, 248, 197)",
            }

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

            final_memory = page.evaluate(
                """
                () => {
                  const trace = document
                    .querySelector("[data-python-diagram-runner]")
                    .pythonDiagramRunner.trace;
                  const snapshot = trace[trace.length - 1].snapshot;
                  return {
                    current: snapshot.frames
                      .flatMap((frame) => frame.bindings)
                      .find((binding) => binding.name === "current"),
                    heap: snapshot.heap,
                  };
                }
                """
            )
            assert final_memory == {
                "current": {
                    "declaredType": "int",
                    "name": "current",
                    "previousValues": ["3", "2", "1"],
                    "value": "0",
                },
                "heap": [
                    {"id": 0, "label": "Fn Lines 3 - 5"},
                    {"id": 1, "label": "Fn Lines 7 - 8"},
                    {"id": 2, "label": "Fn Lines 10 - 20"},
                ],
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
                'def grow(value: float) -> float:\n'
                '    value = value\n'
                '    value = value + 1.0\n'
                '    value = value + 1.0\n'
                '    value = value + 1.0\n'
                '    value = value + 1.0\n'
                '    return value\n'
                '\n'
                'result: float = grow(1.0)\n'
                'print(result)\n'
            )
            page.evaluate(
                """
                () => {
                  const canvas = document.querySelector("[data-python-diagram-canvas]");
                  const context = canvas.getContext("2d");
                  const original = {
                    beginPath: context.beginPath.bind(context),
                    fillText: context.fillText.bind(context),
                    lineTo: context.lineTo.bind(context),
                    moveTo: context.moveTo.bind(context),
                  };
                  const log = { lines: [], texts: [] };
                  let point = null;
                  window.__pythonDiagramDrawLog = log;
                  context.beginPath = (...args) => {
                    point = null;
                    return original.beginPath(...args);
                  };
                  context.moveTo = (x, y) => {
                    point = { x, y };
                    return original.moveTo(x, y);
                  };
                  context.lineTo = (x, y) => {
                    if (point) {
                      log.lines.push({
                        color: String(context.strokeStyle),
                        fromX: point.x,
                        fromY: point.y,
                        toX: x,
                        toY: y,
                      });
                    }
                    point = { x, y };
                    return original.lineTo(x, y);
                  };
                  context.fillText = (...args) => {
                    const [value, x, y] = args;
                    log.texts.push({
                      color: String(context.fillStyle),
                      text: String(value),
                      x,
                      y,
                    });
                    return original.fillText(...args);
                  };
                  window.__restorePythonDiagramCanvas = () => {
                    context.beginPath = original.beginPath;
                    context.fillText = original.fillText;
                    context.lineTo = original.lineTo;
                    context.moveTo = original.moveTo;
                  };
                }
                """,
            )
            page.locator(".python-diagram-runner__run").click()
            expect(diagram_output).to_contain_text("Finished diagram trace.")
            float_diagram = page.evaluate(
                """
                () => {
                  const state = document
                    .querySelector("[data-python-diagram-runner]")
                    .pythonDiagramRunner;
                  const snapshot = state.trace[state.trace.length - 1].snapshot;
                  const growFrame = snapshot.frames.find((frame) => frame.name === "grow");
                  const result = {
                    binding: growFrame.bindings.find((binding) => binding.name === "value"),
                    drawLog: window.__pythonDiagramDrawLog,
                    heap: snapshot.heap,
                  };
                  window.__restorePythonDiagramCanvas();
                  return result;
                }
                """,
            )
            assert float_diagram["binding"] == {
                "declaredType": "float",
                "name": "value",
                "previousValues": ["1.0", "1.0", "2.0", "3.0", "4.0"],
                "value": "5.0",
            }
            assert float_diagram["heap"] == [
                {"id": 0, "label": "Fn Lines 1 - 7"},
            ]
            heap_text = [
                entry["text"]
                for entry in float_diagram["drawLog"]["texts"]
                if 470 <= entry["x"] < 740
            ]
            assert "Fn Lines 1 - 7" in heap_text
            assert not any("grow -" in text for text in heap_text)
            stack_text = [
                entry["text"]
                for entry in float_diagram["drawLog"]["texts"]
                if entry["x"] < 444
            ]
            assert "value" in stack_text
            assert "value: float" not in stack_text
            value_label_y = next(
                entry["y"]
                for entry in float_diagram["drawLog"]["texts"]
                if entry["text"] == "value"
            )
            local_value_text = [
                entry
                for entry in float_diagram["drawLog"]["texts"]
                if 250 <= entry["x"] < 444
                and entry["y"] >= value_label_y
                and entry["text"] in {"1.0", "2.0", "3.0", "4.0", "5.0"}
            ]
            assert [entry["text"] for entry in local_value_text] == [
                "1.0",
                "1.0",
                "2.0",
                "3.0",
                "4.0",
                "5.0",
            ]
            assert len({entry["y"] for entry in local_value_text}) >= 2
            strike_lines = [
                line
                for line in float_diagram["drawLog"]["lines"]
                if line["color"] == "#64748b"
                and 250 <= line["fromX"] < 444
                and line["fromY"] == line["toY"]
            ]
            assert len(strike_lines) >= 5

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
                  return state.stepIndex === -1 && state.trace.length === 0 && state.dirty === true;
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

def test_python_diagram_runner_supports_keyword_arguments_and_none_results() -> None:
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
            page.set_default_timeout(120_000)
            messages: list[str] = []
            page.on("console", lambda msg: messages.append(f"{msg.type}: {msg.text}"))
            page.on("pageerror", lambda exc: messages.append(f"pageerror: {exc}"))

            page.goto(f"{base_url}/function_fundamentals/", wait_until="domcontentloaded")
            diagram_widgets = page.locator("[data-python-diagram-runner]")
            diagram_count = diagram_widgets.count()
            assert diagram_count > 0
            narrated_diagrams = diagram_widgets.evaluate_all(
                """
                (elements) => elements.filter((element) => {
                  const narrative = element.previousElementSibling;
                  return narrative
                    && narrative.tagName === "P"
                    && narrative.textContent.trim().length > 0;
                }).length
                """,
            )
            assert narrated_diagrams == diagram_count
            runner = page.locator(
                "#function-definitions-are-reusable + p + [data-python-diagram-runner]",
            )
            runner.locator(".cm-editor").wait_for(state="visible", timeout=60_000)
            expect(runner).to_have_attribute("data-runner-editable", "false")
            expect(runner.locator(".cm-content")).to_have_attribute("contenteditable", "true")
            expect(runner.locator(".cm-content")).to_have_attribute("aria-readonly", "true")
            expect(runner.locator(".cm-lineNumbers")).to_have_count(1)

            play_button = runner.locator(".python-diagram-runner__play")
            play_button.click()
            expect(play_button).to_have_attribute("aria-label", "Pause")
            runner_handle = runner.element_handle()
            assert runner_handle is not None
            page.wait_for_function(
                """
                (element) => {
                  const state = element.pythonDiagramRunner;
                  const selection = state.source.view.state.selection.main;
                  return state.stepIndex >= 1
                    && state.source.view.hasFocus
                    && selection.to > selection.from
                    && element.querySelectorAll(".cm-selectionBackground").length > 0;
                }
                """,
                arg=runner_handle,
            )
            readonly_playback = runner.evaluate(
                """
                (element) => {
                  const state = element.pythonDiagramRunner;
                  const content = state.source.view.contentDOM;
                  const selection = state.source.view.state.selection.main;
                  const backgrounds = Array.from(
                    element.querySelectorAll(".cm-selectionBackground"),
                  );
                  return {
                    activeWithinEditor: element
                      .querySelector(".cm-editor")
                      .contains(document.activeElement),
                    ariaReadonly: content.getAttribute("aria-readonly"),
                    contentEditable: content.getAttribute("contenteditable"),
                    hasFocus: state.source.view.hasFocus,
                    selected: state.source.value.slice(selection.from, selection.to),
                    selectionBackgrounds: backgrounds.length,
                    selectionWidth: Math.max(
                      0,
                      ...backgrounds.map((node) => node.getBoundingClientRect().width),
                    ),
                    selectionColor: backgrounds.length
                      ? getComputedStyle(backgrounds[0]).backgroundColor
                      : "",
                  };
                }
                """,
            )
            assert readonly_playback["activeWithinEditor"] is True
            assert readonly_playback["ariaReadonly"] == "true"
            assert readonly_playback["contentEditable"] == "true"
            assert readonly_playback["hasFocus"] is True
            assert readonly_playback["selected"]
            assert readonly_playback["selectionBackgrounds"] > 0
            assert readonly_playback["selectionWidth"] > 0
            assert readonly_playback["selectionColor"] != "rgba(0, 0, 0, 0)"
            play_button.click()
            expect(play_button).to_have_attribute("aria-label", "Play")
            runner.locator(".python-diagram-runner__reset").click()

            runner.locator(".python-diagram-runner__run").click()
            diagram_output = runner.locator(".python-runner__output")
            expect(diagram_output).to_contain_text("Finished diagram trace.")

            quiz_result = runner.evaluate(
                """
                (element) => {
                  const state = element.pythonDiagramRunner;
                  const snapshot = state.trace[state.trace.length - 1].snapshot;
                  return {
                    output: snapshot.output,
                    calls: snapshot.frames
                      .filter((frame) => frame.name === "perimeter")
                      .map((frame) => ({
                        bindings: frame.bindings,
                        returnValue: frame.returnValue,
                      })),
                  };
                }
                """,
            )
            assert quiz_result == {
                "output": ["6.0", "14.0"],
                "calls": [
                    {
                        "bindings": [
                            {
                                "declaredType": "float",
                                "name": "length",
                                "previousValues": [],
                                "value": "1.0",
                            },
                            {
                                "declaredType": "float",
                                "name": "width",
                                "previousValues": [],
                                "value": "2.0",
                            },
                        ],
                        "returnValue": "6.0",
                    },
                    {
                        "bindings": [
                            {
                                "declaredType": "float",
                                "name": "length",
                                "previousValues": [],
                                "value": "3.0",
                            },
                            {
                                "declaredType": "float",
                                "name": "width",
                                "previousValues": [],
                                "value": "4.0",
                            },
                        ],
                        "returnValue": "14.0",
                    },
                ],
            }

            runner.evaluate(
                """
                (element, source) => element.pythonDiagramRunner.source.setValue(source)
                """,
                "def subtract(left: int, right: int) -> int:\n"
                "    return left - right\n"
                "\n"
                "print(subtract(right=2, left=7))\n"
                "print(subtract(10, right=3))\n",
            )
            runner.locator(".python-diagram-runner__run").click()
            expect(diagram_output).to_contain_text("Finished diagram trace.")
            reordered_result = runner.evaluate(
                """
                (element) => {
                  const state = element.pythonDiagramRunner;
                  const snapshot = state.trace[state.trace.length - 1].snapshot;
                  return {
                    output: snapshot.output,
                    calls: snapshot.frames
                      .filter((frame) => frame.name === "subtract")
                      .map((frame) => frame.bindings.map((binding) => ({
                        name: binding.name,
                        value: binding.value,
                      }))),
                  };
                }
                """,
            )
            assert reordered_result == {
                "output": ["5", "7"],
                "calls": [
                    [{"name": "left", "value": "7"}, {"name": "right", "value": "2"}],
                    [{"name": "left", "value": "10"}, {"name": "right", "value": "3"}],
                ],
            }

            explicit_none_runner = page.locator(
                "#procedures-return-none + p + [data-python-diagram-runner]",
            )
            expect(explicit_none_runner).to_have_count(1)
            explicit_none_runner.locator(".cm-editor").wait_for(
                state="visible",
                timeout=60_000,
            )
            assert explicit_none_runner.evaluate(
                "(element) => element.pythonDiagramRunner.buildError",
            ) is None
            explicit_none_runner.locator(".python-diagram-runner__run").click()
            explicit_none_output = explicit_none_runner.locator(".python-runner__output")
            expect(explicit_none_output).to_contain_text("Finished diagram trace.")
            explicit_none_result = explicit_none_runner.evaluate(
                """
                (element) => {
                  const state = element.pythonDiagramRunner;
                  const snapshot = state.trace[state.trace.length - 1].snapshot;
                  const frame = snapshot.frames.find(
                    (candidate) => candidate.name === "show_perimeter",
                  );
                  return {
                    explicitReturn: state.trace.some(
                      (step) => step.message.includes("Return statement: stored RV None"),
                    ),
                    implicitReturn: state.trace.some(
                      (step) => step.message.includes(
                        "Function show_perimeter finished without an explicit return",
                      ),
                    ),
                    output: snapshot.output,
                    returnValue: frame ? frame.returnValue : null,
                  };
                }
                """,
            )
            assert explicit_none_result == {
                "explicitReturn": True,
                "implicitReturn": False,
                "output": ["6.0"],
                "returnValue": "None",
            }

            runner.evaluate(
                """
                (element, source) => element.pythonDiagramRunner.source.setValue(source)
                """,
                "printed: None = print(\"hello\")\n"
                "print(printed)\n",
            )
            runner.locator(".python-diagram-runner__run").click()
            expect(diagram_output).to_contain_text("Finished diagram trace.")
            print_none_result = runner.evaluate(
                """
                (element) => {
                  const state = element.pythonDiagramRunner;
                  const snapshot = state.trace[state.trace.length - 1].snapshot;
                  const binding = snapshot.frames[0].bindings.find(
                    (candidate) => candidate.name === "printed",
                  );
                  return {
                    assignedNone: state.trace.some(
                      (step) => step.message.includes("Assigned printed = None"),
                    ),
                    binding,
                    output: snapshot.output,
                  };
                }
                """,
            )
            assert print_none_result == {
                "assignedNone": True,
                "binding": {
                    "declaredType": "None",
                    "name": "printed",
                    "previousValues": [],
                    "value": "None",
                },
                "output": ["hello", "None"],
            }

            assert not any("Unsupported expression token: =" in msg for msg in messages)
            assert not any(msg.startswith("pageerror:") for msg in messages)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


def test_python_diagram_runner_supports_type_constructors() -> None:
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
            page.set_default_timeout(120_000)
            messages: list[str] = []
            page.on("console", lambda msg: messages.append(f"{msg.type}: {msg.text}"))
            page.on("pageerror", lambda exc: messages.append(f"pageerror: {exc}"))

            page.goto(f"{base_url}/python-diagram/", wait_until="domcontentloaded")
            runner = page.locator("[data-python-diagram-runner]").first
            runner.locator(".cm-editor").wait_for(state="visible", timeout=60_000)
            runner.evaluate(
                """
                (element, source) => element.pythonDiagramRunner.source.setValue(source)
                """,
                "converted_int: int = int(\"42\")\n"
                "truncated: int = int(-3.9)\n"
                "converted_float: float = float(\"6\")\n"
                "converted_str: str = str(3.0)\n"
                "false_value: bool = bool(\"\")\n"
                "true_value: bool = bool(\"False\")\n"
                "default_int: int = int()\n"
                "default_float: float = float()\n"
                "default_str: str = str()\n"
                "default_bool: bool = bool()\n"
                "nested: int = int(float(\"4.9\"))\n"
                "none_label: str = str(None)\n"
                "none_truth: bool = bool(None)\n"
                "print(converted_int)\n"
                "print(truncated)\n"
                "print(converted_float)\n"
                "print(converted_str)\n"
                "print(false_value)\n"
                "print(true_value)\n"
                "print(nested)\n",
            )
            runner.locator(".python-diagram-runner__run").click()
            output = runner.locator(".python-runner__output")
            expect(output).to_contain_text("Finished diagram trace.")

            result = runner.evaluate(
                """
                (element) => {
                  const state = element.pythonDiagramRunner;
                  const snapshot = state.trace[state.trace.length - 1].snapshot;
                  return {
                    bindings: snapshot.frames[0].bindings.map((binding) => ({
                      declaredType: binding.declaredType,
                      name: binding.name,
                      value: binding.value,
                    })),
                    constructors: state.trace
                      .map((step) => step.message)
                      .filter((message) => message.startsWith("Type constructor:")),
                    output: snapshot.output,
                  };
                }
                """,
            )
            assert result == {
                "bindings": [
                    {"declaredType": "int", "name": "converted_int", "value": "42"},
                    {"declaredType": "int", "name": "truncated", "value": "-3"},
                    {"declaredType": "float", "name": "converted_float", "value": "6.0"},
                    {"declaredType": "str", "name": "converted_str", "value": "\"3.0\""},
                    {"declaredType": "bool", "name": "false_value", "value": "False"},
                    {"declaredType": "bool", "name": "true_value", "value": "True"},
                    {"declaredType": "int", "name": "default_int", "value": "0"},
                    {"declaredType": "float", "name": "default_float", "value": "0.0"},
                    {"declaredType": "str", "name": "default_str", "value": "\"\""},
                    {"declaredType": "bool", "name": "default_bool", "value": "False"},
                    {"declaredType": "int", "name": "nested", "value": "4"},
                    {"declaredType": "str", "name": "none_label", "value": "\"None\""},
                    {"declaredType": "bool", "name": "none_truth", "value": "False"},
                ],
                "constructors": [
                    "Type constructor: int(\"42\") -> 42.",
                    "Type constructor: int(-3.9) -> -3.",
                    "Type constructor: float(\"6\") -> 6.0.",
                    "Type constructor: str(3.0) -> \"3.0\".",
                    "Type constructor: bool(\"\") -> False.",
                    "Type constructor: bool(\"False\") -> True.",
                    "Type constructor: int() -> 0.",
                    "Type constructor: float() -> 0.0.",
                    "Type constructor: str() -> \"\".",
                    "Type constructor: bool() -> False.",
                    "Type constructor: float(\"4.9\") -> 4.9.",
                    "Type constructor: int(4.9) -> 4.",
                    "Type constructor: str(None) -> \"None\".",
                    "Type constructor: bool(None) -> False.",
                ],
                "output": ["42", "-3", "6.0", "3.0", "False", "True", "4"],
            }

            runner.evaluate(
                """
                (element, source) => element.pythonDiagramRunner.source.setValue(source)
                """,
                "value: int = int(\"3.5\")\n",
            )
            runner.locator(".python-diagram-runner__run").click()
            expect(output).to_have_class(re.compile(r"\bis-error\b"))
            expect(output).to_have_text(
                "ValueError on Line 1: invalid literal for int(): \"3.5\".",
            )

            assert not any(msg.startswith("pageerror:") for msg in messages)
            browser.close()
    finally:
        server.shutdown()
        server.server_close()


def test_python_diagram_runner_delays_common_errors_and_reports_return_types() -> None:
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
            page.set_default_timeout(120_000)
            messages: list[str] = []
            page.on("console", lambda msg: messages.append(f"{msg.type}: {msg.text}"))
            page.on("pageerror", lambda exc: messages.append(f"pageerror: {exc}"))

            page.goto(f"{base_url}/function_fundamentals/", wait_until="domcontentloaded")
            error_heading_ids = [
                "missing-return-keyword",
                "disagreement-in-return-type",
                "disagreement-in-argument-count",
                "disagreement-in-argument-names",
                "disagreement-in-argument-types",
            ]

            def error_runner(heading_id: str):
                return page.locator(f"#{heading_id} + p + [data-python-diagram-runner]")

            for heading_id in error_heading_ids:
                runner = error_runner(heading_id)
                expect(runner).to_have_count(1)
                runner.locator(".cm-editor").wait_for(state="visible", timeout=60_000)
                output = runner.locator(".python-runner__output")
                expect(output).to_be_hidden()
                assert "is-error" not in (output.get_attribute("class") or "")
                initial_state = runner.evaluate(
                    """
                    (element) => {
                      const state = element.pythonDiagramRunner;
                      const last = state.trace[state.trace.length - 1];
                      return {
                        lastFailed: last.failed,
                        stepIndex: state.stepIndex,
                        traceLength: state.trace.length,
                      };
                    }
                    """,
                )
                assert initial_state["lastFailed"] is True
                assert initial_state["stepIndex"] == -1
                assert initial_state["traceLength"] > 1

            def step_to_failure(heading_id: str, expected_message: str) -> dict[str, str | None]:
                runner = error_runner(heading_id)
                output = runner.locator(".python-runner__output")
                current_step = runner.locator("[data-python-diagram-current-step]")
                trace_length = runner.evaluate(
                    "(element) => element.pythonDiagramRunner.trace.length",
                )
                for _ in range(trace_length - 1):
                    runner.locator(".python-diagram-runner__step-into").click()
                    expect(output).to_be_hidden()
                    assert "is-error" not in (output.get_attribute("class") or "")
                assert runner.evaluate(
                    "(element) => element.pythonDiagramRunner.stepIndex",
                ) == trace_length - 2

                runner.locator(".python-diagram-runner__step-into").click()
                expect(output).to_be_visible()
                expect(output).to_have_class(re.compile(r"\bis-error\b"))
                expect(output).to_have_text(expected_message)
                expect(current_step).to_contain_text(expected_message)
                return runner.evaluate(
                    """
                    (element) => {
                      const state = element.pythonDiagramRunner;
                      const source = state.source;
                      const selection = source.view.state.selection.main;
                      const snapshot = state.trace[state.trace.length - 1].snapshot;
                      const frame = snapshot.frames.find((candidate) => candidate.name === "perimeter");
                      return {
                        returnValue: frame ? frame.returnValue : null,
                        selected: source.value.slice(selection.from, selection.to),
                      };
                    }
                    """,
                )

            implicit_message = (
                "Return Type Disagreement on Line 5: perimeter is annotated to return float, "
                "but reaching the end of the function implicitly returned None."
            )
            implicit_result = step_to_failure("missing-return-keyword", implicit_message)
            assert implicit_result == {
                "returnValue": "None",
                "selected": "2.0 * length + 2.0 * width",
            }
            implicit_runner = error_runner("missing-return-keyword")
            implicit_runner.locator(".python-diagram-runner__step-back").click()
            expect(implicit_runner.locator(".python-runner__output")).to_be_hidden()

            explicit_message = (
                "Return Type Disagreement on Line 5: perimeter is annotated to return float, "
                "but the return statement produced str."
            )
            explicit_result = step_to_failure("disagreement-in-return-type", explicit_message)
            assert explicit_result == {
                "returnValue": "\"2.0 * length + 2.0 * width\"",
                "selected": "return \"2.0 * length + 2.0 * width\"",
            }

            for heading_id in error_heading_ids[2:]:
                runner = error_runner(heading_id)
                output = runner.locator(".python-runner__output")
                runner.locator(".python-diagram-runner__step-into").click()
                expect(output).to_be_hidden()
                runner.locator(".python-diagram-runner__run").click()
                expect(output).to_be_visible()
                expect(output).to_have_class(re.compile(r"\bis-error\b"))
                expect(output).to_contain_text("Function Call Error")

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

            first_c_runner = page.locator("[data-c-runner]").nth(0)
            expect(first_c_runner.locator(".python-runner__title")).to_have_text("Squares")
            expect(first_c_runner).to_have_attribute("data-runner-editable", "false")
            expect(first_c_runner).to_have_attribute("data-runner-highlight-lines", "4,5")
            expect(first_c_runner.locator(".python-runner__line-highlight")).to_have_count(2)
            expect(first_c_runner.locator(".python-runner__annotation-marker")).to_have_text("1")
            expect(first_c_runner.locator(".cm-content")).to_have_attribute("contenteditable", "false")
            first_c_source = page.evaluate(
                """
                document
                  .querySelectorAll("[data-c-runner]")[0]
                  .pythonRunnerEditor
                  .state
                  .doc
                  .toString()
                """
            )
            first_c_text = page.evaluate(
                """
                () => {
                  const widget = document.querySelectorAll("[data-c-runner]")[0];
                  widget.querySelector(".cm-content").focus();
                  document.execCommand("insertText", false, "int broken = ;");
                  return widget.pythonRunnerEditor.state.doc.toString();
                }
                """
            )
            assert first_c_text == first_c_source

            page.evaluate(
                """
                () => {
                  const originalFetch = window.fetch;
                  window.__cToolchainFetchCount = 0;
                  window.__restoreRunnerFetch = () => {
                    window.fetch = originalFetch;
                  };
                  window.fetch = (...args) => {
                    const url = String(args[0]);
                    if (url.endsWith("/clang.wasm") || url.endsWith("/wasm-ld.wasm")) {
                      window.__cToolchainFetchCount += 1;
                    }
                    return originalFetch(...args);
                  };
                }
                """
            )
            page.locator(".python-runner__run").nth(0).click()
            first_output = page.locator(".python-runner__output").nth(0)
            expect(first_output).to_contain_text("1 squared is 1", timeout=120_000)
            expect(first_output).to_contain_text("4 squared is 16", timeout=120_000)
            first_compile_fetches = page.evaluate("window.__cToolchainFetchCount")
            assert first_compile_fetches >= 2

            page.evaluate(
                """
                () => {
                  document.querySelectorAll(".python-runner__output")[0].textContent = "";
                }
                """
            )
            page.locator(".python-runner__run").nth(0).click()
            expect(first_output).to_contain_text("4 squared is 16", timeout=120_000)
            assert page.evaluate("window.__cToolchainFetchCount") == first_compile_fetches
            page.evaluate("window.__restoreRunnerFetch()")

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
