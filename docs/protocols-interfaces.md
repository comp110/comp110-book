---
title: Protocols and Interfaces
description: Describe the attributes and methods a function needs with a protocol, so that one function can work with objects of many different classes.
---

## Two Classes with the Same Methods

Suppose we are writing a program to estimate how much flooring to buy for a house. A floor plan is made of sections, and different sections have different shapes. Some are rectangles. A room under a sloped roof might include a triangular section.

Each kind of shape can be written as a class. The `Rectangle` and `Triangle` classes below have different attributes, but they have the same three parts in common:

- a `name` attribute of type `str`,
- an `area` method that returns the shape's area as a `float`, and
- a `scale` method that multiplies the shape's dimensions by a `factor`.

~~~python { runnable=true editable=true title="Two Shape Classes" }
class Rectangle:
    """A rectangle with a length and a width, in meters."""

    name: str
    length: float
    width: float

    def __init__(self, length: float, width: float) -> None:
        """Initialize a Rectangle's length and width."""
        self.name = "rectangle"
        self.length = length
        self.width = width

    def area(self) -> float:
        """Return this rectangle's area in square meters."""
        return self.length * self.width

    def scale(self, factor: float) -> None:
        """Multiply this rectangle's length and width by factor."""
        self.length = self.length * factor
        self.width = self.width * factor


class Triangle:
    """A triangle with a base and a height, in meters."""

    name: str
    base: float
    height: float

    def __init__(self, base: float, height: float) -> None:
        """Initialize a Triangle's base and height."""
        self.name = "triangle"
        self.base = base
        self.height = height

    def area(self) -> float:
        """Return this triangle's area in square meters."""
        return 0.5 * self.base * self.height

    def scale(self, factor: float) -> None:
        """Multiply this triangle's base and height by factor."""
        self.base = self.base * factor
        self.height = self.height * factor


kitchen: Rectangle = Rectangle(length=4.0, width=3.0)
nook: Triangle = Triangle(base=6.0, height=5.0)

print(kitchen.name + ": " + str(kitchen.area()))
print(nook.name + ": " + str(nook.area()))

nook.scale(factor=2.0)
print(nook.name + ": " + str(nook.area()))
~~~

The method calls `kitchen.area()` and `nook.area()` look alike, but they execute different method bodies. `kitchen.area()` evaluates `4.0 * 3.0`, which evaluates to `12.0`. `nook.area()` evaluates `0.5 * 6.0 * 5.0`, which evaluates to `15.0`. After `nook.scale(factor=2.0)`, the triangle's base is `12.0` and its height is `10.0`, so its area is `60.0`.

## The Problem: One Function, Many Classes

To find how much flooring to buy, we want a function that adds up the areas of every section in a floor plan. Its parameter will be a list of shapes, and its body will call `area` on each one.

But a parameter needs a type annotation, and neither class name fits:

- If the parameter is annotated `shapes: list[Rectangle]`, a type checker reports an error whenever the list contains a `Triangle`, even though `Triangle` has an `area` method too.
- Writing a separate `total_rectangle_area` and `total_triangle_area` would not help with a floor plan that has _both_ kinds of sections. And every new shape class, such as a circle, would require yet another function.

The function's body does not need to know whether a section is a rectangle or a triangle. It needs to know only that every item in the list has an `area` method that returns a `float`. What we need is a type that means "any object with these attributes and methods." That is what a protocol describes.

## Interfaces

An **interface** is the set of attributes and methods that code outside a class can use: their names, their parameters' names and types, and their return types. An interface says nothing about method bodies. `Rectangle` and `Triangle` have different method bodies but share part of their interfaces: both have a `name` attribute of type `str`, an `area` method that returns a `float`, and a `scale` method with a `float` parameter named `factor`.

This is the black box idea from Variable Fundamentals, applied to objects. To call a function, you need to know its parameters and return value, not the statements in its body. To use an object, you need to know its interface, not the bodies of its methods.

## Defining a Protocol

A **protocol** is a class definition that writes down an interface so it can be used as a type. A protocol lists attribute declarations and method signatures, and nothing else.

~~~python
from typing import Protocol


class Shape(Protocol):
    """The interface every shape in a floor plan provides."""

    name: str

    def area(self) -> float:
        """Return this shape's area in square meters."""

    def scale(self, factor: float) -> None:
        """Multiply this shape's dimensions by factor."""
~~~

Let's read this definition piece by piece:

- `from typing import Protocol` imports `Protocol` from `typing`, a module that comes with Python.
- `class Shape(Protocol):` defines a new type named `Shape`. The parentheses after the class name contain `Protocol`, which marks `Shape` as a protocol rather than an ordinary class.
- `name: str` declares that every `Shape` has a `name` attribute of type `str`.
- The `area` and `scale` definitions are **method signatures**: each one's name, parameters, and return type. Their bodies are only docstrings. A protocol's methods are never called, so they do not need statements that compute a value. Each docstring describes what any class's version of the method is expected to do.
- There is no `__init__` method. A protocol does not describe how an object is constructed, only what a constructed object can be used for. This is why `Rectangle` and `Triangle` can have different `__init__` parameters and still share an interface.

## A Protocol as a Type

A protocol's name can be used anywhere a type annotation is written, including inside `list[...]`. Here is `total_area`, with its parameter annotated `shapes: list[Shape]`.

~~~python
def total_area(shapes: list[Shape]) -> float:
    """Return the sum of the areas of the shapes in shapes."""
    total: float = 0.0
    idx: int = 0
    while idx < len(shapes):
        total = total + shapes[idx].area()
        idx = idx + 1
    return total
~~~

Inside `total_area`, the only use of each shape is the method call `shapes[idx].area()`. Because `area` is part of the `Shape` interface, a type checker accepts this call. If the body instead read an attribute that is not part of the interface, such as `shapes[idx].length`, the type checker would report an error: `Shape` promises only `name`, `area`, and `scale`, and not every shape has a `length` attribute.

## Satisfying a Protocol

A class **satisfies** a protocol when it has every attribute and method that the protocol lists, with matching types. Notice that neither `Rectangle` nor `Triangle` mentions `Shape` anywhere in its definition. In Python, a class does not need to name the protocol it satisfies. A type checker compares the class's attributes and methods with the protocol's, and if every one is present with a matching type, any object of that class can be used where a `Shape` is expected.

Consider the code below. Pay attention to the two `area` frames and to which object `self` refers to in each one.

~~~python
from typing import Protocol


class Shape(Protocol):
    """The interface every shape in a floor plan provides."""

    name: str

    def area(self) -> float:
        """Return this shape's area in square meters."""

    def scale(self, factor: float) -> None:
        """Multiply this shape's dimensions by factor."""


class Rectangle:
    """A rectangle with a length and a width, in meters."""

    name: str
    length: float
    width: float

    def __init__(self, length: float, width: float) -> None:
        """Initialize a Rectangle's length and width."""
        self.name = "rectangle"
        self.length = length
        self.width = width

    def area(self) -> float:
        """Return this rectangle's area in square meters."""
        return self.length * self.width

    def scale(self, factor: float) -> None:
        """Multiply this rectangle's length and width by factor."""
        self.length = self.length * factor
        self.width = self.width * factor


class Triangle:
    """A triangle with a base and a height, in meters."""

    name: str
    base: float
    height: float

    def __init__(self, base: float, height: float) -> None:
        """Initialize a Triangle's base and height."""
        self.name = "triangle"
        self.base = base
        self.height = height

    def area(self) -> float:
        """Return this triangle's area in square meters."""
        return 0.5 * self.base * self.height

    def scale(self, factor: float) -> None:
        """Multiply this triangle's base and height by factor."""
        self.base = self.base * factor
        self.height = self.height * factor


def total_area(shapes: list[Shape]) -> float:
    """Return the sum of the areas of the shapes in shapes."""
    total: float = 0.0
    idx: int = 0
    while idx < len(shapes):
        total = total + shapes[idx].area()
        idx = idx + 1
    return total


floor_plan: list[Shape] = [Rectangle(length=4.0, width=3.0), Triangle(base=6.0, height=5.0)]
print(total_area(shapes=floor_plan))
~~~

The list `floor_plan` holds references to two objects of two different classes. Its type, `list[Shape]`, allows this, because both classes satisfy `Shape`.

The repeat block in `total_area` is executed twice, and the expression `shapes[idx].area()` is evaluated each time:

- In the first execution, `idx` is `0`, and `shapes[idx]` refers to the `Rectangle` object. The `area` method in `Rectangle` is called, and its frame's `self` refers to that object. The call returns `12.0`.
- In the second execution, `idx` is `1`, and `shapes[idx]` refers to the `Triangle` object. The `area` method in `Triangle` is called, and its frame's `self` refers to that object. The call returns `15.0`.

`total_area` returns `27.0`. The same line of code called two different methods. This follows the method call steps from Classes, Objects, and Methods: Python evaluates the expression before the dot, follows the reference to an object on the heap, and finds `area` in _that object's_ class. The `Shape` annotation is not part of these steps. Python never looks inside `Shape` to find a method body; the protocol exists for the type checker and for programmers reading the code.

## Interfaces Separate Using Code from Implementing Code

With a protocol in place, a program divides into two kinds of code that depend only on the interface between them:

| | Depends on | Does not need to know |
|---|---|---|
| `total_area` (uses `Shape` objects) | The `Shape` protocol: a `name` attribute and `area` and `scale` methods | Which classes satisfy `Shape`, or how any `area` body computes its result |
| `Rectangle`, `Triangle` (satisfy `Shape`) | The `Shape` protocol: which attribute and methods to provide | Which functions will call `area` or `scale`, or what they do with the results |

Adding a new kind of shape now requires writing one new class. `total_area` does not change, and every function that is annotated with `Shape` can be called with objects of the new class.

This is the same arrangement as the Modularity section of Unit Tests, Importing, and Modularity, one level smaller. There, a module that imports another module needs to know only the names, parameters, and return types of its functions. Here, `total_area` needs to know only the interface of the objects in its list.

### Testing Through the Interface

Tests for code that uses a protocol can mix objects of every class that satisfies it. Suppose `Shape`, `Rectangle`, `Triangle`, and `total_area` are defined in a module named `shapes.py`:

~~~python { title="shapes_test.py" }
"""Unit tests for the shapes module."""

from shapes import Shape, Rectangle, Triangle, total_area


def test_total_area_mixed_shapes() -> None:
    """The total area adds the areas of shapes of different classes."""
    floor_plan: list[Shape] = [Rectangle(length=4.0, width=3.0), Triangle(base=6.0, height=5.0)]
    assert total_area(shapes=floor_plan) == 27.0


def test_total_area_empty_list() -> None:
    """A floor plan with no sections has a total area of 0.0."""
    assert total_area(shapes=[]) == 0.0


def test_triangle_scale_quadruples_area() -> None:
    """Scaling a triangle by 2.0 multiplies its area by 4."""
    nook: Triangle = Triangle(base=6.0, height=5.0)
    nook.scale(factor=2.0)
    assert nook.area() == 60.0
~~~

The test module imports `Shape` along with the classes so that it can use `Shape` in the annotation `list[Shape]`. The empty list is an edge case: the repeat block is never executed, so `total_area` returns the starting value of `total`.

## A Protocol Cannot Be Constructed

A protocol describes an interface but has no `__init__` method and no method bodies, so there is nothing for an object of type `Shape` to do. Calling a protocol's name as a constructor raises an error:

~~~python { runnable=true editable=true title="Constructing a Protocol" }
from typing import Protocol


class Shape(Protocol):
    """The interface every shape in a floor plan provides."""

    name: str

    def area(self) -> float:
        """Return this shape's area in square meters."""

    def scale(self, factor: float) -> None:
        """Multiply this shape's dimensions by factor."""


section: Shape = Shape()
~~~

Python reports `TypeError: Protocols cannot be instantiated`. A variable, parameter, or list item annotated with a protocol type always refers to an object of some ordinary class that satisfies the protocol, such as `Rectangle` or `Triangle`.

## Common Errors

### A Class Is Missing a Method

Suppose a new `Square` class forgets to define `area`:

~~~python
class Square:
    """A square with a side length, in meters."""

    name: str
    side: float

    def __init__(self, side: float) -> None:
        """Initialize a Square's side length."""
        self.name = "square"
        self.side = side

    def scale(self, factor: float) -> None:
        """Multiply this square's side length by factor."""
        self.side = self.side * factor


hallway: list[Shape] = [Square(side=2.0)]
print(total_area(shapes=hallway))
~~~

A type checker reports this error before the program is executed. Its message names the protocol member that is missing:

~~~text
error: List item 0 has incompatible type "Square"; expected "Shape"
note: "Square" is missing following "Shape" protocol member:
note:     area
~~~

If the program is executed anyway, Python raises an `AttributeError` when `total_area` evaluates `shapes[idx].area()`, because the `Square` object has no `area` method. The type checker's report is more useful: it points to the line where a `Square` is used as a `Shape`, not to a line inside `total_area`.

### A Method Has the Wrong Return Type

A method that is present but has a different return type than the protocol's also fails to satisfy the protocol:

~~~python
    def area(self) -> str:
        """Return this rectangle's area as a label."""
        return str(self.length * self.width) + " square meters"
~~~

A type checker reports that the class has a conflicting `area` member and shows the expected signature next to the actual one. If the program is executed anyway, Python raises a `TypeError` in `total_area` when it evaluates `total + shapes[idx].area()`, because a `float` and a `str` cannot be added.

### A Method Has Different Parameter Names

Because COMP 110 calls functions and methods with keyword arguments, the parameter names in a class's method must match the protocol's exactly:

~~~python
    def scale(self, amount: float) -> None:
        """Multiply this rectangle's length and width by amount."""
        self.length = self.length * amount
        self.width = self.width * amount
~~~

When code evaluates a call such as `shape.scale(factor=2.0)`, Python raises a `TypeError`, because this `scale` method has no parameter named `factor`. Some type checkers do not report this mismatch before the program is executed, so match the protocol's parameter names exactly whenever you write a class meant to satisfy it.

## You Try

### Predict: Which Method Is Called?

Using the `Rectangle` and `Triangle` classes and the `total_area` function from this page, predict what this code prints. Then replace the last two lines of the diagram above with it and step through it.

~~~python
yard: list[Shape] = [Rectangle(length=10.0, width=8.0), Triangle(base=4.0, height=6.0)]
print(total_area(shapes=yard))

yard[1].scale(factor=2.0)
print(yard[1].name + " area: " + str(yard[1].area()))
print(total_area(shapes=yard))
~~~

1. What three lines are printed?
2. When `yard[1].scale(factor=2.0)` is evaluated, which class's `scale` method is called? What does its `self` refer to?

??? note "Check your answers"

    1. `92.0`, then `triangle area: 48.0`, then `128.0`. The rectangle's area is `80.0` and the triangle's area is `12.0`. After scaling, the triangle's base is `8.0` and its height is `12.0`, so its area is `48.0`.
    2. `yard[1]` refers to the `Triangle` object, so the `scale` method in `Triangle` is called, and its `self` refers to that `Triangle` object. The method assigns new values to that object's `base` and `height` attributes. The list `yard` still refers to the same object, so the second call to `total_area` uses the new dimensions.

### Write a Class That Satisfies a Protocol

Write a class named `Circle` that satisfies `Shape`. Its `__init__` method has one parameter, `radius`, and sets `name` to `"circle"`. Its `area` method returns `PI * radius * radius`, using the static variable `PI`. Its `scale` method multiplies the radius by `factor`.

~~~python { runnable=true editable=true title="You Try: Circle" }
from typing import Protocol

PI: float = 3.14


class Shape(Protocol):
    """The interface every shape in a floor plan provides."""

    name: str

    def area(self) -> float:
        """Return this shape's area in square meters."""

    def scale(self, factor: float) -> None:
        """Multiply this shape's dimensions by factor."""


class Rectangle:
    """A rectangle with a length and a width, in meters."""

    name: str
    length: float
    width: float

    def __init__(self, length: float, width: float) -> None:
        """Initialize a Rectangle's length and width."""
        self.name = "rectangle"
        self.length = length
        self.width = width

    def area(self) -> float:
        """Return this rectangle's area in square meters."""
        return self.length * self.width

    def scale(self, factor: float) -> None:
        """Multiply this rectangle's length and width by factor."""
        self.length = self.length * factor
        self.width = self.width * factor


# TODO: Define the Circle class here.


def total_area(shapes: list[Shape]) -> float:
    """Return the sum of the areas of the shapes in shapes."""
    total: float = 0.0
    idx: int = 0
    while idx < len(shapes):
        total = total + shapes[idx].area()
        idx = idx + 1
    return total


rug: Circle = Circle(radius=1.0)
print(rug.name)  # Expected: circle
print(rug.area())  # Expected: 3.14

room: list[Shape] = [Rectangle(length=4.0, width=3.0), rug]
print(total_area(shapes=room))  # Expected: 15.14

rug.scale(factor=2.0)
print(rug.area())  # Expected: 12.56
~~~

??? note "Show a solution"

    ```python
    class Circle:
        """A circle with a radius, in meters."""

        name: str
        radius: float

        def __init__(self, radius: float) -> None:
            """Initialize a Circle's radius."""
            self.name = "circle"
            self.radius = radius

        def area(self) -> float:
            """Return this circle's area in square meters."""
            return PI * self.radius * self.radius

        def scale(self, factor: float) -> None:
            """Multiply this circle's radius by factor."""
            self.radius = self.radius * factor
    ```

    `total_area` did not change at all, yet it now works with circles. `PI` is not a local variable in the `area` frame, so Python finds it in Globals.

### Evaluate: Does This Class Satisfy `Shape`?

For each class, decide whether it satisfies `Shape`. If it does not, explain what a type checker or Python would report when an object of that class is used as a `Shape`.

**Class A**

~~~python
class Square:
    """A square with a side length, in meters."""

    name: str
    side: float

    def __init__(self, side: float) -> None:
        """Initialize a Square's side length."""
        self.name = "square"
        self.side = side

    def area(self) -> float:
        """Return this square's area in square meters."""
        return self.side * self.side

    def scale(self, factor: float) -> None:
        """Multiply this square's side length by factor."""
        self.side = self.side * factor

    def perimeter(self) -> float:
        """Return this square's perimeter in meters."""
        return 4.0 * self.side
~~~

**Class B**

~~~python
class Parallelogram:
    """A parallelogram with a base and a height, in meters."""

    name: str
    base: float
    height: float

    def __init__(self, base: float, height: float) -> None:
        """Initialize a Parallelogram's base and height."""
        self.name = "parallelogram"
        self.base = base
        self.height = height

    def area(self) -> float:
        """Return this parallelogram's area in square meters."""
        return self.base * self.height

    def scale(self) -> None:
        """Double this parallelogram's base and height."""
        self.base = self.base * 2.0
        self.height = self.height * 2.0
~~~

**Class C**

~~~python
class Kite:
    """A kite with two diagonals, in meters."""

    diagonal_1: float
    diagonal_2: float

    def __init__(self, diagonal_1: float, diagonal_2: float) -> None:
        """Initialize a Kite's diagonals."""
        self.diagonal_1 = diagonal_1
        self.diagonal_2 = diagonal_2

    def area(self) -> float:
        """Return this kite's area in square meters."""
        return 0.5 * self.diagonal_1 * self.diagonal_2

    def scale(self, factor: float) -> None:
        """Multiply this kite's diagonals by factor."""
        self.diagonal_1 = self.diagonal_1 * factor
        self.diagonal_2 = self.diagonal_2 * factor
~~~

??? note "Check your answers"

    - **Class A** satisfies `Shape`. It has an extra method, `perimeter`, which is allowed: a class can have more than its protocol lists. Code that uses a `Shape`, however, cannot call `perimeter`, because it is not part of the `Shape` interface.
    - **Class B** does not satisfy `Shape`. Its `scale` method has no `factor` parameter, so a type checker reports a conflicting `scale` member. If the program is executed anyway, `total_area` works, because it calls only `area`. But a call such as `shape.scale(factor=3.0)` raises a `TypeError`, because this `scale` has no parameter named `factor`.
    - **Class C** does not satisfy `Shape`. It has no `name` attribute, so a type checker reports that `name` is a missing protocol member. `total_area` never reads `name`, so Python would not raise an error inside `total_area`. But any other code that reads a shape's `name`, such as the second `print` in the Predict exercise above, would raise an `AttributeError`.

## Key Terminology Review

- **Interface**: The set of attributes and methods that code outside a class can use, including their names, parameter names and types, and return types, but not their bodies.
- **Method signature**: A method's name, parameters, and return type, without its body.
- **Protocol**: A class definition, marked with `Protocol` in parentheses, that writes down an interface so that it can be used as a type. It contains attribute declarations and method signatures only.
- **`typing` module**: A module that comes with Python and defines `Protocol`, imported with `from typing import Protocol`.
- **Satisfy (a protocol)**: To have every attribute and method a protocol lists, with matching types. In Python, a class satisfies a protocol without naming it.
- **Type checker**: A tool that checks a program's type annotations before it is executed and reports where a value's type disagrees with its annotation.
- **`TypeError`**: The error Python reports when a call's arguments do not match a function's or method's parameters, when an operator is used with values of types it does not support, or when a protocol is called as a constructor.
- **`AttributeError`**: The error Python reports when an object does not have an attribute or method with the requested name.