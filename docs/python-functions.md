---
title: Runnable Python Demo
description: A CS1 introduction to Python function definitions with static type annotations.
---

# Function definitions with types

Functions let us name a small step in a program, then reuse it whenever we need that step again.
In Python, a function definition starts with `def`, names the parameters in parentheses, and uses `return` to send a value back.

Static type annotations are labels for people and tools. They say what kind of value a parameter should receive and what kind of value the function should return.

```python_runner
def add_tax(price: float, tax_rate: float) -> float:
    return price + price * tax_rate


total: float = add_tax(20.00, 0.075)
print(f"Total: ${total:.2f}")
```

The annotation `price: float` says `price` should be a decimal number. The arrow `-> float` says the function returns a decimal number.

## Parameters are inputs

Each parameter is a name the function can use inside its body. When we call the function, Python matches each argument to a parameter.

```python_runner
def greet(name: str, course: str) -> str:
    return f"Hi {name}, welcome to {course}!"


message: str = greet("Maya", "COMP 110")
print(message)
print(greet("Jordan", "CS1"))
```

## Return values can be reused

A function call can be stored in a variable, printed, or passed into another function.

```python_runner
def square(number: int) -> int:
    return number * number


def larger_square(left: int, right: int) -> int:
    if square(left) > square(right):
        return square(left)
    return square(right)


answer: int = larger_square(4, 7)
print(answer)
```

Type annotations do not change what Python does at runtime here. They make your intent visible: future you, your instructor, and editor tools can all see what shape of value the function expects.
