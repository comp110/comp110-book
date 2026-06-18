(function () {
  const pyodideUrl = "https://cdn.jsdelivr.net/pyodide/v314.0.0/full/pyodide.js";
  const runnoWasiUrl = "https://esm.sh/@runno/wasi@0.10.0?bundle";
  const xtermModuleUrl = "https://esm.sh/@xterm/xterm@5.5.0?bundle";
  const xtermCssUrl = "https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.css";
  const cRunnerBaseUrl = "https://runno.dev/langs";
  const cSourceFilename = "/program.c";
  const cObjectFilename = "/program.o";
  const cWasmFilename = "/program.wasm";
  const cDisplayFilename = "program.c";
  const cTerminalInputHeaderBytes = 16;
  const cTerminalInputCapacity = 64 * 1024;
  const runnerFilename = "/tmp/python-runner.py";
  const displayFilename = "python-runner.py";
  const canvasModuleFilename = "/tmp/browser_canvas.py";
  const canvasStubFilename = "/tmp/browser_canvas.pyi";
  const pygameModuleFilename = "/tmp/pygame.py";
  const pygameStubFilename = "/tmp/pygame.pyi";
  const physicsModuleFilename = "/tmp/physics2d.py";
  const physicsStubFilename = "/tmp/physics2d.pyi";
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
  const pygameBridgeSource = `
from __future__ import annotations

import inspect
import json
from typing import Any

from js import window


QUIT = "quit"
KEYDOWN = "keydown"
KEYUP = "keyup"

K_LEFT = "ArrowLeft"
K_RIGHT = "ArrowRight"
K_UP = "ArrowUp"
K_DOWN = "ArrowDown"
K_SPACE = "Space"
K_a = "KeyA"
K_d = "KeyD"
K_r = "KeyR"
K_s = "KeyS"
K_w = "KeyW"

SRCALPHA = 1


def _runner_id() -> str:
    frame: Any = inspect.currentframe()
    while frame is not None:
        value = frame.f_globals.get("__python_game_runner_id")
        if isinstance(value, str) and value:
            return value
        frame = frame.f_back
    raise RuntimeError("pygame can only be used from a browser pygame runner.")


def _call(name: str, *args: object) -> Any:
    return getattr(window.__pythonRunnerPygameBridge, name)(_runner_id(), *args)


def _clamp_color(value: object) -> int:
    return max(0, min(255, int(float(value))))


def _css_color(color: object) -> str:
    if isinstance(color, str):
        return color
    try:
        values = list(color)  # type: ignore[arg-type]
    except TypeError:
        return str(color)
    if len(values) < 3:
        return "#000000"

    red = _clamp_color(values[0])
    green = _clamp_color(values[1])
    blue = _clamp_color(values[2])
    if len(values) >= 4:
        alpha = max(0.0, min(255.0, float(values[3])))
        if alpha < 255:
            return f"rgba({red}, {green}, {blue}, {alpha / 255:.3f})"
    return f"rgb({red}, {green}, {blue})"


def _pair(value: object) -> tuple[float, float]:
    values = list(value)  # type: ignore[arg-type]
    return float(values[0]), float(values[1])


class Event:
    def __init__(self, type: str, key: str | None = None) -> None:
        self.type = type
        self.key = key


class Rect:
    def __init__(self, *args: object) -> None:
        if len(args) == 1:
            value = args[0]
            if isinstance(value, Rect):
                values = [value.x, value.y, value.width, value.height]
            else:
                values = list(value)  # type: ignore[arg-type]
        elif len(args) == 2:
            position = list(args[0])  # type: ignore[arg-type]
            size = list(args[1])  # type: ignore[arg-type]
            values = [position[0], position[1], size[0], size[1]]
        elif len(args) == 4:
            values = list(args)
        else:
            raise TypeError("Rect expects Rect, (x, y, w, h), ((x, y), (w, h)), or x, y, w, h.")

        self.x = float(values[0])
        self.y = float(values[1])
        self.width = float(values[2])
        self.height = float(values[3])

    def __iter__(self) -> Any:
        yield self.x
        yield self.y
        yield self.width
        yield self.height

    def copy(self) -> "Rect":
        return Rect(self.x, self.y, self.width, self.height)

    @property
    def w(self) -> float:
        return self.width

    @w.setter
    def w(self, value: float) -> None:
        self.width = float(value)

    @property
    def h(self) -> float:
        return self.height

    @h.setter
    def h(self, value: float) -> None:
        self.height = float(value)

    @property
    def left(self) -> float:
        return self.x

    @left.setter
    def left(self, value: float) -> None:
        self.x = float(value)

    @property
    def right(self) -> float:
        return self.x + self.width

    @right.setter
    def right(self, value: float) -> None:
        self.x = float(value) - self.width

    @property
    def top(self) -> float:
        return self.y

    @top.setter
    def top(self, value: float) -> None:
        self.y = float(value)

    @property
    def bottom(self) -> float:
        return self.y + self.height

    @bottom.setter
    def bottom(self, value: float) -> None:
        self.y = float(value) - self.height

    @property
    def centerx(self) -> float:
        return self.x + self.width / 2

    @centerx.setter
    def centerx(self, value: float) -> None:
        self.x = float(value) - self.width / 2

    @property
    def centery(self) -> float:
        return self.y + self.height / 2

    @centery.setter
    def centery(self, value: float) -> None:
        self.y = float(value) - self.height / 2

    @property
    def center(self) -> tuple[float, float]:
        return self.centerx, self.centery

    @center.setter
    def center(self, value: object) -> None:
        self.centerx, self.centery = _pair(value)

    @property
    def topleft(self) -> tuple[float, float]:
        return self.left, self.top

    @topleft.setter
    def topleft(self, value: object) -> None:
        self.left, self.top = _pair(value)

    def move_ip(self, dx: float, dy: float) -> None:
        self.x += float(dx)
        self.y += float(dy)

    def clamp_ip(self, bounds: "Rect") -> None:
        if self.left < bounds.left:
            self.left = bounds.left
        if self.top < bounds.top:
            self.top = bounds.top
        if self.right > bounds.right:
            self.right = bounds.right
        if self.bottom > bounds.bottom:
            self.bottom = bounds.bottom

    def collidepoint(self, x: float, y: float) -> bool:
        return self.left <= x <= self.right and self.top <= y <= self.bottom

    def colliderect(self, other: "Rect") -> bool:
        return (
            self.left < other.right
            and self.right > other.left
            and self.top < other.bottom
            and self.bottom > other.top
        )


def _destination_rect(dest: object, width: float, height: float) -> Rect:
    if isinstance(dest, Rect):
        return dest
    values = list(dest)  # type: ignore[arg-type]
    if len(values) == 2:
        return Rect(values[0], values[1], width, height)
    return Rect(values)


class Surface:
    def __init__(self, size: object, is_display: bool = False) -> None:
        self.width, self.height = _pair(size)
        self._is_display = is_display

    def fill(self, color: object) -> None:
        if self._is_display:
            _call("clear", _css_color(color))

    def blit(self, source: object, dest: object) -> Rect:
        width = float(getattr(source, "width", 0))
        height = float(getattr(source, "height", 0))
        rect = _destination_rect(dest, width, height)
        if hasattr(source, "_draw_to"):
            source._draw_to(rect)  # type: ignore[attr-defined]
        return rect

    def get_rect(self, **kwargs: object) -> Rect:
        rect = Rect(0, 0, self.width, self.height)
        for name, value in kwargs.items():
            setattr(rect, name, value)
        return rect


class _DisplayModule:
    def set_mode(self, size: object) -> Surface:
        width, height = _pair(size)
        _call("setSize", width, height)
        return Surface((width, height), is_display=True)

    def set_caption(self, title: str) -> None:
        _call("setCaption", title)

    def flip(self) -> None:
        return None

    def update(self) -> None:
        return None


class _DrawModule:
    def rect(self, surface: Surface, color: object, rect: object, width: int = 0, border_radius: int = 0) -> Rect:
        target = rect if isinstance(rect, Rect) else Rect(rect)
        line_width = max(0, int(width))
        fill = None if line_width else _css_color(color)
        stroke = _css_color(color) if line_width else None
        _call("rect", target.x, target.y, target.width, target.height, fill, stroke, line_width)
        return target

    def circle(self, surface: Surface, color: object, center: object, radius: float, width: int = 0) -> Rect:
        x, y = _pair(center)
        line_width = max(0, int(width))
        fill = None if line_width else _css_color(color)
        stroke = _css_color(color) if line_width else None
        _call("circle", x, y, radius, fill, stroke, line_width)
        return Rect(x - radius, y - radius, radius * 2, radius * 2)

    def line(self, surface: Surface, color: object, start_pos: object, end_pos: object, width: int = 1) -> Rect:
        x1, y1 = _pair(start_pos)
        x2, y2 = _pair(end_pos)
        _call("line", x1, y1, x2, y2, _css_color(color), width)
        return Rect(min(x1, x2), min(y1, y2), abs(x2 - x1), abs(y2 - y1))


class _TextSurface:
    def __init__(self, message: str, color: object, size: int, bold: bool = False) -> None:
        self.message = message
        self.color = _css_color(color)
        self.size = int(size)
        self.bold = bold
        self.width = max(1, int(len(message) * self.size * 0.58))
        self.height = max(1, int(self.size * 1.25))

    def get_rect(self, **kwargs: object) -> Rect:
        rect = Rect(0, 0, self.width, self.height)
        for name, value in kwargs.items():
            setattr(rect, name, value)
        return rect

    def _draw_to(self, dest: object) -> None:
        rect = _destination_rect(dest, self.width, self.height)
        _call("text", self.message, rect.centerx, rect.centery, self.color, self.size, "center", self.bold)


class Font:
    def __init__(self, name: str | None, size: int, bold: bool = False, italic: bool = False) -> None:
        self.name = name
        self.size = int(size)
        self.bold = bold
        self.italic = italic

    def render(self, message: object, antialias: bool, color: object) -> _TextSurface:
        return _TextSurface(str(message), color, self.size, self.bold)


class _FontModule:
    def SysFont(self, name: str | None, size: int, bold: bool = False, italic: bool = False) -> Font:
        return Font(name, size, bold, italic)

    def Font(self, name: str | None, size: int) -> Font:
        return Font(name, size)


class _EventModule:
    def get(self) -> list[Event]:
        raw = _call("consumeEvents")
        items = json.loads(str(raw))
        events: list[Event] = []
        for item in items:
            event_type = KEYDOWN if item.get("type") == "keydown" else KEYUP
            events.append(Event(event_type, item.get("key")))
        return events


class _PressedKeys:
    def __getitem__(self, key: str) -> bool:
        return bool(_call("isKeyDown", key))


class _KeyModule:
    def get_pressed(self) -> _PressedKeys:
        return _PressedKeys()


class Clock:
    def __init__(self) -> None:
        self._last_fps = 60.0

    def tick(self, fps: int = 0) -> float:
        self._last_fps = float(fps or 60)
        return 1000.0 / self._last_fps

    def get_fps(self) -> float:
        return self._last_fps


class _TimeModule:
    Clock = Clock


def init() -> None:
    return None


def quit() -> None:
    return None


display = _DisplayModule()
draw = _DrawModule()
event = _EventModule()
font = _FontModule()
key = _KeyModule()
time = _TimeModule()
`;
  const pygameBridgeStub = `
from typing import Any, TypeAlias

ColorValue: TypeAlias = str | tuple[int, int, int] | tuple[int, int, int, int]
PointValue: TypeAlias = tuple[float, float] | list[float]

QUIT: str
KEYDOWN: str
KEYUP: str
K_LEFT: str
K_RIGHT: str
K_UP: str
K_DOWN: str
K_SPACE: str
K_a: str
K_d: str
K_r: str
K_s: str
K_w: str
SRCALPHA: int

class Event:
    type: str
    key: str | None
    def __init__(self, type: str, key: str | None = None) -> None: ...

class Rect:
    x: float
    y: float
    width: float
    height: float
    w: float
    h: float
    left: float
    right: float
    top: float
    bottom: float
    centerx: float
    centery: float
    center: tuple[float, float]
    topleft: tuple[float, float]
    def __init__(self, *args: Any) -> None: ...
    def copy(self) -> "Rect": ...
    def move_ip(self, dx: float, dy: float) -> None: ...
    def clamp_ip(self, bounds: "Rect") -> None: ...
    def collidepoint(self, x: float, y: float) -> bool: ...
    def colliderect(self, other: "Rect") -> bool: ...

class Surface:
    width: float
    height: float
    def __init__(self, size: PointValue, is_display: bool = False) -> None: ...
    def fill(self, color: ColorValue) -> None: ...
    def blit(self, source: object, dest: object) -> Rect: ...
    def get_rect(self, **kwargs: Any) -> Rect: ...

class _DisplayModule:
    def set_mode(self, size: PointValue) -> Surface: ...
    def set_caption(self, title: str) -> None: ...
    def flip(self) -> None: ...
    def update(self) -> None: ...

class _DrawModule:
    def rect(self, surface: Surface, color: ColorValue, rect: object, width: int = 0, border_radius: int = 0) -> Rect: ...
    def circle(self, surface: Surface, color: ColorValue, center: PointValue, radius: float, width: int = 0) -> Rect: ...
    def line(self, surface: Surface, color: ColorValue, start_pos: PointValue, end_pos: PointValue, width: int = 1) -> Rect: ...

class Font:
    def __init__(self, name: str | None, size: int, bold: bool = False, italic: bool = False) -> None: ...
    def render(self, message: object, antialias: bool, color: ColorValue) -> object: ...

class _FontModule:
    def SysFont(self, name: str | None, size: int, bold: bool = False, italic: bool = False) -> Font: ...
    def Font(self, name: str | None, size: int) -> Font: ...

class _EventModule:
    def get(self) -> list[Event]: ...

class _PressedKeys:
    def __getitem__(self, key: str) -> bool: ...

class _KeyModule:
    def get_pressed(self) -> _PressedKeys: ...

class Clock:
    def __init__(self) -> None: ...
    def tick(self, fps: int = 0) -> float: ...
    def get_fps(self) -> float: ...

class _TimeModule:
    Clock: type[Clock]

def init() -> None: ...
def quit() -> None: ...

display: _DisplayModule
draw: _DrawModule
event: _EventModule
font: _FontModule
key: _KeyModule
time: _TimeModule
`;
  const physicsBridgeSource = `
from __future__ import annotations

from dataclasses import dataclass, field
from math import sqrt
from typing import Iterable, Protocol


class RectLike(Protocol):
    left: float
    right: float
    top: float
    bottom: float


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


@dataclass
class CircleBody:
    x: float
    y: float
    radius: float
    vx: float = 0.0
    vy: float = 0.0
    bounce: float = 0.86
    friction: float = 0.992

    @property
    def position(self) -> tuple[float, float]:
        return self.x, self.y

    @position.setter
    def position(self, value: tuple[float, float]) -> None:
        self.x, self.y = float(value[0]), float(value[1])

    @property
    def velocity(self) -> tuple[float, float]:
        return self.vx, self.vy

    @velocity.setter
    def velocity(self, value: tuple[float, float]) -> None:
        self.vx, self.vy = float(value[0]), float(value[1])

    def set_velocity(self, vx: float, vy: float) -> None:
        self.vx = float(vx)
        self.vy = float(vy)

    def impulse(self, x: float, y: float) -> None:
        self.vx += float(x)
        self.vy += float(y)


@dataclass
class World:
    gravity: tuple[float, float] = (0.0, 120.0)
    bounds: tuple[float, float, float, float] = (0.0, 0.0, 640.0, 360.0)
    bodies: list[CircleBody] = field(default_factory=list)

    def add(self, body: CircleBody) -> CircleBody:
        self.bodies.append(body)
        return body

    def remove(self, body: CircleBody) -> None:
        if body in self.bodies:
            self.bodies.remove(body)

    def step(self, dt: float, substeps: int = 2) -> None:
        dt = max(0.0, min(0.05, float(dt)))
        steps = max(1, int(substeps))
        step_dt = dt / steps
        for _ in range(steps):
            for body in list(self.bodies):
                self._step_body(body, step_dt)

    def _step_body(self, body: CircleBody, dt: float) -> None:
        gx, gy = self.gravity
        body.vx += gx * dt
        body.vy += gy * dt
        body.x += body.vx * dt
        body.y += body.vy * dt
        body.vx *= body.friction
        body.vy *= body.friction
        self._collide_bounds(body)

    def _collide_bounds(self, body: CircleBody) -> None:
        left, top, width, height = self.bounds
        right = left + width
        bottom = top + height

        if body.x - body.radius < left:
            body.x = left + body.radius
            body.vx = abs(body.vx) * body.bounce
        elif body.x + body.radius > right:
            body.x = right - body.radius
            body.vx = -abs(body.vx) * body.bounce

        if body.y - body.radius < top:
            body.y = top + body.radius
            body.vy = abs(body.vy) * body.bounce
        elif body.y + body.radius > bottom:
            body.y = bottom - body.radius
            body.vy = -abs(body.vy) * body.bounce


def circle_overlaps_rect(body: CircleBody, rect: RectLike) -> bool:
    closest_x = _clamp(body.x, float(rect.left), float(rect.right))
    closest_y = _clamp(body.y, float(rect.top), float(rect.bottom))
    dx = body.x - closest_x
    dy = body.y - closest_y
    return dx * dx + dy * dy <= body.radius * body.radius


def bounce_circle_off_rect(body: CircleBody, rect: RectLike, bounce: float = 0.9) -> bool:
    if not circle_overlaps_rect(body, rect):
        return False

    distances = {
        "top": abs((float(rect.top) - body.radius) - body.y),
        "bottom": abs((float(rect.bottom) + body.radius) - body.y),
        "left": abs((float(rect.left) - body.radius) - body.x),
        "right": abs((float(rect.right) + body.radius) - body.x),
    }
    side = min(distances, key=distances.get)

    if side == "top":
        body.y = float(rect.top) - body.radius
        body.vy = -abs(body.vy) * bounce
    elif side == "bottom":
        body.y = float(rect.bottom) + body.radius
        body.vy = abs(body.vy) * bounce
    elif side == "left":
        body.x = float(rect.left) - body.radius
        body.vx = -abs(body.vx) * bounce
    else:
        body.x = float(rect.right) + body.radius
        body.vx = abs(body.vx) * bounce

    return True


def distance(left: tuple[float, float], right: tuple[float, float]) -> float:
    dx = float(left[0]) - float(right[0])
    dy = float(left[1]) - float(right[1])
    return sqrt(dx * dx + dy * dy)
`;
  const physicsBridgeStub = `
from typing import Protocol

class RectLike(Protocol):
    left: float
    right: float
    top: float
    bottom: float

class CircleBody:
    x: float
    y: float
    radius: float
    vx: float
    vy: float
    bounce: float
    friction: float
    position: tuple[float, float]
    velocity: tuple[float, float]
    def __init__(
        self,
        x: float,
        y: float,
        radius: float,
        vx: float = 0.0,
        vy: float = 0.0,
        bounce: float = 0.86,
        friction: float = 0.992,
    ) -> None: ...
    def set_velocity(self, vx: float, vy: float) -> None: ...
    def impulse(self, x: float, y: float) -> None: ...

class World:
    gravity: tuple[float, float]
    bounds: tuple[float, float, float, float]
    bodies: list[CircleBody]
    def __init__(
        self,
        gravity: tuple[float, float] = (0.0, 120.0),
        bounds: tuple[float, float, float, float] = (0.0, 0.0, 640.0, 360.0),
    ) -> None: ...
    def add(self, body: CircleBody) -> CircleBody: ...
    def remove(self, body: CircleBody) -> None: ...
    def step(self, dt: float, substeps: int = 2) -> None: ...

def circle_overlaps_rect(body: CircleBody, rect: RectLike) -> bool: ...
def bounce_circle_off_rect(body: CircleBody, rect: RectLike, bounce: float = 0.9) -> bool: ...
def distance(left: tuple[float, float], right: tuple[float, float]) -> float: ...
`;
  const codeMirrorUrls = {
    highlight: "https://esm.sh/@lezer/highlight@1",
    language: "https://esm.sh/@codemirror/language@6",
    state: "https://esm.sh/@codemirror/state@6",
    view: "https://esm.sh/@codemirror/view@6",
    python: "https://esm.sh/@codemirror/lang-python@6",
    cpp: "https://esm.sh/@codemirror/lang-cpp@6",
  };

  let pyodidePromise;
  let codeMirrorPromise;
  let runnoWasiPromise;
  let xtermPromise;
  let clangBaseFileSystemPromise;
  let canvasModuleReady = false;
  let canvasModulePromise;
  let pygameModuleReady = false;
  let pygameModulePromise;
  let pygameRuntimePromise;
  let mypyPromise;
  let dependencyPreloadChain = Promise.resolve();
  let nextRunnerId = 0;
  const gameStates = new Map();
  const capturedGameKeys = new Set([
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "KeyA",
    "KeyD",
    "KeyR",
    "KeyS",
    "KeyW",
    "Space",
  ]);

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

  function getGameContext(runnerId) {
    const widget = findRunnerById(runnerId);
    const demo = widget ? widget.closest("[data-python-game-demo]") : null;
    const canvas = demo ? demo.querySelector("[data-python-game-canvas]") : null;
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error("No game canvas is paired with this Python runner.");
    }

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("This browser could not create a 2D canvas context.");
    }

    return { canvas, context };
  }

  function shouldCaptureGameKey(event) {
    return capturedGameKeys.has(event.code);
  }

  function installGameInput(runnerId, canvas, state) {
    if (state.inputInstalled) {
      return;
    }

    if (!canvas.hasAttribute("tabindex")) {
      canvas.tabIndex = 0;
    }

    canvas.addEventListener("pointerdown", () => canvas.focus());
    canvas.addEventListener("keydown", (event) => {
      const key = event.code || event.key;
      if (shouldCaptureGameKey(event)) {
        event.preventDefault();
      }
      if (!event.repeat) {
        state.events.push({ type: "keydown", key });
      }
      state.keys.add(key);
    });
    canvas.addEventListener("keyup", (event) => {
      const key = event.code || event.key;
      if (shouldCaptureGameKey(event)) {
        event.preventDefault();
      }
      state.events.push({ type: "keyup", key });
      state.keys.delete(key);
    });
    window.addEventListener("blur", () => {
      state.keys.clear();
      state.events.length = 0;
    });
    state.inputInstalled = true;
  }

  function getGameState(runnerId) {
    const { canvas, context } = getGameContext(runnerId);
    let state = gameStates.get(String(runnerId));
    if (!state || state.canvas !== canvas) {
      state = {
        canvas,
        context,
        events: [],
        inputInstalled: false,
        keys: new Set(),
      };
      gameStates.set(String(runnerId), state);
    }
    installGameInput(runnerId, canvas, state);
    return state;
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

  window.__pythonRunnerPygameBridge = {
    setSize(runnerId, width, height) {
      const state = getGameState(runnerId);
      state.canvas.width = Math.max(1, Math.floor(numberOr(width, state.canvas.width)));
      state.canvas.height = Math.max(1, Math.floor(numberOr(height, state.canvas.height)));
    },

    setCaption(runnerId, title) {
      const state = getGameState(runnerId);
      state.canvas.setAttribute("aria-label", String(title || "Pygame game canvas"));
    },

    clear(runnerId, color) {
      const state = getGameState(runnerId);
      const { canvas, context } = state;
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = colorOr(color, "#000000");
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.restore();
    },

    rect(runnerId, x, y, width, height, fill, stroke, lineWidth) {
      const { context } = getGameState(runnerId);
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
        context.strokeStyle = colorOr(stroke, "#ffffff");
        context.lineWidth = Math.max(0.5, numberOr(lineWidth, 1));
        context.strokeRect(left, top, rectWidth, rectHeight);
      }
      context.restore();
    },

    circle(runnerId, x, y, radius, fill, stroke, lineWidth) {
      const { context } = getGameState(runnerId);
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
        context.strokeStyle = colorOr(stroke, "#ffffff");
        context.lineWidth = Math.max(0.5, numberOr(lineWidth, 1));
        context.stroke();
      }
      context.restore();
    },

    line(runnerId, x1, y1, x2, y2, color, width) {
      const { context } = getGameState(runnerId);
      context.save();
      context.strokeStyle = colorOr(color, "#ffffff");
      context.lineWidth = Math.max(0.5, numberOr(width, 1));
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      context.moveTo(numberOr(x1, 0), numberOr(y1, 0));
      context.lineTo(numberOr(x2, 0), numberOr(y2, 0));
      context.stroke();
      context.restore();
    },

    text(runnerId, message, x, y, color, size, align, bold) {
      const { context } = getGameState(runnerId);
      const textAlign = ["left", "center", "right"].includes(align) ? align : "center";
      const fontWeight = bold ? 700 : 400;
      context.save();
      context.fillStyle = colorOr(color, "#ffffff");
      context.font = `${fontWeight} ${Math.max(1, numberOr(size, 18))}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      context.textAlign = textAlign;
      context.textBaseline = "middle";
      context.fillText(String(message), numberOr(x, 0), numberOr(y, 0));
      context.restore();
    },

    consumeEvents(runnerId) {
      const state = getGameState(runnerId);
      const events = state.events.splice(0, state.events.length);
      return JSON.stringify(events);
    },

    clearInput(runnerId) {
      const state = getGameState(runnerId);
      state.events.length = 0;
      state.keys.clear();
    },

    isKeyDown(runnerId, key) {
      const state = getGameState(runnerId);
      return state.keys.has(String(key));
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
      pyodidePromise = loadScript()
        .then(() => window.loadPyodide())
        .catch((error) => {
          pyodidePromise = undefined;
          throw error;
        });
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
        import(codeMirrorUrls.cpp),
      ]).then(([highlight, language, state, view, pythonLanguage, cppLanguage]) => ({
        ...createDiagnosticTools(view.EditorView, view.Decoration, state.StateEffect, state.StateField),
        EditorView: view.EditorView,
        highlightStyle: createHighlightStyle(language.HighlightStyle, highlight.tags),
        cpp: cppLanguage.cpp,
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
            title: diagnostic.message || "Runner diagnostic",
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

  function sourceImportsModule(source, moduleName) {
    const escapedModuleName = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const importPattern = new RegExp(
      String.raw`(^|\n)\s*(?:from\s+${escapedModuleName}(?:\.|\s+import\s)|import\s+[^\n#]*\b${escapedModuleName}\b)`,
    );
    return importPattern.test(source);
  }


  function runnerUsesCanvasModule(widget) {
    return Boolean(widget.closest("[data-python-canvas-demo]"))
      || sourceImportsModule(getSource(widget), "browser_canvas");
  }

  function runnerUsesPygameModule(widget) {
    const source = getSource(widget);
    return isPygameGameRunner(widget)
      || sourceImportsModule(source, "pygame")
      || sourceImportsModule(source, "physics2d");
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

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function formatMypyOutput(text) {
    const mypyLocationPattern = new RegExp(
      `^${escapeRegExp(displayFilename)}:(\\d+)(?::(\\d+))?:\\s*(error|warning|note):\\s*(.*)$`,
    );

    return cleanRunnerOutput(text)
      .split("\n")
      .map((line) => {
        const match = mypyLocationPattern.exec(line);
        if (!match) {
          return line;
        }

        const [, lineNumber, columnNumber, severity, message] = match;
        const location = columnNumber ? `Line ${lineNumber}, Col ${columnNumber}` : `Line ${lineNumber}`;
        return `${location}: ${severity}: ${message}`;
      })
      .join("\n")
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
        cpp,
        highlightStyle,
        lineNumbers,
        python,
        setDiagnosticsEffect,
        syntaxHighlighting,
      } = await getCodeMirror();
      if (!widget.isConnected) {
        return;
      }

      const languageExtension = widget.matches("[data-c-runner], [data-c-terminal-runner]") ? cpp() : python();
      widget.pythonRunnerDiagnosticsEffect = setDiagnosticsEffect;
      widget.pythonRunnerEditor = new EditorView({
        doc: codeElement.textContent,
        parent: editorHost,
        extensions: [
          lineNumbers(),
          languageExtension,
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
`))
        .catch((error) => {
          mypyPromise = undefined;
          throw error;
        });
    }
    return mypyPromise;
  }

  async function ensureCanvasModule(pyodide) {
    if (canvasModuleReady) {
      return;
    }
    if (!canvasModulePromise) {
      canvasModulePromise = (async () => {
        pyodide.FS.writeFile(canvasModuleFilename, canvasBridgeSource.trimStart());
        pyodide.FS.writeFile(canvasStubFilename, canvasBridgeStub.trimStart());
        await pyodide.runPythonAsync(`
import sys
if "/tmp" not in sys.path:
    sys.path.insert(0, "/tmp")
`);
        canvasModuleReady = true;
      })().catch((error) => {
        canvasModulePromise = undefined;
        throw error;
      });
    }
    return canvasModulePromise;
  }

  async function ensurePygameModule(pyodide) {
    if (pygameModuleReady) {
      return;
    }
    if (!pygameModulePromise) {
      pygameModulePromise = (async () => {
        pyodide.FS.writeFile(pygameModuleFilename, pygameBridgeSource.trimStart());
        pyodide.FS.writeFile(pygameStubFilename, pygameBridgeStub.trimStart());
        pyodide.FS.writeFile(physicsModuleFilename, physicsBridgeSource.trimStart());
        pyodide.FS.writeFile(physicsStubFilename, physicsBridgeStub.trimStart());
        await pyodide.runPythonAsync(`
import sys
if "/tmp" not in sys.path:
    sys.path.insert(0, "/tmp")
`);
        pygameModuleReady = true;
      })().catch((error) => {
        pygameModulePromise = undefined;
        throw error;
      });
    }
    return pygameModulePromise;
  }

  async function getPygameRuntime(pyodide) {
    await ensurePygameModule(pyodide);
    if (!pygameRuntimePromise) {
      pygameRuntimePromise = pyodide.runPythonAsync(`
import contextlib
import io
import json
import traceback
from typing import Any

__python_runner_games: dict[str, dict[str, Any]] = {}


def __python_runner_diagnostic_from_syntax(error: SyntaxError) -> dict[str, object]:
    line = error.lineno or 1
    column = error.offset or 1
    return {
        "line": line,
        "column": column,
        "endLine": error.end_lineno or line,
        "endColumn": error.end_offset or (column + 1),
        "message": f"{type(error).__name__}: {error.msg}",
        "severity": "error",
        "source": "syntax",
    }


def __python_runner_diagnostics_from_error(error: BaseException, filename: str) -> list[dict[str, object]]:
    diagnostics: list[dict[str, object]] = []
    for frame in traceback.extract_tb(error.__traceback__):
        if frame.filename == filename:
            diagnostics.append({
                "line": frame.lineno,
                "column": 1,
                "message": f"{type(error).__name__}: {error}",
                "severity": "error",
                "source": "runtime",
            })
    return diagnostics


def __python_runner_result(stdout: io.StringIO, stderr: io.StringIO, failed: bool, diagnostics: list[dict[str, object]]) -> tuple[str, str, bool, str]:
    return stdout.getvalue(), stderr.getvalue(), failed, json.dumps(diagnostics)


def __python_runner_register_game(runner_id: str, source: str, filename: str) -> tuple[str, str, bool, str]:
    stdout = io.StringIO()
    stderr = io.StringIO()
    failed = False
    diagnostics: list[dict[str, object]] = []
    namespace: dict[str, Any] = {
        "__name__": "__main__",
        "__python_game_runner_id": str(runner_id),
    }

    try:
        code = compile(source, filename, "exec")
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exec(code, namespace)
    except SyntaxError as error:
        failed = True
        traceback.print_exc(file=stderr)
        diagnostics.append(__python_runner_diagnostic_from_syntax(error))
    except Exception as error:
        failed = True
        traceback.print_exc(file=stderr)
        diagnostics.extend(__python_runner_diagnostics_from_error(error, filename))

    update = namespace.get("update")
    draw = namespace.get("draw")
    if not failed and (not callable(update) or not callable(draw)):
        failed = True
        stderr.write("Pygame browser examples must define update(dt) and draw() functions.\\n")

    if not failed:
        namespace["__python_runner_filename"] = filename
        __python_runner_games[str(runner_id)] = namespace
    else:
        __python_runner_games.pop(str(runner_id), None)

    return __python_runner_result(stdout, stderr, failed, diagnostics)


def __python_runner_step_game(runner_id: str, dt: float) -> tuple[str, str, bool, str]:
    stdout = io.StringIO()
    stderr = io.StringIO()
    failed = False
    diagnostics: list[dict[str, object]] = []
    namespace = __python_runner_games.get(str(runner_id))

    if namespace is None:
        failed = True
        stderr.write("This pygame example is not running. Press Run to start it.\\n")
        return __python_runner_result(stdout, stderr, failed, diagnostics)

    try:
        update = namespace["update"]
        draw = namespace["draw"]
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            update(float(dt))
            draw()
    except Exception as error:
        failed = True
        traceback.print_exc(file=stderr)
        diagnostics.extend(
            __python_runner_diagnostics_from_error(
                error,
                str(namespace.get("__python_runner_filename", "${displayFilename}")),
            )
        )

    return __python_runner_result(stdout, stderr, failed, diagnostics)


def __python_runner_stop_game(runner_id: str) -> None:
    __python_runner_games.pop(str(runner_id), None)
`)
        .then(() => ({
          registerGame: pyodide.globals.get("__python_runner_register_game"),
          stepGame: pyodide.globals.get("__python_runner_step_game"),
          stopGame: pyodide.globals.get("__python_runner_stop_game"),
        }))
        .catch((error) => {
          pygameRuntimePromise = undefined;
          throw error;
        });
    }
    return pygameRuntimePromise;
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
      output: formatMypyOutput([stdout, stderr].filter(Boolean).join("\n")),
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

  function isPygameGameRunner(widget) {
    return Boolean(widget.closest("[data-python-game-demo]"));
  }

  function runnerResultFromPython(result) {
    const values = result && typeof result.toJs === "function" ? result.toJs() : result;
    if (result && typeof result.destroy === "function") {
      result.destroy();
    }

    const [stdout = "", stderr = "", failed = false, diagnosticsJson = "[]"] = values;
    return {
      diagnostics: JSON.parse(diagnosticsJson || "[]"),
      failed: Boolean(failed),
      output: cleanRunnerOutput([stdout, stderr].filter(Boolean).join("\n")),
    };
  }

  function stopPygameGame(widget) {
    if (widget.pythonRunnerGameAnimationFrame) {
      window.cancelAnimationFrame(widget.pythonRunnerGameAnimationFrame);
      widget.pythonRunnerGameAnimationFrame = undefined;
    }

    const runtime = widget.pythonRunnerGameRuntime;
    if (runtime && runtime.stopGame) {
      try {
        runtime.stopGame(ensureRunnerId(widget));
      } catch (error) {
        console.warn("Failed to stop pygame runner.", error);
      }
    }
    widget.pythonRunnerGameRuntime = undefined;
  }

  function appendGameOutput(widget, output, text) {
    if (!text) {
      return;
    }

    const previous = widget.pythonRunnerGameOutput || "";
    const combined = cleanRunnerOutput([previous, text].filter(Boolean).join("\n"));
    widget.pythonRunnerGameOutput = combined.length > 5000 ? combined.slice(-5000) : combined;
    outputText(output, widget.pythonRunnerGameOutput, false);
  }

  function startPygameLoop(widget, runtime, output) {
    const runnerId = ensureRunnerId(widget);
    let lastTime;

    const step = (now) => {
      if (!widget.isConnected || widget.pythonRunnerGameRuntime !== runtime) {
        return;
      }

      const dt = lastTime === undefined ? 1 / 60 : Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const frameResult = runnerResultFromPython(runtime.stepGame(runnerId, dt));
      if (frameResult.failed) {
        setEditorDiagnostics(widget, frameResult.diagnostics);
        outputText(output, frameResult.output || "The pygame loop stopped.", true);
        stopPygameGame(widget);
        return;
      }

      appendGameOutput(widget, output, frameResult.output);
      widget.pythonRunnerGameAnimationFrame = window.requestAnimationFrame(step);
    };

    widget.pythonRunnerGameAnimationFrame = window.requestAnimationFrame(step);
  }

  function executePygameGame(code, widget, runtime) {
    const runnerId = ensureRunnerId(widget);
    stopPygameGame(widget);
    widget.pythonRunnerGameRuntime = runtime;
    window.__pythonRunnerPygameBridge.clearInput(runnerId);

    const registerResult = runnerResultFromPython(
      runtime.registerGame(runnerId, code, displayFilename),
    );
    if (registerResult.failed) {
      return registerResult;
    }

    const output = cleanRunnerOutput([
      registerResult.output,
      "Game running. Click the canvas, then use WASD or arrow keys.",
    ].filter(Boolean).join("\n"));
    widget.pythonRunnerGameOutput = output;
    startPygameLoop(widget, runtime, widget.querySelector(".python-runner__output"));

    return {
      diagnostics: [],
      failed: false,
      output,
    };
  }


  async function getRunnoWasi() {
    if (!runnoWasiPromise) {
      runnoWasiPromise = import(runnoWasiUrl)
        .then((module) => {
          if (!module.WASI) {
            throw new Error("Runno WASI did not export a WASI runtime.");
          }
          return module.WASI;
        })
        .catch((error) => {
          runnoWasiPromise = undefined;
          throw error;
        });
    }
    return runnoWasiPromise;
  }

  function ensureXTermStyles() {
    if (document.querySelector(`link[href="${xtermCssUrl}"]`)) {
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = xtermCssUrl;
    link.crossOrigin = "anonymous";
    link.dataset.cTerminalRunnerXtermCss = "true";
    document.head.append(link);
  }

  async function getXTerm() {
    if (!xtermPromise) {
      ensureXTermStyles();
      xtermPromise = import(xtermModuleUrl)
        .then((module) => {
          if (!module.Terminal) {
            throw new Error("XTerm.js did not export a Terminal constructor.");
          }
          return module.Terminal;
        })
        .catch((error) => {
          xtermPromise = undefined;
          throw error;
        });
    }
    return xtermPromise;
  }

  async function gunzipBytes(bytes) {
    if (typeof DecompressionStream === "undefined") {
      throw new Error("This browser does not support the built-in gzip decompressor needed by c_runner.");
    }

    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function tarString(bytes, offset, length) {
    let end = offset;
    const limit = offset + length;
    while (end < limit && bytes[end] !== 0) {
      end += 1;
    }
    return new TextDecoder().decode(bytes.subarray(offset, end)).trim();
  }

  function tarOctal(bytes, offset, length) {
    const text = tarString(bytes, offset, length).replace(/\0.*$/, "").trim();
    return text ? Number.parseInt(text, 8) : 0;
  }

  function normalizeTarPath(name) {
    const clean = name.replace(/^\.\//, "").replace(/^\/+/, "");
    return clean ? `/${clean}` : "";
  }

  function extractTarFileSystem(bytes) {
    const fileSystem = {};
    const decoder = new TextDecoder();

    for (let offset = 0; offset + 512 <= bytes.length;) {
      const header = bytes.subarray(offset, offset + 512);
      if (header.every((value) => value === 0)) {
        break;
      }

      const name = tarString(header, 0, 100);
      const size = tarOctal(header, 124, 12);
      const mtime = tarOctal(header, 136, 12);
      const type = decoder.decode(header.subarray(156, 157));
      const prefix = tarString(header, 345, 155);
      const fullName = prefix ? `${prefix}/${name}` : name;
      const path = normalizeTarPath(fullName);
      const contentStart = offset + 512;
      const contentEnd = contentStart + size;

      if (path && (type === "" || type === "0")) {
        const timestamp = mtime ? new Date(mtime * 1000) : new Date();
        fileSystem[path] = {
          path,
          content: bytes.slice(contentStart, contentEnd),
          mode: "binary",
          timestamps: {
            access: timestamp,
            change: timestamp,
            modification: timestamp,
          },
        };
      }

      offset = contentStart + Math.ceil(size / 512) * 512;
    }

    return fileSystem;
  }

  async function fetchTarGzFileSystem(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    const compressed = new Uint8Array(await response.arrayBuffer());
    return extractTarFileSystem(await gunzipBytes(compressed));
  }

  async function getClangBaseFileSystem() {
    if (!clangBaseFileSystemPromise) {
      clangBaseFileSystemPromise = fetchTarGzFileSystem(`${cRunnerBaseUrl}/clang-fs.tar.gz`)
        .catch((error) => {
          clangBaseFileSystemPromise = undefined;
          throw error;
        });
    }
    return clangBaseFileSystemPromise;
  }

  function cloneWasiFile(file) {
    const timestamps = file.timestamps || {};
    let content = file.content;
    if (file.mode === "binary") {
      content = content instanceof Uint8Array ? new Uint8Array(content) : new Uint8Array(content || []);
    }

    return {
      ...file,
      content,
      timestamps: {
        access: timestamps.access ? new Date(timestamps.access) : new Date(),
        change: timestamps.change ? new Date(timestamps.change) : new Date(),
        modification: timestamps.modification ? new Date(timestamps.modification) : new Date(),
      },
    };
  }

  function cloneWasiFileSystem(fileSystem) {
    return Object.fromEntries(
      Object.entries(fileSystem).map(([path, file]) => [path, cloneWasiFile(file)]),
    );
  }

  function createWasiTextFile(path, content) {
    const timestamp = new Date();
    return {
      path,
      content,
      mode: "string",
      timestamps: {
        access: timestamp,
        change: timestamp,
        modification: timestamp,
      },
    };
  }

  function createStdinReader(stdin) {
    const bytes = new TextEncoder().encode(stdin || "");
    const decoder = new TextDecoder();
    let offset = 0;

    return (byteLength) => {
      if (offset >= bytes.length) {
        return null;
      }
      const end = Math.min(bytes.length, offset + Math.max(1, byteLength));
      const chunk = decoder.decode(bytes.subarray(offset, end));
      offset = end;
      return chunk;
    };
  }

  function binaryResponseFromFile(file) {
    if (!file) {
      throw new Error(`${cWasmFilename} was not produced by the C linker.`);
    }
    const bytes = file.mode === "binary"
      ? file.content
      : new TextEncoder().encode(String(file.content || ""));
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/wasm",
      },
    });
  }

  async function runWasiCommand(WASI, command, fileSystem, stdin) {
    const stdout = [];
    const stderr = [];
    const binary = command.binaryURL
      ? fetch(command.binaryURL)
      : Promise.resolve(binaryResponseFromFile(fileSystem[command.fsPath]));
    const result = await WASI.start(binary, {
      args: [command.binaryName, ...(command.args || [])],
      env: command.env || {},
      fs: fileSystem,
      stdin: createStdinReader(stdin),
      stdout: (text) => stdout.push(text),
      stderr: (text) => stderr.push(text),
    });

    return {
      exitCode: Number(result.exitCode || 0),
      fs: result.fs,
      stderr: stderr.join(""),
      stdout: stdout.join(""),
    };
  }

  function stripAnsi(text) {
    return String(text || "").replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
  }

  function cleanCOutput(text) {
    return stripAnsi(text)
      .split(cSourceFilename).join(cDisplayFilename)
      .replace(/^\s+|\s+$/g, "");
  }

  function parseCCompilerDiagnostics(text) {
    const diagnostics = [];
    const pattern = /(?:^|\n)(?:\/)?program\.c:(\d+):(\d+):\s*(error|warning|note):\s*([^\n]+)/g;
    const cleaned = cleanCOutput(text);
    let match;

    while ((match = pattern.exec(cleaned)) !== null) {
      const severity = match[3] === "note" ? "info" : match[3];
      diagnostics.push({
        line: Number(match[1]),
        column: Number(match[2]),
        message: `clang: ${match[4]}`,
        severity,
        source: "clang",
      });
    }

    return diagnostics;
  }

  function getCStdin(widget) {
    const stdin = widget.querySelector("[data-c-runner-stdin]");
    return stdin ? stdin.value : "";
  }

  function cCompileCommand() {
    return {
      binaryURL: `${cRunnerBaseUrl}/clang.wasm`,
      binaryName: "clang",
      args: [
        "-cc1",
        "-Werror",
        "-triple",
        "wasm32-unkown-wasi",
        "-isysroot",
        "/sys",
        "-internal-isystem",
        "/sys/include",
        "-internal-isystem",
        "/sys/lib/clang/8.0.1/include",
        "-ferror-limit",
        "4",
        "-fmessage-length",
        "80",
        "-fno-color-diagnostics",
        "-O2",
        "-emit-obj",
        "-o",
        cObjectFilename,
        cSourceFilename,
      ],
    };
  }

  function cLinkCommand() {
    return {
      binaryURL: `${cRunnerBaseUrl}/wasm-ld.wasm`,
      binaryName: "wasm-ld",
      args: [
        "--no-threads",
        "--export-dynamic",
        "-z",
        "stack-size=1048576",
        "-L/sys/lib/wasm32-wasi",
        "/sys/lib/wasm32-wasi/crt1.o",
        cObjectFilename,
        "-lc",
        "-o",
        cWasmFilename,
      ],
    };
  }

  function cProgramCommand() {
    return {
      fsPath: cWasmFilename,
      binaryName: "program",
    };
  }

  function cFailureResult(commandResult, fallbackOutput, diagnostics) {
    return {
      diagnostics: diagnostics || [],
      failed: true,
      output: cleanCOutput([
        commandResult.stdout,
        commandResult.stderr,
      ].filter(Boolean).join("\n")) || fallbackOutput,
    };
  }

  function wasiFileBytes(file) {
    if (!file) {
      throw new Error(`${cWasmFilename} was not produced by the C linker.`);
    }
    if (file.mode === "binary") {
      return file.content instanceof Uint8Array
        ? new Uint8Array(file.content)
        : new Uint8Array(file.content || []);
    }
    return new TextEncoder().encode(String(file.content || ""));
  }

  async function compileC(code) {
    const WASI = await getRunnoWasi();
    const baseFileSystem = cloneWasiFileSystem(await getClangBaseFileSystem());
    let fileSystem = {
      ...baseFileSystem,
      [cSourceFilename]: createWasiTextFile(cSourceFilename, code),
    };

    const compileResult = await runWasiCommand(WASI, cCompileCommand(), fileSystem, "");
    fileSystem = compileResult.fs;
    if (compileResult.exitCode !== 0) {
      const compilerOutput = [compileResult.stdout, compileResult.stderr].filter(Boolean).join("\n");
      return cFailureResult(
        compileResult,
        `C compilation failed with exit code ${compileResult.exitCode}.`,
        parseCCompilerDiagnostics(compilerOutput),
      );
    }

    const linkResult = await runWasiCommand(WASI, cLinkCommand(), fileSystem, "");
    fileSystem = linkResult.fs;
    if (linkResult.exitCode !== 0) {
      return cFailureResult(
        linkResult,
        `C linking failed with exit code ${linkResult.exitCode}.`,
        [],
      );
    }

    return {
      diagnostics: [],
      failed: false,
      fileSystem,
      output: "",
      wasmBytes: wasiFileBytes(fileSystem[cWasmFilename]),
    };
  }

  async function executeC(code, stdin) {
    const WASI = await getRunnoWasi();
    const compileResult = await compileC(code);
    if (compileResult.failed) {
      return compileResult;
    }

    const executionResult = await runWasiCommand(
      WASI,
      cProgramCommand(),
      compileResult.fileSystem,
      stdin,
    );
    const outputParts = [executionResult.stdout, executionResult.stderr].filter(Boolean);
    if (executionResult.exitCode !== 0) {
      outputParts.push(`Process exited with code ${executionResult.exitCode}.`);
    }

    return {
      diagnostics: [],
      failed: executionResult.exitCode !== 0,
      output: cleanCOutput(outputParts.join("\n")),
    };
  }

  async function runC(widget) {
    const button = widget.querySelector(".python-runner__run");
    const output = widget.querySelector(".python-runner__output");
    const code = getSource(widget);

    button.disabled = true;
    setEditorDiagnostics(widget, []);
    outputText(output, "Loading C compiler...", false);

    try {
      outputText(output, "Compiling C...", false);
      const result = await executeC(code, getCStdin(widget));
      setEditorDiagnostics(widget, result.diagnostics);
      outputText(output, result.output, result.failed);
    } catch (error) {
      outputText(output, error && error.stack ? error.stack : String(error), true);
    } finally {
      button.disabled = false;
    }
  }

  function hasSharedTerminalSupport() {
    return typeof SharedArrayBuffer !== "undefined" && window.crossOriginIsolated;
  }

  function cTerminalIsolationMessage() {
    return [
      "Interactive C stdin requires SharedArrayBuffer.",
      "Serve this page with Cross-Origin-Opener-Policy: same-origin and",
      "Cross-Origin-Embedder-Policy: credentialless or require-corp.",
    ].join("\n");
  }

  async function ensureCTerminal(widget) {
    if (widget.cTerminalRunnerTerminal) {
      return widget.cTerminalRunnerTerminal;
    }

    const host = widget.querySelector("[data-c-terminal-runner-terminal]");
    if (!host) {
      throw new Error("No terminal host was rendered for this c_terminal_runner.");
    }

    const Terminal = await getXTerm();
    const terminal = new Terminal({
      allowProposedApi: false,
      cols: 80,
      convertEol: true,
      cursorBlink: true,
      fontFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: 14,
      rows: 18,
      scrollback: 1000,
      theme: {
        background: "#0b1020",
        cursor: "#f8fafc",
        foreground: "#e5edf7",
        selectionBackground: "#334155",
      },
    });

    host.textContent = "";
    terminal.open(host);
    terminal.onData((data) => handleCTerminalData(widget, data));
    host.addEventListener("pointerdown", () => window.setTimeout(() => terminal.focus(), 0));

    widget.cTerminalRunnerTerminal = terminal;
    widget.cTerminalRunnerTranscript = "";
    widget.cTerminalRunnerInputBuffer = "";
    return terminal;
  }

  function normalizeTerminalText(text) {
    return String(text || "").replace(/\r\n|\r|\n/g, "\r\n");
  }

  function writeCTerminal(widget, text, options = {}) {
    const value = String(text || "");
    widget.cTerminalRunnerTranscript = `${widget.cTerminalRunnerTranscript || ""}${stripAnsi(value)}`;
    const terminal = widget.cTerminalRunnerTerminal;
    if (!terminal) {
      return;
    }

    const normalized = normalizeTerminalText(value);
    if (options.stderr) {
      terminal.write(`\x1b[31m${normalized}\x1b[0m`);
    } else if (options.dim) {
      terminal.write(`\x1b[2m${normalized}\x1b[0m`);
    } else {
      terminal.write(normalized);
    }
  }

  function createTerminalInputBuffer() {
    const sharedBuffer = new SharedArrayBuffer(cTerminalInputHeaderBytes + cTerminalInputCapacity);
    return {
      bytes: new Uint8Array(sharedBuffer, cTerminalInputHeaderBytes),
      control: new Int32Array(sharedBuffer, 0, 4),
      sharedBuffer,
    };
  }

  function notifyTerminalInput(input) {
    Atomics.add(input.control, 3, 1);
    Atomics.notify(input.control, 3);
  }

  function writeTerminalInput(widget, text) {
    const input = widget.cTerminalRunnerInput;
    if (!input) {
      return;
    }

    const encoded = new TextEncoder().encode(text);
    const { bytes, control } = input;
    const capacity = bytes.length;
    let writeIndex = Atomics.load(control, 0);
    let readIndex = Atomics.load(control, 1);
    let dropped = false;

    for (const byte of encoded) {
      const nextWriteIndex = (writeIndex + 1) % capacity;
      if (nextWriteIndex === readIndex) {
        dropped = true;
        break;
      }
      bytes[writeIndex] = byte;
      writeIndex = nextWriteIndex;
      Atomics.store(control, 0, writeIndex);
      readIndex = Atomics.load(control, 1);
    }

    notifyTerminalInput(input);
    if (dropped) {
      writeCTerminal(widget, "\n[input buffer full]\n", { stderr: true });
    }
  }

  function closeTerminalInput(input) {
    if (!input) {
      return;
    }
    Atomics.store(input.control, 2, 1);
    notifyTerminalInput(input);
  }

  function handleCTerminalData(widget, data) {
    if (!widget.cTerminalRunnerInput) {
      return;
    }
    if (data.startsWith("\x1b")) {
      return;
    }

    let line = widget.cTerminalRunnerInputBuffer || "";
    for (const char of data) {
      if (char === "\u0003") {
        stopCTerminalRun(widget, "^C");
        line = "";
        continue;
      }

      if (char === "\r" || char === "\n") {
        writeCTerminal(widget, "\n");
        writeTerminalInput(widget, `${line}\n`);
        line = "";
        continue;
      }

      if (char === "\u007f") {
        if (line.length > 0) {
          line = line.slice(0, -1);
          widget.cTerminalRunnerTerminal.write("\b \b");
        }
        continue;
      }

      if (char === "\t" || char >= " ") {
        line += char;
        writeCTerminal(widget, char);
      }
    }
    widget.cTerminalRunnerInputBuffer = line;
  }

  function resetCTerminalRunState(widget) {
    closeTerminalInput(widget.cTerminalRunnerInput);
    if (widget.cTerminalRunnerWorker) {
      widget.cTerminalRunnerWorker.terminate();
    }
    widget.cTerminalRunnerInput = null;
    widget.cTerminalRunnerInputBuffer = "";
    widget.cTerminalRunnerWorker = null;

    const button = widget.querySelector(".python-runner__run");
    if (button) {
      button.disabled = false;
      button.textContent = "Run";
    }
  }

  function stopCTerminalRun(widget, message) {
    const worker = widget.cTerminalRunnerWorker;
    closeTerminalInput(widget.cTerminalRunnerInput);
    if (worker) {
      worker.terminate();
    }
    resetCTerminalRunState(widget);
    if (message) {
      writeCTerminal(widget, `${message}\n`, { dim: true });
    }
  }

  function createCTerminalWorker() {
    const source = `
const textDecoder = new TextDecoder();

function createBlockingStdinReader(sharedBuffer) {
  const control = new Int32Array(sharedBuffer, 0, 4);
  const bytes = new Uint8Array(sharedBuffer, ${cTerminalInputHeaderBytes});
  const capacity = bytes.length;

  return (byteLength) => {
    const requested = Math.max(1, Number(byteLength) || 1);
    const output = [];

    while (output.length === 0) {
      let readIndex = Atomics.load(control, 1);
      const writeIndex = Atomics.load(control, 0);

      while (readIndex !== writeIndex && output.length < requested) {
        output.push(bytes[readIndex]);
        readIndex = (readIndex + 1) % capacity;
      }

      if (output.length > 0) {
        Atomics.store(control, 1, readIndex);
        break;
      }

      if (Atomics.load(control, 2) === 1) {
        return null;
      }

      const version = Atomics.load(control, 3);
      Atomics.wait(control, 3, version);
    }

    return textDecoder.decode(new Uint8Array(output));
  };
}

self.onmessage = async (event) => {
  if (!event.data || event.data.type !== "run") {
    return;
  }

  try {
    const module = await import(event.data.runnoWasiUrl);
    if (!module.WASI) {
      throw new Error("Runno WASI did not export a WASI runtime.");
    }

    const wasmBytes = event.data.wasmBytes instanceof Uint8Array
      ? event.data.wasmBytes
      : new Uint8Array(event.data.wasmBytes);
    const response = Promise.resolve(new Response(wasmBytes, {
      headers: { "Content-Type": "application/wasm" },
    }));

    const result = await module.WASI.start(response, {
      args: ["program"],
      env: {},
      fs: {},
      stdin: createBlockingStdinReader(event.data.sharedBuffer),
      stdout: (text) => self.postMessage({ type: "stdout", text }),
      stderr: (text) => self.postMessage({ type: "stderr", text }),
    });

    self.postMessage({ type: "exit", exitCode: Number(result.exitCode || 0) });
  } catch (error) {
    self.postMessage({
      type: "error",
      message: error && error.stack ? error.stack : String(error),
    });
  }
};
`;

    const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
    const worker = new Worker(url, { type: "module" });
    URL.revokeObjectURL(url);
    return worker;
  }

  function finishCTerminalRun(widget, exitCode) {
    resetCTerminalRunState(widget);
    writeCTerminal(widget, `\nProcess exited with code ${exitCode}.\n`, {
      stderr: exitCode !== 0,
    });
  }

  async function runCTerminal(widget) {
    const button = widget.querySelector(".python-runner__run");
    const output = widget.querySelector(".python-runner__output");
    const code = getSource(widget);

    stopCTerminalRun(widget);
    setEditorDiagnostics(widget, []);

    if (!hasSharedTerminalSupport()) {
      outputText(output, cTerminalIsolationMessage(), true);
      return;
    }

    button.disabled = true;
    output.hidden = true;
    output.classList.remove("is-error");

    try {
      const terminal = await ensureCTerminal(widget);
      terminal.reset();
      widget.cTerminalRunnerTranscript = "";
      writeCTerminal(widget, "Compiling C...\n", { dim: true });

      const compileResult = await compileC(code);
      setEditorDiagnostics(widget, compileResult.diagnostics || []);
      if (compileResult.failed) {
        outputText(output, compileResult.output, true);
        writeCTerminal(widget, `${compileResult.output}\n`, { stderr: true });
        resetCTerminalRunState(widget);
        return;
      }

      const input = createTerminalInputBuffer();
      const worker = createCTerminalWorker();
      widget.cTerminalRunnerInput = input;
      widget.cTerminalRunnerWorker = worker;
      widget.cTerminalRunnerInputBuffer = "";

      worker.onmessage = (event) => {
        const message = event.data || {};
        if (message.type === "stdout") {
          writeCTerminal(widget, message.text);
        } else if (message.type === "stderr") {
          writeCTerminal(widget, message.text, { stderr: true });
        } else if (message.type === "exit") {
          finishCTerminalRun(widget, Number(message.exitCode || 0));
        } else if (message.type === "error") {
          outputText(output, message.message || "C terminal worker failed.", true);
          writeCTerminal(widget, `\n${message.message || "C terminal worker failed."}\n`, { stderr: true });
          resetCTerminalRunState(widget);
        }
      };
      worker.onerror = (event) => {
        const message = event.message || "C terminal worker failed.";
        outputText(output, message, true);
        writeCTerminal(widget, `\n${message}\n`, { stderr: true });
        resetCTerminalRunState(widget);
      };

      button.disabled = false;
      button.textContent = "Restart";
      terminal.focus();
      worker.postMessage({
        type: "run",
        runnoWasiUrl,
        sharedBuffer: input.sharedBuffer,
        wasmBytes: compileResult.wasmBytes,
      });
    } catch (error) {
      outputText(output, error && error.stack ? error.stack : String(error), true);
      resetCTerminalRunState(widget);
    }
  }

  function setRunnerPreloadState(widgets, state) {
    widgets.forEach((widget) => {
      if (widget.isConnected) {
        widget.dataset.pythonRunnerPreload = state;
      }
    });
  }

  async function preloadRunnerDependencies(widgets) {
    const runners = widgets.filter((widget) => widget.isConnected);
    if (!runners.length) {
      return;
    }

    setRunnerPreloadState(runners, "loading");
    try {
      const pyodide = await getPyodide();
      const needsCanvasModule = runners.some(runnerUsesCanvasModule);
      const needsPygameModule = runners.some(runnerUsesPygameModule);
      const hasGameRunner = runners.some(isPygameGameRunner);

      if (needsCanvasModule) {
        await ensureCanvasModule(pyodide);
      }
      if (hasGameRunner) {
        await getPygameRuntime(pyodide);
      } else if (needsPygameModule) {
        await ensurePygameModule(pyodide);
      }
      await ensureMypy(pyodide);

      setRunnerPreloadState(runners, "ready");
    } catch (error) {
      setRunnerPreloadState(runners, "error");
      console.warn("Python runner dependencies failed to preload; Run will try again.", error);
    }
  }

  function queueRunnerPreload(widgets) {
    const runners = widgets.filter((widget) => widget.isConnected);
    if (!runners.length) {
      return;
    }

    setRunnerPreloadState(runners, "loading");
    const preloadPromise = dependencyPreloadChain
      .catch(() => undefined)
      .then(() => preloadRunnerDependencies(runners));
    dependencyPreloadChain = preloadPromise.catch(() => undefined);

    runners.forEach((widget) => {
      widget.pythonRunnerPreloadPromise = preloadPromise;
    });
  }

  async function runPython(widget) {
    const button = widget.querySelector(".python-runner__run");
    const output = widget.querySelector(".python-runner__output");
    const code = getSource(widget);
    const isGame = isPygameGameRunner(widget);
    const needsCanvasModule = runnerUsesCanvasModule(widget);
    const needsPygameModule = runnerUsesPygameModule(widget);

    button.disabled = true;
    setEditorDiagnostics(widget, []);
    if (isGame) {
      stopPygameGame(widget);
    }
    outputText(output, "Loading Python...", false);

    try {
      if (widget.pythonRunnerPreloadPromise) {
        await widget.pythonRunnerPreloadPromise;
      }

      const pyodide = await getPyodide();
      outputText(output, "Checking syntax...", false);

      const syntaxResult = await checkSyntax(pyodide, code);
      if (syntaxResult.failed) {
        setEditorDiagnostics(widget, syntaxResult.diagnostics);
        outputText(output, syntaxResult.output, true);
        return;
      }

      outputText(output, "Preparing browser helpers...", false);
      if (needsCanvasModule) {
        await ensureCanvasModule(pyodide);
      }
      let gameRuntime = null;
      if (isGame) {
        gameRuntime = await getPygameRuntime(pyodide);
      } else if (needsPygameModule) {
        await ensurePygameModule(pyodide);
      }

      outputText(output, "Type checking...", false);
      const typeCheckResult = await typeCheckPython(pyodide, code);
      if (typeCheckResult.failed) {
        setEditorDiagnostics(widget, typeCheckResult.diagnostics);
        outputText(output, typeCheckResult.output || "Type checking failed.", true);
        return;
      }

      outputText(output, isGame ? "Starting game..." : "Running...", false);
      const executionResult = isGame
        ? executePygameGame(code, widget, gameRuntime)
        : await executePython(pyodide, code, widget);
      setEditorDiagnostics(widget, executionResult.diagnostics);
      outputText(output, executionResult.output, executionResult.failed);
    } catch (error) {
      outputText(output, error && error.stack ? error.stack : String(error), true);
    } finally {
      button.disabled = false;
    }
  }

  function initialize(root) {
    const widgets = Array.from(
      root.querySelectorAll("[data-python-runner]:not([data-python-runner-ready])"),
    );

    widgets.forEach((widget) => {
      ensureRunnerId(widget);
      widget.setAttribute("data-python-runner-ready", "true");
      installEditor(widget);
      widget.querySelector(".python-runner__run")
        .addEventListener("click", () => runPython(widget));
    });
    queueRunnerPreload(widgets);

    const cWidgets = Array.from(
      root.querySelectorAll("[data-c-runner]:not([data-c-runner-ready])"),
    );

    cWidgets.forEach((widget) => {
      widget.setAttribute("data-c-runner-ready", "true");
      installEditor(widget);
      widget.querySelector(".python-runner__run")
        .addEventListener("click", () => runC(widget));
    });

    const cTerminalWidgets = Array.from(
      root.querySelectorAll("[data-c-terminal-runner]:not([data-c-terminal-runner-ready])"),
    );

    cTerminalWidgets.forEach((widget) => {
      widget.setAttribute("data-c-terminal-runner-ready", "true");
      installEditor(widget);
      widget.querySelector(".python-runner__run")
        .addEventListener("click", () => runCTerminal(widget));
    });
  }

  document.addEventListener("DOMContentLoaded", () => initialize(document));

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(() => initialize(document));
  }

  initialize(document);
}());
