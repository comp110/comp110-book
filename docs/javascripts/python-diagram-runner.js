(function () {
  const canvasWidth = 1080;
  const canvasBaseHeight = 640;
  const maxTraceSteps = 280;
  const bindingRowHeight = 30;
  const frameMetaRowHeight = 26;
  const playbackSpeeds = [1, 1.5, 2];
  const playbackIcons = {
    pause: '<path d="M8 5v14"></path><path d="M16 5v14"></path>',
    play: '<polygon points="7.5 5.5 17 12 7.5 18.5 7.5 5.5" fill="currentColor" stroke="none"></polygon>',
  };
  const identifierPattern = /^[A-Za-z_]\w*$/;
  const supportedTypes = new Set(["int", "float", "str", "bool"]);
  const codeMirrorUrls = {
    highlight: "https://esm.sh/@lezer/highlight@1",
    language: "https://esm.sh/@codemirror/language@6",
    state: "https://esm.sh/@codemirror/state@6",
    view: "https://esm.sh/@codemirror/view@6",
    python: "https://esm.sh/@codemirror/lang-python@6",
  };

  let codeMirrorPromise;

  class DiagramError extends Error {
    constructor(line, message, highlight = null) {
      super(message);
      this.name = "DiagramError";
      this.highlight = highlight;
      this.line = line || 1;
    }
  }

  function initialize(root) {
    const widgets = Array.from(
      root.querySelectorAll("[data-python-diagram-runner]:not([data-python-diagram-runner-ready])"),
    );

    widgets.forEach((widget) => {
      widget.setAttribute("data-python-diagram-runner-ready", "true");
      installDiagramRunner(widget);
    });
  }

  function installDiagramRunner(widget) {
    const codeBlock = widget.querySelector(".python-runner__code");
    const codeElement = codeBlock ? codeBlock.querySelector("code") : null;
    const canvas = widget.querySelector("[data-python-diagram-canvas]");
    const currentStep = widget.querySelector("[data-python-diagram-current-step]");
    const resetButton = widget.querySelector(".python-diagram-runner__reset");
    const runBreakpointButton = widget.querySelector(".python-diagram-runner__run-breakpoint");
    const stepBackButton = widget.querySelector(".python-diagram-runner__step-back");
    const stepIntoButton = widget.querySelector(".python-diagram-runner__step-into");
    const stepOverButton = widget.querySelector(".python-diagram-runner__step-over");
    const stepOutButton = widget.querySelector(".python-diagram-runner__step-out");
    const playButton = widget.querySelector(".python-diagram-runner__play");
    const runButton = widget.querySelector(".python-diagram-runner__run");
    const fullscreenButton = widget.querySelector(".python-diagram-runner__fullscreen");

    if (!codeBlock || !codeElement || !canvas || !currentStep || !resetButton || !runBreakpointButton || !stepBackButton || !stepIntoButton || !stepOverButton || !stepOutButton || !playButton || !runButton || !fullscreenButton) {
      return;
    }

    const source = createSourceController(codeElement.textContent.replace(/\n$/, ""));
    codeBlock.insertAdjacentElement("afterend", source.element);
    codeBlock.hidden = true;

    const handleSourceChange = () => {
      const state = widget.pythonDiagramRunner;
      stopPlayback(widget, { render: false });
      state.dirty = true;
      state.trace = [];
      state.stepIndex = -1;
      clearBreakpoints(widget);
      resetRunner(widget, { showOutput: false });
    };

    widget.pythonDiagramRunner = {
      breakpointEffect: null,
      breakpoints: new Set(),
      dirty: true,
      editor: null,
      fallbackFullscreen: false,
      handleSourceChange,
      lastSource: "",
      playbackSpeedIndex: -1,
      playbackTimerId: null,
      source,
      stepIndex: -1,
      trace: [],
    };

    source.onChange(handleSourceChange);
    const state = widget.pythonDiagramRunner;
    state.setBreakpoint = (lineNumber, on = true) => setBreakpointLine(widget, lineNumber, on);
    state.toggleBreakpoint = (lineNumber) => toggleBreakpointLine(widget, lineNumber);

    window.addEventListener("resize", () => renderCurrentStep(widget));
    document.addEventListener("fullscreenchange", () => syncFullscreenState(widget));
    window.addEventListener("keydown", (event) => {
      const state = getRunnerState(widget);
      if (event.key === "Escape" && state.fallbackFullscreen && isDiagramFullscreen(widget)) {
        event.preventDefault();
        setDiagramFullscreen(widget, false);
      }
    });

    resetButton.addEventListener("click", () => {
      stopPlayback(widget, { render: false });
      resetRunner(widget);
    });
    runBreakpointButton.addEventListener("click", () => {
      stopPlayback(widget, { render: false });
      runToBreakpoint(widget);
    });
    stepBackButton.addEventListener("click", () => {
      stopPlayback(widget, { render: false });
      stepBackRunner(widget);
    });
    stepIntoButton.addEventListener("click", () => {
      stopPlayback(widget, { render: false });
      stepIntoRunner(widget);
    });
    stepOverButton.addEventListener("click", () => {
      stopPlayback(widget, { render: false });
      stepOverRunner(widget);
    });
    stepOutButton.addEventListener("click", () => {
      stopPlayback(widget, { render: false });
      stepOutRunner(widget);
    });
    playButton.addEventListener("click", () => togglePlayback(widget));
    runButton.addEventListener("click", () => {
      stopPlayback(widget, { render: false });
      runToEnd(widget);
    });
    fullscreenButton.addEventListener("click", () => toggleFullscreen(widget));
    updateFullscreenButton(widget, false);

    resetRunner(widget);
    enhanceSourceEditor(widget, source).catch((error) => {
      console.warn("CodeMirror failed to load for python_diagram_runner; using textarea fallback.", error);
    });
  }

  function createSourceController(initialValue) {
    const textarea = document.createElement("textarea");
    textarea.className = "python-diagram-runner__source";
    textarea.spellcheck = false;
    textarea.value = initialValue;

    let changeListener = () => {};
    const controller = {
      element: textarea,
      host: null,
      view: null,
      get value() {
        return this.view ? this.view.state.doc.toString() : textarea.value;
      },
      onChange(listener) {
        changeListener = listener;
        textarea.addEventListener("input", listener);
      },
      setCodeMirrorView(view, host) {
        this.view = view;
        this.host = host;
        textarea.remove();
      },
      setValue(value) {
        if (this.view) {
          this.view.dispatch({
            changes: { from: 0, to: this.view.state.doc.length, insert: value },
          });
        } else {
          textarea.value = value;
          changeListener();
        }
      },
      clearSelection() {
        if (this.view) {
          this.view.dispatch({ selection: { anchor: 0, head: 0 } });
          return;
        }
        try {
          textarea.setSelectionRange(0, 0);
        } catch (error) {
          // Some mobile browsers do not allow selection changes before focus.
        }
      },
      selectRange(from, to) {
        if (this.view) {
          this.view.focus();
          this.view.dispatch({ selection: { anchor: from, head: to }, scrollIntoView: true });
          return;
        }
        try {
          textarea.focus({ preventScroll: true });
          textarea.setSelectionRange(from, to);
        } catch (error) {
          // Some mobile browsers do not allow selection while the textarea is not focused.
        }
      },
    };
    return controller;
  }

  async function enhanceSourceEditor(widget, source) {
    const host = document.createElement("div");
    host.className = "python-diagram-runner__editor";
    source.element.insertAdjacentElement("beforebegin", host);

    try {
      const {
        EditorView,
        GutterMarker,
        RangeSet,
        StateEffect,
        StateField,
        gutter,
        highlightStyle,
        lineNumbers,
        python,
        syntaxHighlighting,
      } = await getCodeMirror();
      if (!widget.isConnected) {
        host.remove();
        return;
      }

      const breakpointTools = createBreakpointTools(widget, StateEffect, StateField, RangeSet, gutter, GutterMarker);
      const runnerState = getRunnerState(widget);
      runnerState.breakpointEffect = breakpointTools.effect;

      const view = new EditorView({
        doc: source.value,
        parent: host,
        extensions: [
          breakpointTools.extension,
          lineNumbers(),
          python(),
          syntaxHighlighting(highlightStyle, { fallback: true }),
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              getRunnerState(widget).handleSourceChange();
            }
          }),
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

      source.setCodeMirrorView(view, host);
      getRunnerState(widget).editor = view;
      renderCurrentStep(widget);
    } catch (error) {
      host.remove();
      throw error;
    }
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
        EditorView: view.EditorView,
        GutterMarker: view.GutterMarker,
        RangeSet: state.RangeSet,
        StateEffect: state.StateEffect,
        StateField: state.StateField,
        gutter: view.gutter,
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
      { tag: [tags.keyword, tags.operatorKeyword, tags.modifier], color: "var(--md-code-hl-keyword-color, #cf222e)" },
      { tag: [tags.name, tags.definition(tags.variableName), tags.variableName], color: "var(--md-code-fg-color, #24292f)" },
      { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--md-code-hl-function-color, #8250df)" },
      { tag: [tags.className, tags.typeName, tags.standard(tags.typeName)], color: "var(--md-code-hl-constant-color, #0550ae)" },
      { tag: [tags.string, tags.special(tags.string)], color: "var(--md-code-hl-string-color, #0a3069)" },
      { tag: [tags.number, tags.bool, tags.null], color: "var(--md-code-hl-number-color, #0550ae)" },
      { tag: [tags.comment, tags.docComment], color: "var(--md-code-hl-comment-color, #6e7781)", fontStyle: "italic" },
      { tag: tags.operator, color: "var(--md-code-hl-operator-color, #0550ae)" },
      { tag: tags.punctuation, color: "var(--md-code-fg-color, #24292f)" },
    ]);
  }

  function createBreakpointTools(widget, StateEffect, StateField, RangeSet, gutter, GutterMarker) {
    class BreakpointMarker extends GutterMarker {
      toDOM() {
        const marker = document.createElement("span");
        marker.className = "python-diagram-runner__breakpoint-marker";
        marker.title = "Breakpoint";
        return marker;
      }
    }

    const marker = new BreakpointMarker();
    const effect = StateEffect.define({
      map(value, changes) {
        return { on: value.on, pos: changes.mapPos(value.pos) };
      },
    });
    const field = StateField.define({
      create() {
        return RangeSet.empty;
      },
      update(set, transaction) {
        let next = set.map(transaction.changes);
        transaction.effects.forEach((item) => {
          if (!item.is(effect)) {
            return;
          }
          if (item.value.on) {
            next = next.update({ add: [marker.range(item.value.pos)] });
          } else {
            next = next.update({ filter: (from) => from !== item.value.pos });
          }
        });
        return next;
      },
      provide: (breakpointField) => gutter({
        class: "python-diagram-runner__breakpoint-gutter",
        domEventHandlers: {
          mousedown(view, line) {
            const lineNumber = view.state.doc.lineAt(line.from).number;
            toggleBreakpointLine(widget, lineNumber);
            return true;
          },
        },
        initialSpacer: () => marker,
        markers: (view) => view.state.field(breakpointField),
      }),
    });

    return { effect, extension: field };
  }

  function toggleBreakpointLine(widget, lineNumber) {
    const state = getRunnerState(widget);
    setBreakpointLine(widget, lineNumber, !state.breakpoints.has(lineNumber));
  }

  function setBreakpointLine(widget, lineNumber, on) {
    const state = getRunnerState(widget);
    const line = Number(lineNumber);
    if (!Number.isInteger(line) || line < 1) {
      return;
    }
    const enabled = Boolean(on);
    if (state.breakpoints.has(line) === enabled) {
      renderCurrentStep(widget);
      return;
    }
    if (enabled) {
      state.breakpoints.add(line);
    } else {
      state.breakpoints.delete(line);
    }
    if (state.source.view && state.breakpointEffect && line <= state.source.view.state.doc.lines) {
      const position = state.source.view.state.doc.line(line).from;
      state.source.view.dispatch({ effects: state.breakpointEffect.of({ on: enabled, pos: position }) });
    }
    renderCurrentStep(widget);
  }

  function clearBreakpoints(widget) {
    const state = getRunnerState(widget);
    if (!state || !state.breakpoints || !state.breakpoints.size) {
      return;
    }
    Array.from(state.breakpoints).forEach((lineNumber) => setBreakpointLine(widget, lineNumber, false));
  }

  function getRunnerState(widget) {
    return widget.pythonDiagramRunner;
  }

  function isPlaybackRunning(state) {
    return Boolean(state && state.playbackTimerId !== null);
  }

  function formatPlaybackSpeed(speed) {
    return `${speed.toFixed(1)}x`;
  }

  function updatePlaybackButton(widget) {
    const state = getRunnerState(widget);
    const playButton = widget.querySelector(".python-diagram-runner__play");
    if (!state || !playButton) {
      return;
    }

    const playing = isPlaybackRunning(state);
    const nextSpeed = playing
      ? playbackSpeeds[state.playbackSpeedIndex + 1]
      : playbackSpeeds[0];

    playButton.setAttribute("aria-pressed", playing ? "true" : "false");
    if (nextSpeed) {
      setPlaybackButtonIcon(playButton, "play");
      setPlaybackButtonSpeed(playButton, formatPlaybackSpeed(nextSpeed));
      const label = playing
        ? `Set playback speed to ${formatPlaybackSpeed(nextSpeed)}`
        : `Play at ${formatPlaybackSpeed(nextSpeed)}`;
      playButton.setAttribute("aria-label", label);
      playButton.setAttribute("title", label);
      return;
    }

    setPlaybackButtonIcon(playButton, "pause");
    setPlaybackButtonSpeed(playButton, "");
    playButton.setAttribute("aria-label", "Pause playback");
    playButton.setAttribute("title", "Pause playback");
  }

  function setPlaybackButtonIcon(playButton, mode) {
    if (playButton.dataset.pythonDiagramPlayMode === mode) {
      return;
    }
    const icon = playButton.querySelector(".python-diagram-runner__control-icon");
    if (icon && playbackIcons[mode]) {
      icon.innerHTML = playbackIcons[mode];
    }
    playButton.dataset.pythonDiagramPlayMode = mode;
  }

  function setPlaybackButtonSpeed(playButton, text) {
    const speedLabel = playButton.querySelector(".python-diagram-runner__play-speed");
    if (!speedLabel) {
      return;
    }
    speedLabel.textContent = text;
    speedLabel.hidden = !text;
  }

  function togglePlayback(widget) {
    const state = getRunnerState(widget);
    if (!isPlaybackRunning(state)) {
      startPlayback(widget);
      return;
    }

    if (state.playbackSpeedIndex < playbackSpeeds.length - 1) {
      state.playbackSpeedIndex += 1;
      schedulePlaybackTimer(widget);
      updatePlaybackButton(widget);
      return;
    }

    stopPlayback(widget);
  }

  function startPlayback(widget) {
    if (!ensureFreshTrace(widget)) {
      return;
    }
    const state = getRunnerState(widget);
    if (state.stepIndex >= state.trace.length - 1) {
      return;
    }

    hideOutput(widget);
    state.playbackSpeedIndex = 0;
    schedulePlaybackTimer(widget);
    advancePlayback(widget);
    updatePlaybackButton(widget);
  }

  function schedulePlaybackTimer(widget) {
    const state = getRunnerState(widget);
    if (state.playbackTimerId !== null) {
      window.clearInterval(state.playbackTimerId);
    }
    const speed = playbackSpeeds[state.playbackSpeedIndex] || playbackSpeeds[0];
    state.playbackTimerId = window.setInterval(() => advancePlayback(widget), 1000 / speed);
  }

  function advancePlayback(widget) {
    const state = getRunnerState(widget);
    if (!state || !state.trace.length) {
      stopPlayback(widget);
      return;
    }
    if (state.stepIndex >= state.trace.length - 1) {
      finishPlayback(widget);
      return;
    }

    moveToStep(widget, state.stepIndex + 1);
    const current = state.trace[state.stepIndex];
    if (current && current.failed) {
      stopPlayback(widget);
      outputText(widget, current.message, true);
      return;
    }
    if (state.stepIndex >= state.trace.length - 1) {
      finishPlayback(widget);
    }
  }

  function finishPlayback(widget) {
    const state = getRunnerState(widget);
    const current = state && state.trace[state.stepIndex];
    stopPlayback(widget);
    outputText(
      widget,
      current && current.failed ? current.message : "Finished diagram trace.",
      Boolean(current && current.failed),
    );
  }

  function stopPlayback(widget, options = {}) {
    const state = getRunnerState(widget);
    if (!state) {
      return;
    }
    if (state.playbackTimerId !== null) {
      window.clearInterval(state.playbackTimerId);
    }
    state.playbackTimerId = null;
    state.playbackSpeedIndex = -1;
    updatePlaybackButton(widget);
    if (options.render !== false) {
      renderCurrentStep(widget);
    }
  }

  function isDiagramFullscreen(widget) {
    return widget.getAttribute("data-python-diagram-fullscreen") === "true";
  }

  function toggleFullscreen(widget) {
    if (isDiagramFullscreen(widget)) {
      exitFullscreen(widget);
      return;
    }
    enterFullscreen(widget);
  }

  function enterFullscreen(widget) {
    const state = getRunnerState(widget);
    state.fallbackFullscreen = false;
    setDiagramFullscreen(widget, true);

    if (!widget.requestFullscreen) {
      state.fallbackFullscreen = true;
      return;
    }

    widget.requestFullscreen().catch((error) => {
      console.warn("Fullscreen request failed; using fixed fullscreen fallback.", error);
      if (!isDiagramFullscreen(widget)) {
        return;
      }
      state.fallbackFullscreen = true;
      setDiagramFullscreen(widget, true);
    });
  }

  function exitFullscreen(widget) {
    const state = getRunnerState(widget);
    if (document.fullscreenElement === widget && document.exitFullscreen) {
      document.exitFullscreen().catch((error) => {
        console.warn("Fullscreen exit failed; clearing diagram fullscreen state.", error);
        state.fallbackFullscreen = false;
        setDiagramFullscreen(widget, false);
      });
      return;
    }
    state.fallbackFullscreen = false;
    setDiagramFullscreen(widget, false);
  }

  function syncFullscreenState(widget) {
    const state = getRunnerState(widget);
    if (document.fullscreenElement === widget) {
      state.fallbackFullscreen = false;
      setDiagramFullscreen(widget, true);
      return;
    }
    if (!state.fallbackFullscreen) {
      setDiagramFullscreen(widget, false);
    }
  }

  function setDiagramFullscreen(widget, active) {
    if (active) {
      widget.setAttribute("data-python-diagram-fullscreen", "true");
    } else {
      widget.removeAttribute("data-python-diagram-fullscreen");
    }
    updateFullscreenButton(widget, active);
    updateFullscreenBodyState();
    scheduleDiagramLayoutRefresh(widget);
  }

  function updateFullscreenButton(widget, active) {
    const button = widget.querySelector(".python-diagram-runner__fullscreen");
    if (!button) {
      return;
    }
    const label = active ? "Exit Full Screen" : "Full Screen";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", active ? "true" : "false");
    button.setAttribute("title", label);
  }

  function updateFullscreenBodyState() {
    document.body.classList.toggle(
      "python-diagram-runner-fullscreen-open",
      Boolean(document.querySelector('[data-python-diagram-fullscreen="true"]')),
    );
  }

  function scheduleDiagramLayoutRefresh(widget) {
    window.requestAnimationFrame(() => {
      const state = getRunnerState(widget);
      if (state && state.editor && typeof state.editor.requestMeasure === "function") {
        state.editor.requestMeasure();
      }
      renderCurrentStep(widget);
      window.setTimeout(() => renderCurrentStep(widget), 180);
    });
  }

  function getOutput(widget) {
    return widget.querySelector(".python-runner__output");
  }

  function hideOutput(widget) {
    const output = getOutput(widget);
    if (!output) {
      return;
    }
    output.hidden = true;
    output.classList.remove("is-error");
    output.textContent = "";
  }

  function outputText(widget, text, isError) {
    const output = getOutput(widget);
    if (!output) {
      return;
    }
    output.hidden = false;
    output.classList.toggle("is-error", Boolean(isError));
    output.textContent = text || "(no output)";
  }

  function resetRunner(widget, options = {}) {
    const state = getRunnerState(widget);
    const canvas = widget.querySelector("[data-python-diagram-canvas]");
    const showOutput = options.showOutput !== false;

    try {
      const result = buildDiagramTrace(state.source.value);
      state.trace = result.trace;
      state.stepIndex = -1;
      state.lastSource = state.source.value;
      state.dirty = false;
      renderCurrentStep(widget);
      if (result.error && showOutput) {
        outputText(widget, result.error, true);
      } else {
        hideOutput(widget);
      }
    } catch (error) {
      state.trace = [];
      state.stepIndex = -1;
      state.dirty = true;
      renderCurrentStep(widget);
      drawEmptyDiagram(canvas, "Diagram parse error");
      if (showOutput) {
        outputText(widget, error && error.message ? error.message : String(error), true);
      } else {
        hideOutput(widget);
      }
    }
  }

  function ensureFreshTrace(widget) {
    const state = getRunnerState(widget);
    if (state.dirty || state.lastSource !== state.source.value || !state.trace.length) {
      resetRunner(widget);
    }
    return state.trace.length > 0;
  }

  function stepRunner(widget) {
    stepIntoRunner(widget);
  }

  function stepBackRunner(widget) {
    if (!ensureFreshTrace(widget)) {
      return;
    }
    const state = getRunnerState(widget);
    const target = state.stepIndex - 1;
    moveToStep(widget, target);
    if (target < 0) {
      hideOutput(widget);
    }
  }

  function stepIntoRunner(widget) {
    if (!ensureFreshTrace(widget)) {
      return;
    }
    const state = getRunnerState(widget);
    moveToStep(widget, Math.min(state.stepIndex + 1, state.trace.length - 1));
  }

  function stepOverRunner(widget) {
    if (!ensureFreshTrace(widget)) {
      return;
    }
    const state = getRunnerState(widget);
    const current = state.trace[state.stepIndex];
    if (!current || state.stepIndex >= state.trace.length - 1 || !current.line) {
      stepIntoRunner(widget);
      return;
    }

    const currentDepth = current.callDepth || 0;
    let target = state.trace.length - 1;
    for (let index = state.stepIndex + 1; index < state.trace.length; index += 1) {
      const candidate = state.trace[index];
      if (candidate.failed || ((candidate.callDepth || 0) <= currentDepth && candidate.line !== current.line)) {
        target = index;
        break;
      }
    }
    moveToStep(widget, target);
  }

  function stepOutRunner(widget) {
    if (!ensureFreshTrace(widget)) {
      return;
    }
    const state = getRunnerState(widget);
    const current = state.trace[state.stepIndex];
    const currentDepth = current ? current.callDepth || 0 : 0;
    if (!current || currentDepth <= 0 || state.stepIndex >= state.trace.length - 1) {
      return;
    }

    let target = state.trace.length - 1;
    for (let index = state.stepIndex + 1; index < state.trace.length; index += 1) {
      const candidate = state.trace[index];
      if (candidate.failed || candidate.snapshot.activeFrameId !== current.snapshot.activeFrameId || (candidate.callDepth || 0) < currentDepth) {
        target = index;
        break;
      }
    }
    moveToStep(widget, target);
  }

  function runToBreakpoint(widget) {
    if (!ensureFreshTrace(widget)) {
      return;
    }
    const state = getRunnerState(widget);
    const target = nextBreakpointIndex(state);
    moveToStep(widget, target);
    const current = state.trace[state.stepIndex];
    if (current && state.breakpoints.has(current.line)) {
      outputText(widget, `Paused at breakpoint on line ${current.line}.`, false);
    } else {
      outputText(widget, current && current.failed ? current.message : "No breakpoint hit; finished diagram trace.", Boolean(current && current.failed));
    }
  }

  function nextBreakpointIndex(state) {
    for (let index = state.stepIndex + 1; index < state.trace.length; index += 1) {
      const line = state.trace[index].line;
      if (line && state.breakpoints.has(line)) {
        return index;
      }
    }
    return Math.max(0, state.trace.length - 1);
  }

  function runToEnd(widget) {
    if (!ensureFreshTrace(widget)) {
      return;
    }
    const state = getRunnerState(widget);
    moveToStep(widget, Math.max(0, state.trace.length - 1));
    const current = state.trace[state.stepIndex];
    outputText(widget, current && current.failed ? current.message : "Finished diagram trace.", Boolean(current && current.failed));
  }

  function moveToStep(widget, stepIndex) {
    const state = getRunnerState(widget);
    if (!state.trace.length) {
      state.stepIndex = -1;
      renderCurrentStep(widget);
      return;
    }
    state.stepIndex = Math.max(-1, Math.min(stepIndex, state.trace.length - 1));
    renderCurrentStep(widget);
  }

  function renderCurrentStep(widget) {
    const state = getRunnerState(widget);
    const canvas = widget.querySelector("[data-python-diagram-canvas]");
    const currentStep = widget.querySelector("[data-python-diagram-current-step]");
    const runBreakpointButton = widget.querySelector(".python-diagram-runner__run-breakpoint");
    const playButton = widget.querySelector(".python-diagram-runner__play");
    const runButton = widget.querySelector(".python-diagram-runner__run");
    const stepBackButton = widget.querySelector(".python-diagram-runner__step-back");
    const stepIntoButton = widget.querySelector(".python-diagram-runner__step-into");
    const stepOverButton = widget.querySelector(".python-diagram-runner__step-over");
    const stepOutButton = widget.querySelector(".python-diagram-runner__step-out");
    const current = state.stepIndex >= 0 ? state.trace[state.stepIndex] : null;
    const hasTrace = state.trace.length > 0;
    const atEnd = hasTrace && state.stepIndex >= state.trace.length - 1;
    const canAdvance = hasTrace && !atEnd;
    const playbackRunning = isPlaybackRunning(state);

    if (runBreakpointButton) {
      runBreakpointButton.disabled = !canAdvance || !state.breakpoints.size;
    }
    if (playButton) {
      playButton.disabled = !hasTrace || (atEnd && !playbackRunning);
    }
    if (runButton) {
      runButton.disabled = !canAdvance;
    }
    if (stepBackButton) {
      stepBackButton.disabled = !hasTrace || state.stepIndex < 0;
    }
    if (stepIntoButton) {
      stepIntoButton.disabled = !canAdvance;
    }
    if (stepOverButton) {
      stepOverButton.disabled = !canAdvance;
    }
    if (stepOutButton) {
      stepOutButton.disabled = atEnd || !current || (current.callDepth || 0) <= 0;
    }
    updatePlaybackButton(widget);
    if (!current) {
      renderCurrentStepPanel(currentStep, null, 0, state.trace.length);
      renderDiagram(canvas, emptySnapshot("Ready"));
      highlightSourceSpan(state.source, null);
      return;
    }
    renderDiagram(canvas, current.snapshot);
    highlightSourceSpan(state.source, current.highlight);
    if (playbackRunning) {
      hideCurrentStepPanel(currentStep);
      return;
    }
    renderCurrentStepPanel(currentStep, current, state.stepIndex + 1, state.trace.length);
    positionCurrentStepPopover(widget, currentStep, state.source, current.highlight);
  }

  function highlightSourceSpan(source, highlight) {
    if (!highlight || !Number.isFinite(highlight.from) || !Number.isFinite(highlight.to)) {
      source.clearSelection();
      return;
    }
    const from = Math.max(0, Math.min(source.value.length, highlight.from));
    const to = Math.max(from, Math.min(source.value.length, highlight.to));
    source.selectRange(from, to);
  }

  function clampNumber(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function positionCurrentStepPopover(widget, currentStep, source, highlight) {
    if (!currentStep || !source) {
      return;
    }

    window.requestAnimationFrame(() => {
      const anchor = sourceAnchorRect(source, highlight);
      if (!anchor) {
        return;
      }

      const widgetRect = widget.getBoundingClientRect();
      const editorElement = source.host || source.element;
      const editorRect = editorElement.getBoundingClientRect();
      const gap = 16;
      const margin = 10;
      const width = currentStep.offsetWidth || 280;
      const height = currentStep.offsetHeight || 64;
      const anchorCenter = (anchor.left + anchor.right) / 2;
      const minLeft = margin;
      const maxLeft = Math.max(minLeft, widgetRect.width - width - margin);
      const left = clampNumber(anchorCenter - widgetRect.left - width / 2, minLeft, maxLeft);
      const canFitAbove = anchor.top - height - gap >= editorRect.top + 4;
      const placement = canFitAbove ? "above" : "below";
      let top = placement === "above"
        ? anchor.top - widgetRect.top - height - gap
        : anchor.bottom - widgetRect.top + gap;
      const maxTop = Math.max(margin, widgetRect.height - height - margin);
      top = clampNumber(top, margin, maxTop);
      const pointerX = clampNumber(anchorCenter - widgetRect.left - left, 18, width - 18);

      currentStep.dataset.placement = placement;
      currentStep.style.left = `${left}px`;
      currentStep.style.top = `${top}px`;
      currentStep.style.setProperty("--python-diagram-callout-pointer-x", `${pointerX}px`);
    });
  }

  function sourceAnchorRect(source, highlight) {
    const editorElement = source.host || source.element;
    if (!editorElement) {
      return null;
    }

    if (!highlight || !Number.isFinite(highlight.from) || !Number.isFinite(highlight.to)) {
      const rect = editorElement.getBoundingClientRect();
      return {
        bottom: rect.top + 34,
        left: rect.left + rect.width / 2 - 1,
        right: rect.left + rect.width / 2 + 1,
        top: rect.top + 22,
      };
    }

    const from = Math.max(0, Math.min(source.value.length, highlight.from));
    const to = Math.max(from, Math.min(source.value.length, highlight.to));
    if (source.view) {
      const start = source.view.coordsAtPos(from, 1);
      const end = source.view.coordsAtPos(to, -1) || start;
      if (start && end) {
        return {
          bottom: Math.max(start.bottom, end.bottom),
          left: Math.min(start.left, end.left),
          right: Math.max(start.right || start.left, end.right || end.left),
          top: Math.min(start.top, end.top),
        };
      }
    }

    const rect = editorElement.getBoundingClientRect();
    return {
      bottom: rect.top + 34,
      left: rect.left + rect.width / 2 - 1,
      right: rect.left + rect.width / 2 + 1,
      top: rect.top + 22,
    };
  }

  function renderCurrentStepPanel(currentStep, step, stepNumber, stepCount) {
    if (!currentStep) {
      return;
    }
    if (!step) {
      hideCurrentStepPanel(currentStep);
      return;
    }
    currentStep.hidden = false;
    currentStep.textContent = "";
    const line = document.createElement("span");
    line.className = "python-diagram-runner__current-step-line";
    const location = step && step.line ? `Line ${step.line}` : "Setup";
    const count = stepCount ? `Step ${stepNumber} of ${stepCount}` : "Ready";
    line.textContent = `${count} - ${location}`;

    const message = document.createElement("span");
    message.className = "python-diagram-runner__current-step-message";
    message.textContent = step && step.message ? step.message : "Ready.";
    currentStep.append(line, message);
  }

  function hideCurrentStepPanel(currentStep) {
    currentStep.hidden = true;
    currentStep.textContent = "";
    delete currentStep.dataset.placement;
    currentStep.style.left = "";
    currentStep.style.top = "";
    currentStep.style.removeProperty("--python-diagram-callout-pointer-x");
  }

  function parseSourceLines(source) {
    const lines = [];
    const normalized = source.replace(/\r\n?/g, "\n");
    let startOffset = 0;

    normalized.split("\n").forEach((raw, index) => {
      const commentOnly = raw.trimStart().startsWith("#");
      const code = (commentOnly ? raw : stripInlineComment(raw)).trimEnd();
      const indentText = raw.match(/^\s*/)[0] || "";
      lines.push({
        code,
        codeEnd: startOffset + code.length,
        codeStart: startOffset + indentText.length,
        indent: countIndent(raw),
        indentChars: indentText.length,
        number: index + 1,
        raw,
        startOffset,
        trimmed: code.trim(),
      });
      startOffset += raw.length + 1;
    });

    return lines;
  }

  function lineCodeSpan(line) {
    const from = Math.min(line.codeStart, line.codeEnd);
    const to = Math.max(from, line.codeEnd);
    return { from, line: line.number, to: to > from ? to : from + Math.max(0, line.raw.length - line.indentChars) };
  }

  function lineSubstringSpan(line, value) {
    const fallback = lineCodeSpan(line);
    if (!value) {
      return fallback;
    }
    const start = line.raw.indexOf(value, line.indentChars);
    if (start < 0) {
      return fallback;
    }
    return {
      from: line.startOffset + start,
      line: line.number,
      to: line.startOffset + start + value.length,
    };
  }

  function expressionBaseOffset(line, expressionSource) {
    const start = line.raw.indexOf(expressionSource, line.indentChars);
    return start < 0 ? line.codeStart : line.startOffset + start;
  }

  function lineSpanByNumber(state, lineNumber) {
    const line = state.program.lines.find((candidate) => candidate.number === lineNumber);
    return line ? lineCodeSpan(line) : null;
  }

  function countIndent(raw) {
    let count = 0;
    for (const char of raw) {
      if (char === " ") {
        count += 1;
      } else if (char === "\t") {
        count += 4;
      } else {
        break;
      }
    }
    return count;
  }

  function stripInlineComment(raw) {
    let quote = null;
    let escaped = false;
    for (let index = 0; index < raw.length; index += 1) {
      const char = raw[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (quote) {
        if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }
      if (char === "'" || char === '"') {
        quote = char;
      } else if (char === "#") {
        return raw.slice(0, index);
      }
    }
    return raw;
  }

  function isDocstringStart(trimmed) {
    return trimmed.startsWith('"""') || trimmed.startsWith("'''");
  }

  function docstringEndIndex(lines, index) {
    const trimmed = lines[index].trimmed;
    const quote = trimmed.startsWith('"""') ? '"""' : "'''";
    if (trimmed.slice(3).includes(quote)) {
      return index + 1;
    }
    for (let next = index + 1; next < lines.length; next += 1) {
      if (lines[next].raw.includes(quote)) {
        return next + 1;
      }
    }
    throw new DiagramError(lines[index].number, "Unclosed docstring.");
  }

  function parseProgram(lines) {
    const functions = new Map();
    const functionByIndex = new Map();

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const parsed = parseFunctionDefinition(line);
      if (!parsed) {
        continue;
      }

      const body = findFunctionBody(lines, index, line.indent);
      const fn = {
        ...parsed,
        bodyEndIndex: body.endIndex,
        bodyIndent: body.indent,
        bodyStartIndex: index + 1,
        endLine: body.endLine,
        heapId: null,
        line: line.number,
        lineInfo: line,
        startIndex: index,
      };
      functions.set(fn.name, fn);
      functionByIndex.set(index, fn);
      index = body.endIndex - 1;
    }

    return { functionByIndex, functions, lines };
  }

  function parseFunctionDefinition(line) {
    const match = /^def\s+([A-Za-z_]\w*)\s*\((.*)\)\s*(?:->\s*([A-Za-z_]\w*))?\s*:\s*$/.exec(line.trimmed);
    if (!match) {
      return null;
    }
    const [, name, paramsSource, returnType] = match;
    const params = paramsSource.trim()
      ? splitTopLevel(paramsSource, ",").map((part) => parseParameter(part.trim(), line.number))
      : [];
    if (returnType) {
      validateTypeName(returnType, line.number);
    }
    return { name, params, returnType: returnType || null };
  }

  function parseParameter(source, lineNumber) {
    const match = /^([A-Za-z_]\w*)\s*(?::\s*([A-Za-z_]\w*))?$/.exec(source);
    if (!match) {
      throw new DiagramError(lineNumber, `Unsupported parameter syntax: ${source}`);
    }
    const [, name, type] = match;
    if (type) {
      validateTypeName(type, lineNumber);
    }
    return { name, type: type || null };
  }

  function validateTypeName(type, lineNumber) {
    if (!supportedTypes.has(type)) {
      throw new DiagramError(lineNumber, `Only int, float, str, and bool annotations are supported; found ${type}.`);
    }
  }

  function findFunctionBody(lines, defIndex, defIndent) {
    let bodyIndent = null;
    let endIndex = defIndex + 1;
    let endLine = lines[defIndex].number;

    for (let index = defIndex + 1; index < lines.length; index += 1) {
      const line = lines[index];
      if (!line.trimmed) {
        endIndex = index + 1;
        continue;
      }
      if (line.indent <= defIndent) {
        break;
      }
      if (bodyIndent === null && !line.trimmed.startsWith("#")) {
        bodyIndent = line.indent;
      }
      endIndex = index + 1;
      endLine = line.number;
    }

    if (bodyIndent === null) {
      throw new DiagramError(lines[defIndex].number, "Function definitions must include an indented body.");
    }

    return { endIndex, endLine, indent: bodyIndent };
  }

  function splitTopLevel(source, separator) {
    const parts = [];
    let start = 0;
    let depth = 0;
    let quote = null;
    let escaped = false;

    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (quote) {
        if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }
      if (char === "'" || char === '"') {
        quote = char;
      } else if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
      } else if (char === separator && depth === 0) {
        parts.push(source.slice(start, index));
        start = index + 1;
      }
    }
    parts.push(source.slice(start));
    return parts;
  }

  function findTopLevelAssignment(source) {
    let depth = 0;
    let quote = null;
    let escaped = false;
    for (let index = 0; index < source.length; index += 1) {
      const char = source[index];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (quote) {
        if (char === "\\") {
          escaped = true;
        } else if (char === quote) {
          quote = null;
        }
        continue;
      }
      if (char === "'" || char === '"') {
        quote = char;
      } else if (char === "(") {
        depth += 1;
      } else if (char === ")") {
        depth -= 1;
      } else if (char === "=" && depth === 0) {
        const previous = source[index - 1] || "";
        const next = source[index + 1] || "";
        if (!"=!<>".includes(previous) && next !== "=") {
          return index;
        }
      }
    }
    return -1;
  }

  function parseAssignment(source, lineNumber) {
    const equalsIndex = findTopLevelAssignment(source);
    if (equalsIndex < 0) {
      return null;
    }
    const left = source.slice(0, equalsIndex).trim();
    const expression = source.slice(equalsIndex + 1).trim();
    const nameParts = left.split(":");
    const name = nameParts[0].trim();
    const declaredType = nameParts[1] ? nameParts[1].trim() : null;
    if (nameParts.length > 2 || !identifierPattern.test(name) || !expression) {
      throw new DiagramError(lineNumber, `Unsupported assignment syntax: ${source}`);
    }
    if (declaredType) {
      validateTypeName(declaredType, lineNumber);
    }
    return { declaredType, expression, name };
  }

  function buildDiagramTrace(source) {
    const lines = parseSourceLines(source);
    const program = parseProgram(lines);
    const state = {
      activeFrameId: 0,
      nextFrameId: 1,
      frames: [{
        bindings: [],
        id: 0,
        name: "Globals",
        returnAddress: null,
        returnValue: null,
      }],
      heap: [],
      output: [],
      program,
      trace: [],
    };

    addStep(state, null, "Established Stack, Heap, and Printed Output columns with a Globals frame.");

    try {
      executeBlock(state, 0, lines.length, 0, { allowReturn: false });
      addStep(state, null, "Program complete.");
      return { error: null, trace: state.trace };
    } catch (error) {
      const line = error instanceof DiagramError ? error.line : 1;
      const message = error && error.message ? error.message : String(error);
      addStep(state, line, message, true, error.highlight || lineSpanByNumber(state, line));
      return { error: message, trace: state.trace };
    }
  }

  function executeBlock(state, startIndex, endIndex, baseIndent, options) {
    let index = startIndex;
    while (index < endIndex) {
      const line = state.program.lines[index];
      const trimmed = line.trimmed;
      if (!trimmed) {
        index += 1;
        continue;
      }
      if (line.indent < baseIndent) {
        return { didReturn: false, value: makeNoneValue() };
      }
      if (line.indent > baseIndent) {
        throw new DiagramError(line.number, "Nested blocks must belong to an if, elif, else, while, or function definition.");
      }
      if (trimmed.startsWith("#")) {
        addStep(state, line.number, "Ignored comment.", lineCodeSpan(line));
        index += 1;
        continue;
      }
      if (isDocstringStart(trimmed)) {
        const nextIndex = docstringEndIndex(state.program.lines, index);
        addStep(state, line.number, "Ignored docstring.", lineCodeSpan(line));
        index = nextIndex;
        continue;
      }
      if (/^(import|from)\b/.test(trimmed)) {
        throw new DiagramError(line.number, "Imports are not supported in python_diagram_runner examples.");
      }
      if (/^if\b/.test(trimmed)) {
        const result = executeIf(state, index, endIndex, baseIndent, options);
        if (result.didReturn) {
          return result;
        }
        index = result.nextIndex;
        continue;
      }
      if (/^while\b/.test(trimmed)) {
        const result = executeWhile(state, index, endIndex, baseIndent, options);
        if (result.didReturn) {
          return result;
        }
        index = result.nextIndex;
        continue;
      }
      if (/^(elif|else)\b/.test(trimmed)) {
        throw new DiagramError(line.number, `${trimmed.split(/\s+/)[0]} without a matching if statement.`, lineCodeSpan(line));
      }
      if (/^(for|class|with|try)\b/.test(trimmed)) {
        throw new DiagramError(line.number, `Unsupported construct on line ${line.number}.`);
      }
      if (/^def\b/.test(trimmed)) {
        const fn = state.program.functionByIndex.get(index);
        if (!fn) {
          throw new DiagramError(line.number, "Function definitions inside functions are not supported.");
        }
        executeFunctionDefinition(state, fn);
        index = fn.bodyEndIndex;
        continue;
      }
      if (/^return\b/.test(trimmed)) {
        if (!options.allowReturn) {
          throw new DiagramError(line.number, "Return statements can only be found in a function definition body.");
        }
        return executeReturn(state, line, trimmed.replace(/^return\b/, "").trim());
      }

      const assignment = parseAssignment(trimmed, line.number);
      if (assignment) {
        executeAssignment(state, line, assignment);
        index += 1;
        continue;
      }

      const expression = parseExpression(trimmed, line.number, expressionBaseOffset(line, trimmed));
      if (isPrintCall(expression)) {
        executePrint(state, line, expression);
      } else if (expression.type === "call") {
        const value = evaluateExpression(expression, state);
        addStep(state, line.number, `Evaluated function call expression to ${formatValue(value)}.`, expression.span);
      } else {
        throw new DiagramError(line.number, `Unsupported statement: ${trimmed}`);
      }
      index += 1;
    }

    return { didReturn: false, value: makeNoneValue() };
  }

  function executeIf(state, index, endIndex, baseIndent, options) {
    const chain = collectIfClauses(state.program.lines, index, endIndex, baseIndent);
    let selected = null;
    let lastClause = null;

    for (const clause of chain.clauses) {
      lastClause = clause;
      if (clause.header.kind === "else") {
        addStep(state, clause.line.number, "Else branch: entering block.", lineCodeSpan(clause.line));
        selected = clause;
        break;
      }

      const expression = parseExpression(
        clause.header.condition,
        clause.line.number,
        expressionBaseOffset(clause.line, clause.header.condition),
      );
      const value = evaluateExpression(expression, state);
      const takeBranch = isTruthy(value);
      const label = clause.header.kind === "if" ? "If" : "Elif";
      addStep(
        state,
        clause.line.number,
        `${label} condition evaluated to ${formatValue(value)} (${takeBranch ? "truthy" : "falsy"}).`,
        expression.span,
      );
      if (takeBranch) {
        selected = clause;
        break;
      }
    }

    if (!selected) {
      const line = lastClause ? lastClause.line : state.program.lines[index];
      addStep(state, line.number, "No if or elif condition was truthy; skipped the if statement.", lineCodeSpan(line));
      return { didReturn: false, nextIndex: chain.nextIndex, value: makeNoneValue() };
    }

    const result = executeBlock(
      state,
      selected.block.startIndex,
      selected.block.endIndex,
      selected.block.indent,
      options,
    );
    if (result.didReturn) {
      return { ...result, nextIndex: chain.nextIndex };
    }
    return { didReturn: false, nextIndex: chain.nextIndex, value: makeNoneValue() };
  }

  function executeWhile(state, index, endIndex, baseIndent, options) {
    const line = state.program.lines[index];
    const header = parseWhileHeader(line);
    const block = findIndentedBlock(state.program.lines, index, endIndex, line.indent, "while");
    const expression = parseExpression(
      header.condition,
      line.number,
      expressionBaseOffset(line, header.condition),
    );

    while (true) {
      const value = evaluateExpression(expression, state);
      const takeLoop = isTruthy(value);
      addStep(
        state,
        line.number,
        `While condition evaluated to ${formatValue(value)} (${takeLoop ? "truthy" : "falsy"}).`,
        expression.span,
      );
      if (!takeLoop) {
        break;
      }
      const result = executeBlock(state, block.startIndex, block.endIndex, block.indent, options);
      if (result.didReturn) {
        return { ...result, nextIndex: block.endIndex };
      }
    }

    return { didReturn: false, nextIndex: block.endIndex, value: makeNoneValue() };
  }

  function collectIfClauses(lines, index, endIndex, baseIndent) {
    const clauses = [];
    let cursor = index;

    while (cursor < endIndex) {
      const line = lines[cursor];
      if (!line.trimmed) {
        cursor += 1;
        continue;
      }
      if (line.indent !== baseIndent) {
        break;
      }
      const header = parseIfHeader(line, clauses.length === 0);
      if (!header) {
        break;
      }
      const block = findIndentedBlock(lines, cursor, endIndex, line.indent, header.kind);
      clauses.push({ block, header, line });
      cursor = block.endIndex;

      if (header.kind === "else") {
        break;
      }
      const next = nextCodeIndex(lines, cursor, endIndex);
      if (
        next >= endIndex
        || lines[next].indent !== baseIndent
        || !/^(elif|else)\b/.test(lines[next].trimmed)
      ) {
        break;
      }
      cursor = next;
    }

    if (!clauses.length || clauses[0].header.kind !== "if") {
      throw new DiagramError(lines[index].number, "Expected an if statement.", lineCodeSpan(lines[index]));
    }
    return { clauses, nextIndex: cursor };
  }

  function parseIfHeader(line, firstClause) {
    let match = /^if\s+(.+):$/.exec(line.trimmed);
    if (match) {
      return { condition: match[1].trim(), kind: "if" };
    }
    if (!firstClause) {
      match = /^elif\s+(.+):$/.exec(line.trimmed);
      if (match) {
        return { condition: match[1].trim(), kind: "elif" };
      }
      if (/^else\s*:$/.test(line.trimmed)) {
        return { condition: null, kind: "else" };
      }
    }
    if (/^(if|elif|else)\b/.test(line.trimmed)) {
      throw new DiagramError(line.number, `Unsupported if syntax: ${line.trimmed}`, lineCodeSpan(line));
    }
    return null;
  }

  function parseWhileHeader(line) {
    const match = /^while\s+(.+):$/.exec(line.trimmed);
    if (!match) {
      throw new DiagramError(line.number, `Unsupported while syntax: ${line.trimmed}`, lineCodeSpan(line));
    }
    return { condition: match[1].trim() };
  }

  function findIndentedBlock(lines, headerIndex, endIndex, headerIndent, label) {
    let bodyIndent = null;
    let blockEndIndex = headerIndex + 1;
    let endLine = lines[headerIndex].number;

    for (let index = headerIndex + 1; index < endIndex; index += 1) {
      const line = lines[index];
      if (!line.trimmed) {
        blockEndIndex = index + 1;
        continue;
      }
      if (line.indent <= headerIndent) {
        break;
      }
      if (bodyIndent === null) {
        bodyIndent = line.indent;
      }
      blockEndIndex = index + 1;
      endLine = line.number;
    }

    if (bodyIndent === null) {
      throw new DiagramError(lines[headerIndex].number, `${label} statements must include an indented body.`, lineCodeSpan(lines[headerIndex]));
    }

    return {
      endIndex: blockEndIndex,
      endLine,
      indent: bodyIndent,
      startIndex: headerIndex + 1,
    };
  }

  function nextCodeIndex(lines, startIndex, endIndex) {
    let index = startIndex;
    while (index < endIndex && !lines[index].trimmed) {
      index += 1;
    }
    return index;
  }

  function executeFunctionDefinition(state, fn) {
    const frame = getActiveFrame(state);
    const heapId = state.heap.length;
    fn.heapId = heapId;
    state.heap.push({
      id: heapId,
      label: `Fn Lines ${fn.line} - ${fn.endLine}`,
      name: fn.name,
    });
    setBinding(frame, fn.name, makeFunctionValue(fn), null);
    addStep(
      state,
      fn.line,
      `Function definition: bound ${fn.name} to heap ID:${heapId} and skipped lines ${fn.line + 1}-${fn.endLine}.`,
      lineCodeSpan(fn.lineInfo),
    );
  }

  function executeAssignment(state, line, assignment) {
    const value = evaluateExpression(parseExpression(assignment.expression, line.number, expressionBaseOffset(line, assignment.expression)), state);
    if (assignment.declaredType && !valueMatchesType(value, assignment.declaredType)) {
      throw new DiagramError(
        line.number,
        `Type error on Line ${line.number}: ${assignment.name} expects ${assignment.declaredType}, got ${value.type}.`,
      );
    }
    setBinding(getActiveFrame(state), assignment.name, value, assignment.declaredType);
    addStep(state, line.number, `Assigned ${assignment.name} = ${formatValue(value)} in ${getActiveFrame(state).name}.`, lineCodeSpan(line));
  }

  function executePrint(state, line, expression) {
    const values = expression.args.map((arg) => evaluateExpression(arg, state));
    const text = values.map(outputValue).join(" ");
    state.output.push(text);
    addStep(state, line.number, `Printed Output: ${text}`, expression.span);
  }

  function executeReturn(state, line, expressionSource) {
    const frame = getActiveFrame(state);
    if (frame.name === "Globals") {
      throw new DiagramError(line.number, "Return statements can only be found in a function definition body.");
    }
    const value = expressionSource
      ? evaluateExpression(parseExpression(expressionSource, line.number, expressionBaseOffset(line, expressionSource)), state)
      : makeNoneValue();
    const fn = state.program.functions.get(frame.name);
    if (fn && fn.returnType && !valueMatchesType(value, fn.returnType)) {
      throw new DiagramError(
        line.number,
        `Type error on Line ${line.number}: ${frame.name} should return ${fn.returnType}, got ${value.type}.`,
      );
    }
    const returnDepth = activeCallDepth(state);
    frame.returnValue = value;
    state.activeFrameId = findPreviousOpenFrameId(state, frame.id);
    addStep(
      state,
      line.number,
      `Return statement: stored RV ${formatValue(value)} and jumped back to RA:${frame.returnAddress}.`,
      lineCodeSpan(line),
      null,
      { callDepth: returnDepth },
    );
    return { didReturn: true, value };
  }

  function isPrintCall(expression) {
    return expression.type === "call" && expression.callee.type === "name" && expression.callee.name === "print";
  }

  function callFunction(state, fn, args, lineNumber, highlight = null) {
    if (args.length !== fn.params.length) {
      return functionCallError(
        state,
        lineNumber,
        `${fn.name} expects ${fn.params.length} argument(s), got ${args.length}.`,
        highlight,
      );
    }
    fn.params.forEach((param, index) => {
      const value = args[index];
      if (param.type && !valueMatchesType(value, param.type)) {
        functionCallError(state, lineNumber, `${param.name} expects ${param.type}, got ${value.type}.`, highlight);
      }
    });

    const frame = {
      bindings: [],
      id: state.nextFrameId,
      name: fn.name,
      returnAddress: lineNumber,
      returnValue: null,
    };
    state.nextFrameId += 1;
    fn.params.forEach((param, index) => setBinding(frame, param.name, args[index], param.type));
    state.frames.push(frame);
    state.activeFrameId = frame.id;
    addStep(state, lineNumber, `Function call: established ${fn.name} frame with RA:${lineNumber} and copied argument values.`, highlight);

    const result = executeBlock(state, fn.bodyStartIndex, fn.bodyEndIndex, fn.bodyIndent, { allowReturn: true });
    if (result.didReturn) {
      return result.value;
    }

    const noneValue = makeNoneValue();
    const returnDepth = activeCallDepth(state);
    frame.returnValue = noneValue;
    state.activeFrameId = findPreviousOpenFrameId(state, frame.id);
    addStep(
      state,
      fn.endLine,
      `Function ${fn.name} finished without an explicit return; stored RV None.`,
      lineSpanByNumber(state, fn.endLine),
      null,
      { callDepth: returnDepth },
    );
    return noneValue;
  }

  function functionCallError(state, lineNumber, detail, highlight = null) {
    const message = `Function Call Error on Line ${lineNumber}`;
    if (!state.output.includes(message)) {
      state.output.push(message);
    }
    throw new DiagramError(lineNumber, `${message}: ${detail}`, highlight);
  }

  function getActiveFrame(state) {
    return state.frames.find((frame) => frame.id === state.activeFrameId) || state.frames[0];
  }

  function findPreviousOpenFrameId(state, completedFrameId) {
    const completedIndex = state.frames.findIndex((frame) => frame.id === completedFrameId);
    for (let index = completedIndex - 1; index >= 0; index -= 1) {
      if (!state.frames[index].returnValue) {
        return state.frames[index].id;
      }
    }
    return 0;
  }

  function setBinding(frame, name, value, declaredType) {
    const binding = frame.bindings.find((item) => item.name === name);
    if (binding) {
      const previousDisplay = formatValue(binding.value);
      const nextDisplay = formatValue(value);
      binding.previousValue = previousDisplay !== nextDisplay ? binding.value : null;
      binding.value = value;
      binding.declaredType = declaredType || binding.declaredType;
      return;
    }
    frame.bindings.push({ declaredType, name, previousValue: null, value });
  }

  function findBinding(frame, name) {
    return frame.bindings.find((binding) => binding.name === name);
  }

  function resolveName(state, name, lineNumber, highlight = null) {
    const active = getActiveFrame(state);
    let binding = active ? findBinding(active, name) : null;
    if (binding) {
      addStep(state, lineNumber, `Name resolution: ${name} -> ${formatValue(binding.value)} in ${active.name}.`, highlight);
      return binding.value;
    }
    const globals = state.frames[0];
    binding = findBinding(globals, name);
    if (binding) {
      addStep(state, lineNumber, `Name resolution: ${name} -> ${formatValue(binding.value)} in Globals.`, highlight);
      return binding.value;
    }
    throw new DiagramError(lineNumber, `NameError on Line ${lineNumber}: ${name} is not defined.`, highlight);
  }

  function makeValue(type, value) {
    return { display: displayFor(type, value), type, value };
  }

  function makeNoneValue() {
    return makeValue("None", null);
  }

  function makeFunctionValue(fn) {
    return {
      display: `ID:${fn.heapId}`,
      functionName: fn.name,
      heapId: fn.heapId,
      type: "function",
      value: fn.name,
    };
  }

  function displayFor(type, value) {
    if (type === "str") {
      return JSON.stringify(value);
    }
    if (type === "bool") {
      return value ? "True" : "False";
    }
    if (type === "None") {
      return "None";
    }
    return String(value);
  }

  function formatValue(value) {
    return value && value.display !== undefined ? value.display : String(value);
  }

  function outputValue(value) {
    if (!value) {
      return "";
    }
    if (value.type === "str") {
      return String(value.value);
    }
    return formatValue(value);
  }

  function valueMatchesType(value, expected) {
    if (!expected) {
      return true;
    }
    if (expected === "float") {
      return value.type === "float" || value.type === "int";
    }
    return value.type === expected;
  }

  function isTruthy(value) {
    if (!value || value.type === "None") {
      return false;
    }
    if (value.type === "bool") {
      return Boolean(value.value);
    }
    if (value.type === "int" || value.type === "float") {
      return value.value !== 0;
    }
    if (value.type === "str") {
      return value.value.length > 0;
    }
    return true;
  }

  function tokenizeExpression(source, lineNumber, baseOffset = 0) {
    const tokens = [];
    let index = 0;
    while (index < source.length) {
      const char = source[index];
      if (/\s/.test(char)) {
        index += 1;
        continue;
      }
      if (char === "'" || char === '"') {
        const parsed = readString(source, index, lineNumber);
        tokens.push({ end: baseOffset + parsed.nextIndex, type: "string", value: parsed.value, start: baseOffset + index });
        index = parsed.nextIndex;
        continue;
      }
      if (/\d/.test(char)) {
        const match = /^\d+(?:\.\d+)?/.exec(source.slice(index));
        tokens.push({ end: baseOffset + index + match[0].length, raw: match[0], type: "number", value: Number(match[0]), start: baseOffset + index });
        index += match[0].length;
        continue;
      }
      if (/[A-Za-z_]/.test(char)) {
        const match = /^[A-Za-z_]\w*/.exec(source.slice(index));
        tokens.push({ end: baseOffset + index + match[0].length, type: "identifier", value: match[0], start: baseOffset + index });
        index += match[0].length;
        continue;
      }
      const two = source.slice(index, index + 2);
      if (["//", "==", "!=", "<=", ">="].includes(two)) {
        tokens.push({ end: baseOffset + index + 2, type: "operator", value: two, start: baseOffset + index });
        index += 2;
        continue;
      }
      if ("+-*/%(),<>".includes(char)) {
        tokens.push({ end: baseOffset + index + 1, type: "operator", value: char, start: baseOffset + index });
        index += 1;
        continue;
      }
      throw new DiagramError(lineNumber, `Unsupported expression token: ${char}`);
    }
    tokens.push({ end: baseOffset + source.length, type: "eof", value: "", start: baseOffset + source.length });
    return tokens;
  }

  function readString(source, start, lineNumber) {
    const quote = source[start];
    let value = "";
    let escaped = false;
    for (let index = start + 1; index < source.length; index += 1) {
      const char = source[index];
      if (escaped) {
        const escapes = { n: "\n", r: "\r", t: "\t", "\\": "\\", "'": "'", '"': '"' };
        value += Object.prototype.hasOwnProperty.call(escapes, char) ? escapes[char] : char;
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        return { nextIndex: index + 1, value };
      } else {
        value += char;
      }
    }
    throw new DiagramError(lineNumber, "Unclosed string literal.");
  }

  class TokenStream {
    constructor(tokens, lineNumber) {
      this.index = 0;
      this.lineNumber = lineNumber;
      this.tokens = tokens;
    }

    peek(value) {
      const token = this.tokens[this.index];
      return value === undefined ? token : token.value === value;
    }

    match(value) {
      if (this.peek(value)) {
        this.index += 1;
        return true;
      }
      return false;
    }

    consume() {
      const token = this.tokens[this.index];
      this.index += 1;
      return token;
    }

    expect(value) {
      const token = this.peek();
      if (!this.match(value)) {
        throw new DiagramError(this.lineNumber, `Expected ${value}.`);
      }
      return token;
    }
  }

  function parseExpression(source, lineNumber, baseOffset = 0) {
    const stream = new TokenStream(tokenizeExpression(source, lineNumber, baseOffset), lineNumber);
    const expression = parseComparison(stream);
    if (stream.peek().type !== "eof") {
      throw new DiagramError(lineNumber, `Unexpected token: ${stream.peek().value}`);
    }
    return expression;
  }

  function isComparisonOperator(value) {
    return ["==", "!=", "<", "<=", ">", ">="].includes(value);
  }

  function parseComparison(stream) {
    let node = parseAdditive(stream);
    while (isComparisonOperator(stream.peek().value)) {
      const operator = stream.consume().value;
      const right = parseAdditive(stream);
      node = {
        left: node,
        line: stream.lineNumber,
        operator,
        right,
        span: { from: node.span.from, to: right.span.to },
        type: "comparison",
      };
    }
    return node;
  }

  function parseAdditive(stream) {
    let node = parseMultiplicative(stream);
    while (stream.peek("+") || stream.peek("-")) {
      const operator = stream.consume().value;
      const right = parseMultiplicative(stream);
      node = {
        left: node,
        line: stream.lineNumber,
        operator,
        right,
        span: { from: node.span.from, to: right.span.to },
        type: "binary",
      };
    }
    return node;
  }

  function parseMultiplicative(stream) {
    let node = parseUnary(stream);
    while (stream.peek("*") || stream.peek("/") || stream.peek("//") || stream.peek("%")) {
      const operator = stream.consume().value;
      const right = parseUnary(stream);
      node = {
        left: node,
        line: stream.lineNumber,
        operator,
        right,
        span: { from: node.span.from, to: right.span.to },
        type: "binary",
      };
    }
    return node;
  }

  function parseUnary(stream) {
    if (stream.peek("-")) {
      const operator = stream.consume();
      const operand = parseUnary(stream);
      return {
        line: stream.lineNumber,
        operator: "-",
        operand,
        span: { from: operator.start, to: operand.span.to },
        type: "unary",
      };
    }
    return parsePrimary(stream);
  }

  function parsePrimary(stream) {
    const token = stream.consume();
    let node;
    if (token.type === "number") {
      node = {
        line: stream.lineNumber,
        span: { from: token.start, to: token.end },
        type: "literal",
        value: makeValue(token.raw.includes(".") ? "float" : "int", token.value),
      };
    } else if (token.type === "string") {
      node = {
        line: stream.lineNumber,
        span: { from: token.start, to: token.end },
        type: "literal",
        value: makeValue("str", token.value),
      };
    } else if (token.type === "identifier") {
      if (token.value === "True" || token.value === "False") {
        node = {
          line: stream.lineNumber,
          span: { from: token.start, to: token.end },
          type: "literal",
          value: makeValue("bool", token.value === "True"),
        };
      } else {
        node = {
          line: stream.lineNumber,
          name: token.value,
          span: { from: token.start, to: token.end },
          type: "name",
        };
      }
    } else if (token.value === "(") {
      node = parseComparison(stream);
      const close = stream.expect(")");
      node = {
        ...node,
        span: { from: token.start, to: close.end },
      };
    } else {
      throw new DiagramError(stream.lineNumber, `Unexpected expression token: ${token.value}`);
    }

    while (stream.peek("(")) {
      const open = stream.consume();
      const args = [];
      let close;
      if (stream.peek(")")) {
        close = stream.consume();
      } else {
        do {
          args.push(parseComparison(stream));
        } while (stream.match(","));
        close = stream.expect(")");
      }
      node = {
        args,
        callee: node,
        line: stream.lineNumber,
        span: { from: node.span.from, to: close.end || open.end },
        type: "call",
      };
    }
    return node;
  }

  function evaluateExpression(node, state) {
    if (node.type === "literal") {
      return node.value;
    }
    if (node.type === "name") {
      return resolveName(state, node.name, node.line, node.span);
    }
    if (node.type === "unary") {
      const value = evaluateExpression(node.operand, state);
      if (!isNumeric(value)) {
        throw new DiagramError(node.line, `Unary ${node.operator} expects a number.`);
      }
      return makeValue(value.type, -value.value);
    }
    if (node.type === "comparison") {
      const left = evaluateExpression(node.left, state);
      const right = evaluateExpression(node.right, state);
      const result = applyComparisonOperator(node.operator, left, right, node.line);
      addStep(state, node.line, `Comparison expression: ${formatValue(left)} ${node.operator} ${formatValue(right)} -> ${formatValue(result)}.`, node.span);
      return result;
    }
    if (node.type === "binary") {
      const left = evaluateExpression(node.left, state);
      const right = evaluateExpression(node.right, state);
      const result = applyBinaryOperator(node.operator, left, right, node.line);
      addStep(state, node.line, `Arithmetic expression: ${formatValue(left)} ${node.operator} ${formatValue(right)} -> ${formatValue(result)}.`, node.span);
      return result;
    }
    if (node.type === "call") {
      if (isPrintCall(node)) {
        throw new DiagramError(node.line, "print calls are only supported as statements.");
      }
      if (node.callee.type !== "name") {
        throw new DiagramError(node.line, "Only named function calls are supported.");
      }
      const args = node.args.map((arg) => evaluateExpression(arg, state));
      const callable = resolveName(state, node.callee.name, node.line, node.callee.span);
      if (callable.type !== "function") {
        return functionCallError(state, node.line, `${node.callee.name} is not a function.`, node.span);
      }
      const fn = state.program.functions.get(callable.functionName);
      return callFunction(state, fn, args, node.line, node.span);
    }
    throw new DiagramError(node.line || 1, "Unsupported expression.");
  }

  function isNumeric(value) {
    return value.type === "int" || value.type === "float";
  }

  function applyBinaryOperator(operator, left, right, lineNumber) {
    if (operator === "+" && left.type === "str" && right.type === "str") {
      return makeValue("str", left.value + right.value);
    }
    if (!isNumeric(left) || !isNumeric(right)) {
      throw new DiagramError(lineNumber, `${operator} expects number operands, or two strings for +.`);
    }
    if ((operator === "/" || operator === "//" || operator === "%") && right.value === 0) {
      throw new DiagramError(lineNumber, `ZeroDivisionError on Line ${lineNumber}.`);
    }

    let value;
    if (operator === "+") {
      value = left.value + right.value;
    } else if (operator === "-") {
      value = left.value - right.value;
    } else if (operator === "*") {
      value = left.value * right.value;
    } else if (operator === "/") {
      return makeValue("float", left.value / right.value);
    } else if (operator === "//") {
      value = Math.floor(left.value / right.value);
    } else if (operator === "%") {
      value = left.value % right.value;
    } else {
      throw new DiagramError(lineNumber, `Unsupported operator: ${operator}`);
    }

    const type = left.type === "float" || right.type === "float" ? "float" : "int";
    return makeValue(type, value);
  }

  function applyComparisonOperator(operator, left, right, lineNumber) {
    let value;
    if (operator === "==") {
      value = left.value === right.value;
    } else if (operator === "!=") {
      value = left.value !== right.value;
    } else {
      const comparable = (isNumeric(left) && isNumeric(right)) || (left.type === "str" && right.type === "str");
      if (!comparable) {
        throw new DiagramError(lineNumber, `${operator} expects two numbers or two strings.`);
      }
      if (operator === "<") {
        value = left.value < right.value;
      } else if (operator === "<=") {
        value = left.value <= right.value;
      } else if (operator === ">") {
        value = left.value > right.value;
      } else if (operator === ">=") {
        value = left.value >= right.value;
      } else {
        throw new DiagramError(lineNumber, `Unsupported comparison operator: ${operator}`);
      }
    }
    return makeValue("bool", value);
  }

  function activeCallDepth(state) {
    const openFrames = state.frames.filter((frame) => !frame.returnValue);
    const activeIndex = openFrames.findIndex((frame) => frame.id === state.activeFrameId);
    return Math.max(0, activeIndex);
  }

  function snapshotMemory(state, line, message, failed) {
    return {
      activeFrameId: state.activeFrameId,
      failed: Boolean(failed),
      frames: state.frames.map((frame) => ({
        active: frame.id === state.activeFrameId,
        bindings: frame.bindings.map((binding) => ({
          declaredType: binding.declaredType,
          name: binding.name,
          previousValue: binding.previousValue ? formatValue(binding.previousValue) : null,
          value: formatValue(binding.value),
        })),
        id: frame.id,
        name: frame.name,
        returnAddress: frame.returnAddress,
        returnValue: frame.returnValue ? formatValue(frame.returnValue) : null,
      })),
      heap: state.heap.map((item) => ({ ...item })),
      line,
      message,
      output: [...state.output],
    };
  }

  function addStep(state, line, message, failedOrHighlight = false, highlight = null, metadata = {}) {
    if (state.trace.length >= maxTraceSteps) {
      throw new DiagramError(line || 1, "Stopped after too many diagram steps. Check for recursion.");
    }

    const failed = typeof failedOrHighlight === "boolean" ? failedOrHighlight : false;
    const syntaxHighlight = highlight || (typeof failedOrHighlight === "object" ? failedOrHighlight : null);
    state.trace.push({
      callDepth: metadata.callDepth ?? activeCallDepth(state),
      failed,
      highlight: syntaxHighlight,
      line,
      message,
      snapshot: snapshotMemory(state, line, message, failed),
    });
  }

  function emptySnapshot(message) {
    return {
      activeFrameId: 0,
      failed: false,
      frames: [{ active: true, bindings: [], id: 0, name: "Globals", returnAddress: null, returnValue: null }],
      heap: [],
      line: null,
      message,
      output: [],
    };
  }

  function drawEmptyDiagram(canvas, message) {
    renderDiagram(canvas, emptySnapshot(message));
  }

  function diagramHeightFor(snapshot) {
    const stackHeight = stackColumnHeightFor(snapshot.frames || []);
    return Math.max(canvasBaseHeight, 82 + stackHeight + 30);
  }

  function stackColumnHeightFor(frames) {
    if (!frames.length) {
      return 528;
    }
    const frameHeights = frames.map(frameHeightFor);
    const gaps = Math.max(0, frameHeights.length - 1) * 14;
    return Math.max(528, 58 + frameHeights.reduce((sum, height) => sum + height, 0) + gaps + 16);
  }

  function frameHeightFor(frame) {
    const bindingRows = Math.max(1, frame.bindings.length);
    const metaRows = (frame.returnAddress ? 1 : 0) + (frame.returnValue ? 1 : 0);
    return Math.max(96, 52 + bindingRows * bindingRowHeight + metaRows * frameMetaRowHeight);
  }

  function renderDiagram(canvas, snapshot) {
    if (!canvas) {
      return;
    }
    const dpr = window.devicePixelRatio || 1;
    const diagramHeight = diagramHeightFor(snapshot);
    if (canvas.width !== canvasWidth * dpr || canvas.height !== diagramHeight * dpr) {
      canvas.width = canvasWidth * dpr;
      canvas.height = diagramHeight * dpr;
      canvas.style.aspectRatio = `${canvasWidth} / ${diagramHeight}`;
    }
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, canvasWidth, diagramHeight);
    context.fillStyle = "#f8fafc";
    context.fillRect(0, 0, canvasWidth, diagramHeight);

    drawStatus(context, snapshot);
    const columnHeight = diagramHeight - 112;
    const columns = {
      stack: { x: 24, y: 82, width: 420, height: columnHeight, title: "Function Call Stack" },
      heap: { x: 470, y: 82, width: 270, height: columnHeight, title: "Heap" },
      output: { x: 766, y: 82, width: 290, height: columnHeight, title: "Printed Output" },
    };
    drawColumn(context, columns.stack);
    drawColumn(context, columns.heap);
    drawColumn(context, columns.output);
    drawFrames(context, columns.stack, snapshot.frames);
    drawHeap(context, columns.heap, snapshot.heap);
    drawPrintedOutput(context, columns.output, snapshot.output);
  }

  function drawStatus(context, snapshot) {
    context.save();
    context.fillStyle = snapshot.failed ? "#fee2e2" : "#e0f2fe";
    roundRect(context, 24, 18, 1032, 46, 8);
    context.fill();
    context.strokeStyle = snapshot.failed ? "#dc2626" : "#0284c7";
    context.lineWidth = 1.5;
    context.stroke();
    context.fillStyle = "#0f172a";
    context.font = "700 17px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    context.textBaseline = "middle";
    const line = snapshot.line ? `Line ${snapshot.line}: ` : "";
    context.fillText(`${line}${snapshot.message || "Ready"}`, 42, 41, 996);
    context.restore();
  }

  function drawColumn(context, column) {
    context.save();
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#cbd5e1";
    context.lineWidth = 1.5;
    roundRect(context, column.x, column.y, column.width, column.height, 8);
    context.fill();
    context.stroke();
    context.fillStyle = "#eef2ff";
    roundRect(context, column.x, column.y, column.width, 42, 8);
    context.fill();
    context.strokeStyle = "#c7d2fe";
    context.beginPath();
    context.moveTo(column.x, column.y + 42);
    context.lineTo(column.x + column.width, column.y + 42);
    context.stroke();
    context.fillStyle = "#111827";
    context.font = "700 17px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    context.textBaseline = "middle";
    context.fillText(column.title, column.x + 16, column.y + 22, column.width - 32);
    context.restore();
  }

  function drawFrames(context, column, frames) {
    let y = column.y + 58;
    frames.forEach((frame) => {
      const height = frameHeightFor(frame);
      drawFrame(context, column.x + 14, y, column.width - 28, height, frame);
      y += height + 14;
    });
  }

  function drawFrame(context, x, y, width, height, frame) {
    context.save();
    context.fillStyle = frame.active ? "#ecfeff" : "#ffffff";
    context.strokeStyle = frame.active ? "#0891b2" : "#94a3b8";
    context.lineWidth = frame.active ? 2.5 : 1.5;
    roundRect(context, x, y, width, height, 8);
    context.fill();
    context.stroke();

    context.fillStyle = frame.active ? "#0e7490" : "#334155";
    context.font = "700 16px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    context.fillText(frame.name, x + 14, y + 24, width - 28);

    const dividerX = frame.name === "Globals" ? x + 14 : x + 128;
    if (frame.name !== "Globals") {
      context.strokeStyle = "#cbd5e1";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(dividerX, y + 36);
      context.lineTo(dividerX, y + height - 12);
      context.stroke();
      drawFrameMeta(context, x + 14, y + 50, 104, frame);
    }

    let rowY = y + 54;
    const valueX = frame.name === "Globals" ? x + 148 : dividerX + 122;
    const nameX = frame.name === "Globals" ? x + 16 : dividerX + 14;
    frame.bindings.forEach((binding) => {
      context.fillStyle = "#0f172a";
      context.font = "600 15px ui-monospace, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace";
      const label = binding.declaredType ? `${binding.name}: ${binding.declaredType}` : binding.name;
      context.fillText(label, nameX, rowY, valueX - nameX - 12);
      drawBindingValue(context, binding, valueX, rowY, x + width - valueX - 14);
      rowY += bindingRowHeight;
    });
    if (!frame.bindings.length) {
      context.fillStyle = "#64748b";
      context.font = "14px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      context.fillText("empty", nameX, rowY, width - 28);
    }
    context.restore();
  }

  function drawBindingValue(context, binding, x, y, width) {
    const currentValue = String(binding.value);
    const previousValue = binding.previousValue ? String(binding.previousValue) : "";
    context.font = "600 15px ui-monospace, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace";
    if (!previousValue || previousValue === currentValue) {
      context.fillStyle = "#1d4ed8";
      context.fillText(currentValue, x, y, width);
      return;
    }

    const gap = 9;
    const previousWidth = Math.min(context.measureText(previousValue).width, Math.max(0, width * 0.46));
    context.fillStyle = "#64748b";
    context.fillText(previousValue, x, y, previousWidth);
    context.strokeStyle = "#64748b";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(x, y - 5);
    context.lineTo(x + previousWidth, y - 5);
    context.stroke();

    context.fillStyle = "#1d4ed8";
    context.fillText(currentValue, x + previousWidth + gap, y, Math.max(0, width - previousWidth - gap));
  }

  function drawFrameMeta(context, x, y, width, frame) {
    context.save();
    context.font = "600 15px ui-monospace, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace";
    context.fillStyle = "#475569";
    if (frame.returnAddress) {
      context.fillText(`RA: ${frame.returnAddress}`, x, y, width);
      y += frameMetaRowHeight;
    }
    if (frame.returnValue) {
      context.fillStyle = "#047857";
      context.fillText(`RV: ${frame.returnValue}`, x, y, width);
    }
    context.restore();
  }

  function drawHeap(context, column, heap) {
    let y = column.y + 58;
    heap.forEach((item) => {
      if (y + 78 > column.y + column.height - 12) {
        drawOverflow(context, column, y, "More heap objects...");
        return;
      }
      context.save();
      context.fillStyle = "#f0fdf4";
      context.strokeStyle = "#16a34a";
      context.lineWidth = 1.5;
      roundRect(context, column.x + 14, y, column.width - 28, 72, 8);
      context.fill();
      context.stroke();
      context.fillStyle = "#14532d";
      context.font = "700 15px ui-monospace, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace";
      context.fillText(`ID:${item.id}`, column.x + 28, y + 25, column.width - 56);
      context.fillStyle = "#166534";
      context.font = "14px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      context.fillText(`${item.name} - ${item.label}`, column.x + 28, y + 49, column.width - 56);
      context.restore();
      y += 86;
    });
    if (!heap.length) {
      drawEmptyColumnText(context, column, "No heap objects yet");
    }
  }

  function drawPrintedOutput(context, column, output) {
    let y = column.y + 66;
    context.save();
    context.font = "16px ui-monospace, SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace";
    context.fillStyle = "#0f172a";
    output.forEach((line) => {
      context.fillText(String(line), column.x + 18, y, column.width - 36);
      y += 27;
    });
    context.restore();
    if (!output.length) {
      drawEmptyColumnText(context, column, "No printed output yet");
    }
  }

  function drawEmptyColumnText(context, column, text) {
    context.save();
    context.fillStyle = "#64748b";
    context.font = "14px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    context.fillText(text, column.x + 18, column.y + 72, column.width - 36);
    context.restore();
  }

  function drawOverflow(context, column, y, text) {
    context.save();
    context.fillStyle = "#b45309";
    context.font = "14px system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    context.fillText(text, column.x + 18, y + 20, column.width - 36);
    context.restore();
  }

  function roundRect(context, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  }

  document.addEventListener("DOMContentLoaded", () => initialize(document));

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => initialize(document));
  }

  initialize(document);
}());
