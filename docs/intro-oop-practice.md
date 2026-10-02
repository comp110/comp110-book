---
title: "Practice: Classes, Objects, and Methods"
description: Trace memory diagrams, write classes and methods, and evaluate code that works with objects.
---

<!-- ## How to Use This Page

Most exercises ask you to **predict first**. Before you step through a diagram or run a program, write down what you expect: which frames and objects will exist, what variables and parameters will refer to in the heap, and what will be printed. Then, step through the program and compare. The places where your prediction and the diagram disagree are the places worth studying. -->

Note: Each code block runs on its own, so classes are defined again in each example that uses them.

## Part 1: Classes and Objects

### Trace: Constructing Objects

This `Plant` class tracks a houseplant's name and height in centimeters. Before stepping through the diagram, answer the questions below.

~~~python_diagram_runner { editable=true title="Trace: Two Plants" }
class Plant:
    """A houseplant that grows over time."""

    name: str
    height: float

    def __init__(self, name: str, height: float):
        """Initialize a Plant's name and height in centimeters."""
        self.name = name
        self.height = height


fern: Plant = Plant(name="Fern", height=12.5)
cactus: Plant = Plant(name="Cactus", height=4.0)

fern.height = fern.height + 1.5

print(fern.height)
print(cactus.height)
~~~

1. When the first `__init__` frame is established, what are the values of `self`, `name`, and `height`?
2. How many `Plant` objects are on the heap when the program finishes? How many `__init__` frames are there?
3. What two lines are printed?

??? note "Check your answers"

    1. `self` holds a reference to the new, uninitialized `Plant` object on the heap. `name` is `"Fern"` and `height` is `12.5`.
    2. There are two `Plant` objects on the heap: one for each constructor call. Two `__init__` frames should be in the stack.
    3. `14.0` and then `4.0`. Only the object `fern` refers to has its `height` attribute reassigned.

### Trace: Aliases

Predict what this program prints. Pay close attention to which variables refer to which objects.

~~~python_diagram_runner { editable=true title="Trace: Aliases" }
class Plant:
    """A houseplant that grows over time."""

    name: str
    height: float

    def __init__(self, name: str, height: float):
        """Initialize a Plant's name and height in centimeters."""
        self.name = name
        self.height = height


fern: Plant = Plant(name="Fern", height=12.5)
same_fern: Plant = fern
other_fern: Plant = Plant(name="Fern", height=12.5)

same_fern.height = 20.0

print(fern.height)
print(other_fern.height)
~~~

1. How many `Plant` objects are on the heap? How many references are there to each one?
2. What two lines are printed?

??? note "Check your answers"

    1. There are two objects, because there are two constructor calls. The first object has two references pointing to it, from `fern` and `same_fern`. The second object has one reference, from `other_fern`.
    2. `20.0` and then `12.5`. `fern` and `same_fern` are aliases, so assigning `same_fern.height` changes the object that `fern` also refers to. `other_fern` refers to a separate object whose attributes happen to hold the same values as the first object's did.

### You Try: Define a Class

Complete the `Rectangle` class so that its `length` and `width` attributes are initialized from the constructor call's arguments. Then complete the `area` function, which takes a `Rectangle` as its parameter. When your code is correct, running it prints the expected values in the comments.

~~~python { runnable=true editable=true title="You Try: A Rectangle Class" }
class Rectangle:
    """A rectangle with a length and a width."""

    length: float
    width: float

    def __init__(self, length: float, width: float):
        """Initialize a Rectangle's length and width."""
        # TODO: Replace each 0.0 with the matching parameter.
        self.length = 0.0
        self.width = 0.0


def area(rect: Rectangle) -> float:
    """Calculate the area of a rectangle."""
    # TODO: Replace 0.0 with an expression using rect's attributes.
    return 0.0


room: Rectangle = Rectangle(length=12.0, width=10.0)
print(room.length)  # Expected: 12.0
print(room.width)  # Expected: 10.0
print(area(rect=room))  # Expected: 120.0
~~~

??? note "Show a solution"

    ```python
    class Rectangle:
        """A rectangle with a length and a width."""

        length: float
        width: float

        def __init__(self, length: float, width: float):
            """Initialize a Rectangle's length and width."""
            self.length = length
            self.width = width


    def area(rect: Rectangle) -> float:
        """Calculate the area of a rectangle."""
        return rect.length * rect.width
    ```

### Predict: A Function that Receives an Object

The `water` function is meant to make a plant grow by `growth` centimeters. Predict what the program prints, then step through it.

~~~python_diagram_runner { editable=true title="Predict: Watering a Plant" }
class Plant:
    """A houseplant that grows over time."""

    name: str
    height: float

    def __init__(self, name: str, height: float):
        """Initialize a Plant's name and height in centimeters."""
        self.name = name
        self.height = height


def water(plant: Plant, growth: float) -> None:
    """Grow plant by growth centimeters."""
    plant = Plant(name=plant.name, height=plant.height + growth)


fern: Plant = Plant(name="Fern", height=12.5)
water(plant=fern, growth=2.0)
print(fern.height)
~~~

1. What is printed?
2. Explain what happened in terms of the memory diagram.
3. Edit the body of `water` so the program prints `14.5`, and step through it again.

??? note "Check your answers"

    1. `12.5`.
    2. When `water` is called, its parameter `plant` is initialized with a reference to the same object `fern` refers to. The statement in the body constructs a _new_ `Plant` object and reassigns the local parameter `plant` to refer to it. The object `fern` refers to is never changed. When the call completes, the `water` frame is gone, and so is the only reference to the new object.
    3. Assign the attribute of the existing object instead of reassigning the parameter:

        ```python
        def water(plant: Plant, growth: float) -> None:
            """Grow plant by growth centimeters."""
            plant.height = plant.height + growth
        ```

## Part 2: Methods

### Trace: Method Call Frames

This version of `Plant` has two methods. Before stepping through the diagram, answer the questions below.

~~~python_diagram_runner { editable=true title="Trace: Plant Methods" }
MAX_POT_HEIGHT: float = 24.0


class Plant:
    """A houseplant that grows over time."""

    name: str
    height: float

    def __init__(self, name: str, height: float):
        """Initialize a Plant's name and height in centimeters."""
        self.name = name
        self.height = height

    def grow(self, amount: float) -> None:
        """Increase this plant's height by amount centimeters."""
        self.height = self.height + amount

    def needs_bigger_pot(self) -> bool:
        """Return whether this plant is taller than its pot allows."""
        return self.height > MAX_POT_HEIGHT


fern: Plant = Plant(name="Fern", height=12.5)
cactus: Plant = Plant(name="Cactus", height=4.0)

fern.grow(amount=15.0)
cactus.grow(amount=1.0)

print(fern.needs_bigger_pot())
print(cactus.needs_bigger_pot())
~~~

1. In the frame for `fern.grow(amount=15.0)`, what does `self` refer to? What about in the frame for `cactus.grow(amount=1.0)`?
2. What are the two objects' `height` attributes after both `grow` calls complete?
3. In `needs_bigger_pot`, where does Python find `MAX_POT_HEIGHT`?
4. What two lines are printed?

??? note "Check your answers"

    1. In the first `grow` frame, `self` has an arrow to the object `fern` refers to. In the second, `self` has an arrow to the object `cactus` refers to. The expression before the dot determines which object `self` refers to.
    2. `fern`'s object has a height of `27.5`, and `cactus`'s object has a height of `5.0`.
    3. `MAX_POT_HEIGHT` is not a local variable in the `needs_bigger_pot` frame, so Python finds it in Globals.
    4. `True` and then `False`, because `27.5 > 24.0` evaluates to `True` and `5.0 > 24.0` evaluates to `False`.

### You Try: From Functions to Methods

In Function Fundamentals, `perimeter` and `area` were functions with `length` and `width` parameters. Rewrite them as methods of the `Rectangle` class. Each method's only parameter is `self`, so each one uses the object's attributes instead.

~~~python { runnable=true editable=true title="You Try: Rectangle Methods" }
class Rectangle:
    """A rectangle with a length and a width."""

    length: float
    width: float

    def __init__(self, length: float, width: float):
        """Initialize a Rectangle's length and width."""
        self.length = length
        self.width = width

    def perimeter(self) -> float:
        """Calculate the perimeter of this rectangle."""
        # TODO: Replace 0.0 with an expression using self's attributes.
        return 0.0

    def area(self) -> float:
        """Calculate the area of this rectangle."""
        # TODO: Replace 0.0 with an expression using self's attributes.
        return 0.0


room: Rectangle = Rectangle(length=12.0, width=10.0)
print(room.perimeter())  # Expected: 44.0
print(room.area())  # Expected: 120.0

rug: Rectangle = Rectangle(length=3.0, width=2.0)
print(rug.perimeter())  # Expected: 10.0
print(rug.area())  # Expected: 6.0
~~~

??? note "Show a solution"

    ```python
        def perimeter(self) -> float:
            """Calculate the perimeter of this rectangle."""
            return 2.0 * self.length + 2.0 * self.width

        def area(self) -> float:
            """Calculate the area of this rectangle."""
            return self.length * self.width
    ```

### You Try: A Win Streak Tracker

Daily puzzle games like Wordle track your **current streak**, the number of puzzles you have solved in a row, and your **best streak**, the longest current streak you have ever reached. Complete the two methods of the `Streak` class so that:

- `record_win` adds one to the current streak, and updates the best streak if the current streak is now longer than it.
- `record_loss` starts the current streak over at `0`. The best streak keeps its value.

~~~python { runnable=true editable=true title="You Try: Streak" }
class Streak:
    """Track consecutive wins in a daily puzzle game."""

    current: int
    best: int

    def __init__(self):
        """Initialize a Streak with no wins yet."""
        self.current = 0
        self.best = 0

    def record_win(self) -> None:
        """Add one to the current streak and update the best streak if needed."""
        # TODO: Replace return None with your implementation.
        return None

    def record_loss(self) -> None:
        """Start the current streak over at 0."""
        # TODO: Replace return None with your implementation.
        return None


streak: Streak = Streak()
streak.record_win()
streak.record_win()
streak.record_win()
print(streak.current)  # Expected: 3
print(streak.best)  # Expected: 3

streak.record_loss()
streak.record_win()
print(streak.current)  # Expected: 1
print(streak.best)  # Expected: 3
~~~

Once your output matches, paste your completed `record_win` and `record_loss` into the diagram below and step through it. Watch the `current` and `best` attributes change on the heap, and notice which object `self` refers to in each method call's frame.

~~~python_diagram_runner { editable=true title="Step Through Your Streak" }
class Streak:
    """Track consecutive wins in a daily puzzle game."""

    current: int
    best: int

    def __init__(self):
        """Initialize a Streak with no wins yet."""
        self.current = 0
        self.best = 0

    def record_win(self) -> None:
        """Add one to the current streak and update the best streak if needed."""
        # TODO: Paste your implementation.
        return None

    def record_loss(self) -> None:
        """Start the current streak over at 0."""
        # TODO: Paste your implementation.
        return None


streak: Streak = Streak()
streak.record_win()
streak.record_win()
streak.record_loss()
streak.record_win()
print(streak.current)  # Expected: 1
print(streak.best)  # Expected: 2
~~~

??? note "Show a solution"

    ```python
        def record_win(self) -> None:
            """Add one to the current streak and update the best streak if needed."""
            self.current = self.current + 1
            if self.current > self.best:
                self.best = self.current

        def record_loss(self) -> None:
            """Start the current streak over at 0."""
            self.current = 0
    ```

### Evaluate: Which Versions Are Correct?

Here are three implementations of `record_win`. For each one, decide whether it behaves correctly for **every** sequence of wins and losses, not only the test above. Try tracing each one by hand, starting from a new `Streak` whose `current` and `best` are both `0`.

**Version A**

~~~python
    def record_win(self) -> None:
        if self.current >= self.best:
            self.best = self.current + 1
        self.current = self.current + 1
~~~

**Version B**

~~~python
    def record_win(self) -> None:
        if self.current > self.best:
            self.best = self.current
        self.current = self.current + 1
~~~

**Version C**

~~~python
    def record_win(self) -> None:
        self.current = self.current + 1
        if self.current > self.best:
            self.best = self.current
~~~

1. Which versions are correct? For any incorrect version, give a sequence of calls that produces a wrong result.
2. Of the correct versions, which would you rather read and maintain? Why?

Use this block to test a version: replace the body of `record_win` and run it.

~~~python { runnable=true editable=true title="Test a Version of record_win" }
class Streak:
    """Track consecutive wins in a daily puzzle game."""

    current: int
    best: int

    def __init__(self):
        """Initialize a Streak with no wins yet."""
        self.current = 0
        self.best = 0

    def record_win(self) -> None:
        """Add one to the current streak and update the best streak if needed."""
        if self.current > self.best:
            self.best = self.current
        self.current = self.current + 1

    def record_loss(self) -> None:
        """Start the current streak over at 0."""
        self.current = 0


streak: Streak = Streak()
streak.record_win()
print(streak.current)  # Expected: 1
print(streak.best)  # Expected: 1
~~~

??? note "Check your answers"

    1. Versions A and C are correct. Version B is incorrect: it compares `self.current` to `self.best` _before_ adding one, and it compares with `>`. Starting from a new `Streak`, a single call to `record_win` leaves `current` at `1` and `best` at `0`. In Version B, `best` always lags behind by one win when a new best streak is reached.
    2. Version C is easier to check. It follows the same order as the description in its docstring: add one to the current streak, then compare the updated value to the best streak. Version A is correct, but a reader has to reason about why comparing with `>=` and assigning `self.current + 1` _before_ the increment produces the right result.

### Find the Error: Reading an Attribute

This program is supposed to print whether a streak has lasted at least a week. Predict what happens when it runs, then step through it to check.

~~~python_diagram_runner { editable=true title="Find the Error: A Week-Long Streak" }
class Streak:
    """Track consecutive wins in a daily puzzle game."""

    current: int
    best: int

    def __init__(self):
        """Initialize a Streak with no wins yet."""
        self.current = 0
        self.best = 0

    def is_week_long(self) -> bool:
        """Return whether the current streak is at least 7 wins."""
        return current >= 7


streak: Streak = Streak()
streak.current = 8
print(streak.is_week_long())
~~~

??? note "Check your answer"

    Python reports a `NameError` when it evaluates `current >= 7`. The name `current` by itself is resolved by looking in the `is_week_long` frame and then in Globals, and neither has a variable named `current`. The object's attribute is read with `self.current`:

    ```python
        def is_week_long(self) -> bool:
            """Return whether the current streak is at least 7 wins."""
            return self.current >= 7
    ```

### Find the Error: A Missing Parameter

Predict what happens when this program runs, then step through it to check.

~~~python_diagram_runner { editable=true title="Find the Error: Calling record_loss" }
class Streak:
    """Track consecutive wins in a daily puzzle game."""

    current: int
    best: int

    def __init__(self):
        """Initialize a Streak with no wins yet."""
        self.current = 0
        self.best = 0

    def record_loss() -> None:
        """Start the current streak over at 0."""
        self.current = 0


streak: Streak = Streak()
streak.record_loss()
~~~

??? note "Check your answer"

    Python reports a `TypeError` when it evaluates `streak.record_loss()`, before the method's body is executed. A method call always initializes the method's first parameter with a reference to the object before the dot. Because `record_loss` was defined with no parameters, there is no parameter for that reference. Adding `self` as the first parameter fixes the error: `def record_loss(self) -> None:`.

### Challenge: A Method that Calls Methods

Add a `record_result` method to `Streak`. It has a `bool` parameter named `won`. If `won` is `True`, it calls `record_win` on the same object. Otherwise, it calls `record_loss`. Paste in your working `record_win` and `record_loss` from earlier.

~~~python { runnable=true editable=true title="Challenge: record_result" }
class Streak:
    """Track consecutive wins in a daily puzzle game."""

    current: int
    best: int

    def __init__(self):
        """Initialize a Streak with no wins yet."""
        self.current = 0
        self.best = 0

    def record_win(self) -> None:
        """Add one to the current streak and update the best streak if needed."""
        # TODO: Paste your implementation from earlier.
        return None

    def record_loss(self) -> None:
        """Start the current streak over at 0."""
        # TODO: Paste your implementation from earlier.
        return None

    # TODO: Define record_result here.


streak: Streak = Streak()
streak.record_result(won=True)
streak.record_result(won=True)
streak.record_result(won=False)
streak.record_result(won=True)
print(streak.current)  # Expected: 1
print(streak.best)  # Expected: 2
~~~

??? note "Show a solution"

    ```python
        def record_result(self, won: bool) -> None:
            """Record a win if won is True, or a loss otherwise."""
            if won:
                self.record_win()
            else:
                self.record_loss()
    ```

    Inside `record_result`, `self` refers to the object the method was called on, so `self.record_win()` calls `record_win` on that same object.

## Part 3: Putting It Together

### Draw the Memory Diagram

On paper, draw the complete memory diagram for this program as it would look just before it finishes: Globals, any remaining frames, every object on the heap, and every arrow. Also write down its printed output. Then step through the diagram and compare it with your drawing.

~~~python_diagram_runner { editable=true title="Draw It: The Taller Plant" }
class Plant:
    """A houseplant that grows over time."""

    name: str
    height: float

    def __init__(self, name: str, height: float):
        """Initialize a Plant's name and height in centimeters."""
        self.name = name
        self.height = height

    def grow(self, amount: float) -> None:
        """Increase this plant's height by amount centimeters."""
        self.height = self.height + amount


def taller(a: Plant, b: Plant) -> Plant:
    """Return the taller of two plants, or a if they are the same height."""
    if a.height >= b.height:
        return a
    else:
        return b


fern: Plant = Plant(name="Fern", height=12.5)
cactus: Plant = Plant(name="Cactus", height=4.0)
cactus.grow(amount=10.0)

tallest: Plant = taller(a=fern, b=cactus)
tallest.grow(amount=2.0)

print(fern.height)
print(cactus.height)
print(tallest.name)
~~~

??? note "Check your answers"

    - There are two `Plant` objects on the heap. The first has `name` `"Fern"` and `height` `12.5`. The second has `name` `"Cactus"` and `height` `16.0`.
    - In Globals, `fern` has an arrow to the first object. Both `cactus` and `tallest` have arrows to the second object, so they are aliases.
    - No `__init__`, `grow`, or `taller` frames remain; each is gone once its call completes.
    - The output is `12.5`, `16.0`, and `Cactus`. After `cactus.grow(amount=10.0)`, the cactus is `14.0` centimeters tall, so `taller` returns a reference to the cactus's object. `tallest.grow(amount=2.0)` therefore grows the cactus to `16.0`.

## Part 4: Classes with Attributes of Objects from other Classes

### Line class

Create a Line class with two attributes: a starting point (`start: Point`) and an ending point (`end: Point`).
The Line class should have the following method definitions:

- `def __init__(self, start: Point, end: Point):`
- `def get_length(self) -> float:` calculates the length of the line
- `def get_slope(self) -> float:` calculates the slope (from start to end)


~~~python { runnable=true editable=true title="Point class and object" }
class Point:
   x: float
   y: float

   def __init__(self, x: float, y: float):
       self.x = x
       self.y = y

   def dist_from_origin(self) -> float:
       return (self.x**2 + self.y**2) ** 0.5

   def translate_x(self, dx: float) -> None:
       self.x += dx

   def translate_y(self, dy: float) -> None:
       self.y += dy

class Line: 
    # TODO: Declare two attributes

    # TODO: __init__ method

    # TODO: get_length method

    # TODO: get_slope method

pt: Point = Point(2.0, 1.0)

print(pt)
~~~

### __str__ magic method

Next, add a __str__ magic method to the Point and Line classes above. 

### __repr__ magic method

Finally, add a __repr__ magic method to the Point and Line classes above.
