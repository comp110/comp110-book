---
title: Function Fundamentals
description: Step through a small Python subset while a COMP 110 memory diagram is drawn.
---

## Function Definitions and Calls

### A Single Function Call

A function call asks Python to run a named block of code. Here, the arguments `3.0` and `4.0` become the `length` and `width` parameters, and the returned perimeter is passed to `print`.

~~~python_diagram_runner
"""A function call."""

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return 2.0 * length + 2.0 * width

print(perimeter(length=3.0, width=4.0))
~~~

### Function Definitions Are Not Always Called

Defining a function makes its code available, but it does not run the function body. This program defines both `perimeter` and `area`, but it calls only `area`, so the statements inside `perimeter` never execute.

~~~python_diagram_runner
"""Just because a function is defined doesn't mean a program calls it."""

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return 2.0 * length + 2.0 * width

def area(length: float, width: float) -> float:
    """Calculate the area of a rectangle."""
    return length * width

print(area(length=3.0, width=4.0))
~~~

### Function Definitions are Reusable

Defining a function once lets us call it as many times as we need. Each call receives its own parameter values and produces a separate returned result.

~~~python_diagram_runner
"""Multiple function calls."""

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return 2.0 * length + 2.0 * width

print(perimeter(length=1.0, width=2.0))
print(perimeter(length=3.0, width=4.0))
~~~

### Functions Can Only Return Once per Call

A `return` statement immediately ends the current function call and sends its value back to the caller. The second `return` in this function can never run because the first one has already completed the call.

~~~python_diagram_runner
"""Functions can only return once per call."""

def triple_double(x: int) -> int:
    """The first return statement completes the call."""
    return x * 3
    return x * 2

print(triple_double(x=110))
~~~

### Functions Can Have Conditional Control Logic

A function can use a condition to decide which code should run. For each call, only one branch returns: `3` follows the odd branch, while `4` follows the even branch.

~~~python_diagram_runner
"""Multiple branches can return."""

def even_or_odd(x: int) -> str:
    """Return type of integer."""
    if x % 2 == 0:
        return "even"
    else:
        return "odd"

print(even_or_odd(x=3))
print(even_or_odd(x=4))
~~~

### Functions Can Have Many Statements in their Bodies

A function body can contain several statements that Python handles from top to bottom during a call. The `identity` body first prints `x`, then uses two conditional decisions to describe the value, and finally returns the original `x`.

~~~python_diagram_runner
"""Function bodies can have sequential statements."""

def identity(x: int) -> int:
    """Print info about x, then return x."""
    print("x: " + str(x))

    if x % 2 == 0:
        print("x is even")
    else:
        print("x is odd")

    if x == 0:
        print("x is zero")
    else:
        if x > 0:
            print("x is positive")
        else:
            print("x is negative")

    return x

print(identity(x=-1))
print(identity(x=0))
print(identity(x=110))
~~~

### Functions Can Be Parameterless

Some functions do not need any information from the caller, so they have no parameters. We still write empty parentheses in `pi()` to tell Python to call the function and obtain its result.

~~~python_diagram_runner
"""Functions do not have to specify parameters."""

def pi() -> float:
    """An approximation of pi."""
    return 355.0 / 113.0

# Calls to parameterless functions require empty parentheses
print(pi())
~~~

## Procedures

### Procedures return `None`

A procedure is a function used mainly to perform an action, such as displaying output. This procedure prints the perimeter and then explicitly returns `None` to show that it does not provide a useful result to its caller.

~~~python_diagram_runner
"""An example procedure."""

def show_perimeter(length: float, width: float) -> None:
    """A procedure that prints a perimeter."""
    print(perimeter(length=length, width=width))
    return None

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return 2.0 * length + 2.0 * width

show_perimeter(length=1.0, width=2.0)
~~~

### Procedures can return `None` implicitly

When Python reaches the end of a function without a `return` statement, it automatically returns `None`. This procedure still prints the perimeter, but its call finishes with `None` as its result.

~~~python_diagram_runner
"""The same example procedure."""

def show_perimeter(length: float, width: float) -> None:
    """A procedure that prints a perimeter."""
    print(perimeter(length=length, width=width))

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return 2.0 * length + 2.0 * width

show_perimeter(length=1.0, width=2.0)
~~~

### `None` is a value that represents _no value_

`None` is Python's special value for the absence of a useful result. The outer calls to `print` make that result visible: both the procedure and `print` itself display something and then return `None`.

~~~python_diagram_runner
def a_procedure() -> None:
    """A sample procedure."""
    print("a_procedure")
    return None

print(a_procedure())
print(print("The print procedure returns None."))
~~~

### `print` vs. `return`

`print` displays a value for a person, while `return` gives a value back to the calling code. The result from `double_return` can be used in addition, but `double_print` returns `None`, so trying to add `1` produces an error.

~~~python_diagram_runner
"""The same example procedure."""

def double_return(x: int) -> int:
    return x * 2

def double_print(x: int) -> None:
    """Examples of printing."""
    print(x * 2)

print(double_return(x=1) + 1)
print(double_print(x=1) + 1)
~~~

## Function Definition Ordering

Python executes a program from top to bottom, so each `def` statement must run before that function is called. After `a`, `b`, and `c` have all been defined, the program can call them repeatedly and in any order.

~~~python_diagram_runner
"""Order of definition is independent of calls."""
def a() -> str:
    return "a"

def b() -> str:
    return "b"

def c() -> str:
    return "c"

print(b())
print(c())
print(a())
print(b())
~~~

## Function Call Composition

One function call can be used as the argument to another function call. Python evaluates the inner call first, and changing which function is inside changes the order of the calculations and therefore the result.

~~~python_diagram_runner
"""Function call composition."""

def double(x: int) -> int:
    return x * 2

def plus_one(x: int) -> int:
    return x + 1

print("double(x= plus_one(x=2) ) is:")
print(double(x= plus_one(x=2) ))

print("plus_one(x= double(x=2) ) is:")
print(plus_one(x= double(x=2) ))
~~~

## Nested Function Calls

A function can call another function from inside its own body. To compute `quadruple(x= 3)`, Python completes the inner call to `double` first and passes that result into the outer call to `double`.

~~~python_diagram_runner
"""Functions can call other functions."""

def double(y: int) -> int:
    return y * 2

def quadruple(x: int) -> int:
    return double(y= double(y=x))

print(quadruple(x=3))
~~~

## Common Errors

### Undefined Functions are Called

Python can call only functions it already knows about. If a program calls a function name that has not been defined, Python stops with a `NameError` instead of entering a function body. In this example, `double` is the function defined, but `doubles` is the function called.

~~~python_diagram_runner
"""Functions must be defined to be called."""

def double(x: int) -> int:
    """Double an integer."""
    return x * 2

print(doubles(x=2))
~~~

### Errors in Function Definitions

#### Undefined Names are Used in Expressions

Before Python can use a name in an expression, that name must refer to a known value. This function receives a parameter named `i`, but its `return` expression uses the undefined name `j`, so Python reports a `NameError` when that line is reached.

~~~python_diagram_runner
"""Names must be known to be used."""

def double(i: int) -> int:
    """Double an integer."""
    return j * 2

print(double(i=2))
~~~

#### Missing `return` Keyword

Writing an expression by itself calculates a value and then discards it; it does not return that value. This function reaches its end and implicitly returns `None`, which disagrees with its declared `float` return type.

~~~python_diagram_runner
"""Return keyword must be written before an expression."""

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    2.0 * length + 2.0 * width

print(perimeter(length=1.0, width=2.0))
~~~

#### Disagreement in Return Type

The function declares that it returns a `float`, but quotation marks make the returned expression a `str`. The course's type rules report this disagreement when the `return` statement is reached.

~~~python_diagram_runner
"""Return statement expression must match return type."""

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return "2.0 * length + 2.0 * width"

print(perimeter(length=1.0, width=2.0))
~~~

#### Printing rather than Returning

Printing a value is not the same as returning it to the caller. After displaying the text, this function reaches its end and implicitly returns `None`, which disagrees with its declared `float` return type.

~~~python_diagram_runner
"""Print is not interchangeable with return."""

def perimeter(length: float, width: float) -> float:
    """The following line has an error."""
    print("2.0 * length + 2.0 * width")

print(perimeter(length=1.0, width=2.0))
~~~

### Errors in Function Calls

#### Disagreement in Argument Count

A function call must supply a value for each required parameter. This call provides `length` but omits `width`, so Python cannot begin the `perimeter` call.

~~~python_diagram_runner
"""Arguments and parameters must agree."""

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return 2.0 * length + 2.0 * width

print(perimeter(length=1.0))
~~~

#### Disagreement in Argument Names

Keyword arguments match values to parameters by name. The function defines parameters named `length` and `width`, so the unexpected names `x` and `y` cannot be used for this call.

~~~python_diagram_runner
"""Arguments and parameters must agree."""

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return 2.0 * length + 2.0 * width

print(perimeter(x=1.0, y=2.0))
~~~

#### Disagreement in Argument Types

Quotation marks make `"1.0"` and `"2.0"` strings, even though they look like decimal numbers. The course's type rules expect `float` arguments for both parameters and report the mismatch before the function body runs.

~~~python_diagram_runner
"""Arguments and parameters must agree."""

def perimeter(length: float, width: float) -> float:
    """Calculate the perimeter of a rectangle."""
    return 2.0 * length + 2.0 * width

print(perimeter(length="1.0", width="2.0"))
~~~