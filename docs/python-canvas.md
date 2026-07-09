---
title: Python Canvas Demo
description: A prototype runnable Python snippet that draws on an HTML canvas.
---

# Python drawing on an HTML canvas

This demo pairs a runnable Python snippet with a real HTML canvas. The browser provides a small typed `browser_canvas` module, and the snippet builds turtle-style movement in Python on top of it.

<div class="python-canvas-demo" data-python-canvas-demo markdown="1">

<canvas class="python-canvas-demo__canvas" data-python-runner-canvas width="720" height="420" aria-label="Python drawing canvas">
  Your browser does not support the canvas element.
</canvas>

```python { runnable=true }
from __future__ import annotations

from math import cos, radians, sin

from browser_canvas import circle, clear, line, rectangle, text


class Turtle:
    def __init__(self, x: float, y: float, heading: float = 0.0) -> None:
        self.x = x
        self.y = y
        self.heading = heading
        self.pen_is_down = True
        self.pen_color = "#2563eb"
        self.pen_width = 4.0

    def forward(self, distance: float) -> None:
        angle = radians(self.heading)
        next_x = self.x + cos(angle) * distance
        next_y = self.y - sin(angle) * distance
        if self.pen_is_down:
            line(self.x, self.y, next_x, next_y, self.pen_color, self.pen_width)
        self.x = next_x
        self.y = next_y

    def left(self, degrees: float) -> None:
        self.heading += degrees

    def right(self, degrees: float) -> None:
        self.heading -= degrees

    def penup(self) -> None:
        self.pen_is_down = False

    def pendown(self) -> None:
        self.pen_is_down = True

    def pencolor(self, color: str) -> None:
        self.pen_color = color

    def pensize(self, width: float) -> None:
        self.pen_width = width

    def goto(self, x: float, y: float) -> None:
        if self.pen_is_down:
            line(self.x, self.y, x, y, self.pen_color, self.pen_width)
        self.x = x
        self.y = y


clear("#f8fafc")
rectangle(0, 0, 720, 420, None, "#cbd5e1", 2)
text("Python -> HTML canvas", 360, 38, "#0f172a", 24)

colors: list[str] = ["#2563eb", "#059669", "#dc2626", "#7c3aed", "#d97706"]
turtle = Turtle(360, 218, 90)
turtle.pensize(3)

for step in range(96):
    turtle.pencolor(colors[step % len(colors)])
    turtle.forward(4 + step * 1.25)
    turtle.right(92)

circle(360, 218, 12, "#f59e0b", "#92400e", 2)
text("Edit the turtle code, then run it again.", 360, 386, "#334155", 16)
print("Drew a turtle-style spiral on the canvas.")
```

</div>
