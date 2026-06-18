---
title: Python Diagram Demo
description: Step through a small Python subset while a COMP 110 memory diagram is drawn.
---

# Python memory diagram stepper

This runner follows the Memory Diagram Rules handout for small Python examples with comments, docstrings, function definitions, assignments, `if`/`elif`/`else`, `while`, function calls, `return`, `print`, name resolution, comparisons, and arithmetic expressions.

```python_diagram_runner
# Edit this example, then step through the diagram.

def square(value: int) -> int:
    """Return value multiplied by itself."""
    return value * value

def add(left: int, right: int) -> int:
    return left + right

def score(total: int) -> int:
    """Count down while applying a tiny bonus rule."""
    current: int = total
    result: int = 0
    while current > 0:
        if current == 2:
            result = result + 10
        else:
            result = result + current
        current = current - 1
    return result

answer: int = add(square(3), score(3))
print(answer)
```
