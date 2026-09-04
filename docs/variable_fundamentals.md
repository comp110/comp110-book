---
title: Variable Fundamentals
description: Learn how Python variables are initialized, read, reassigned, and resolved in memory.
---

## Declaring and Initializing Variables

A **variable** gives a name to a value so that we can use that value later. A variable introduced at the top level of a program is a **global variable**, and it is stored in the **Globals** frame.

To **declare** a variable, write its name and a **type annotation**. A **declaration** describes the kind of value the variable will refer to. An **initialization** gives the variable its first value. Declaration and initialization can happen in separate statements, or a variable can be declared and initialized in the same statement.

~~~python { runnable=true editable=true title="Declarations and Initializations" }
course_name: str
course_name = "COMP 110"

section_size: int = 24

print(course_name)
print(section_size)
~~~

The declaration `course_name: str` tells us that `course_name` will refer to a string. It does not yet give the variable a value. The next statement initializes it. The statement `section_size: int = 24` declares and initializes `section_size` all at once.

Variable names use **snake case**: lowercase words separated by underscores. Names such as `course_name`, `section_size`, and `total_points` follow this convention and describe the values they refer to.

### You Try: Initialize a Variable with an Expression

The final value of `total_points` should be `10`. Edit its initialization so that the right-hand side uses both `starting_points` and `bonus_points`, then run the program.

~~~python { runnable=true editable=true title="You Try: Total Points" }
starting_points: int = 7
bonus_points: int = 3

# TODO: Replace 0 with an expression using both variables.
total_points: int = 0

print(total_points)
~~~

## Reading a Variable's Value

After a variable is initialized, its name can be used in an expression. Python reads the value associated with that name from memory and uses the value while evaluating the expression.

~~~python { runnable=true editable=true title="Reading Values" }
item_price: float = 8.50
item_count: int = 3

subtotal: float = item_price * item_count

print(subtotal)
~~~

When Python evaluates `item_price * item_count`, it reads `8.50` for `item_price` and `3` for `item_count`. The expression produces the single value `25.5`, which is then assigned to `subtotal`.

## Assignment is Not Equality

An **assignment** uses the **assignment operator** (`=`) to store a value in a variable. Read `=` as “takes the value of” or “is assigned,” not “equals.” Python uses the **equality operator** (`==`) to ask whether two values are equal.

Python evaluates an assignment in this order:

1. Evaluate the expression on the **right-hand side (RHS)** to produce one value.
2. Find the variable named on the **left-hand side (LHS)** in memory, or create it in the current frame if this is its first assignment.
3. Store the value in that variable.

The left-hand side must be a variable name. The right-hand side can be any expression that produces a single value.

### Variables Can Be Reassigned

A variable can be **reassigned** after it is initialized, giving it a new value. This makes statements such as `i = i + 1` possible. Such a statement would be an error if `=` meant mathematical equality, but it is common in programming.

Step through this diagram and watch the value associated with `i` change in Globals.

~~~python_diagram_runner { editable=true title="Reassigning a Global Variable" }
i: int = 1
i = i + 1

print(i)
print(i == 2)
~~~

For `i = i + 1`, Python first evaluates the right-hand side. It reads the current value of `i`, adds `1`, and produces `2`. Only then does it use the left-hand side to assign `2` to the existing variable named `i`. The expression `i == 2` asks a question and produces the Boolean value `True`; it does not assign anything.

When a variable is assigned for the first time, it is added to the current **frame of execution**. Before we enter a function call, the current frame is Globals. A later assignment to the same variable updates its value in that frame.

## Variables Help Build Calculations

Variables are useful for holding **intermediate results**. Giving each step a name can make a longer calculation easier to write, read, and check.

This function calculates the straight-line distance between two points. Each variable records one meaningful step of the calculation.

~~~python { runnable=true editable=true title="Distance Between Two Points" }
def distance(x1: float, y1: float, x2: float, y2: float) -> float:
    """Calculate the straight-line distance between two points."""
    x_change: float = x2 - x1
    y_change: float = y2 - y1

    x_change_squared: float = x_change * x_change
    y_change_squared: float = y_change * y_change
    distance_squared: float = x_change_squared + y_change_squared

    result: float = distance_squared ** 0.5
    return result


print(distance(x1=0.0, y1=0.0, x2=3.0, y2=4.0))
~~~

Try changing the coordinates and running the program again. The intermediate variables let you inspect each part without having to understand one large expression all at once.

## Variables Let Us Reuse Results

A function call or any other expression produces a value. Storing that value in a variable lets us refer to it at multiple later points in the program without writing or evaluating the original expression again.

~~~python { runnable=true editable=true title="Reusing a Function Call's Result" }
def rectangle_area(length: float, width: float) -> float:
    """Calculate the area of a rectangle."""
    return length * width


area: float = rectangle_area(length=4.0, width=3.0)

print(area)
print(area * 2.0)
print(area > 10.0)
~~~

The call to `rectangle_area` is evaluated once. Its returned value is stored in `area`, and the following three expressions can all reuse that value.

## Static Variables Name Values that Stay the Same

Some variables are assigned once and are meant to keep the same value for the entire program. We call these **static variables** or **named constants** in Python.

Static variables are often found in Globals. By convention, their names use all capital letters with underscores between words. These names replace unexplained “magic” numbers with names that communicate what the values mean.

~~~python { runnable=true editable=true title="Naming Otherwise Magic Numbers" }
SALES_TAX_RATE: float = 0.0725
FREE_SHIPPING_MINIMUM: float = 50.0

subtotal: float = 60.0
tax: float = subtotal * SALES_TAX_RATE
qualifies_for_free_shipping: bool = subtotal >= FREE_SHIPPING_MINIMUM

print(tax)
print(qualifies_for_free_shipping)
~~~

Note: Python does not _prevent_ a capitalized variable from being reassigned, it is a convention followed by programmers. The capital letters communicate to programmers that its value is intended to stay the same.

## Parameters and Local Variables

As you know, every function call creates a new frame. **Parameters** are actually a special kind of variable: they are initialized with the argument values at the moment a function is called, before Python enters the function body.

A variable assignment in a function body creates or updates a variable in that call's frame. A variable assigned in a function call's frame is called a **local variable** and can be accessed only within that function.

Run or step through this example. When the call begins, notice that `size` and `toppings` are already in the `pizza_price` frame. The local variable `price` is added only when Python reaches its first assignment.

~~~python_diagram_runner { editable=true title="Parameters and a Local Variable" }
def pizza_price(size: int, toppings: int) -> float:
    """Calculate the price of a pizza."""
    price: float = 10.0

    if size >= 16:
        price = 20.0

    price = price + toppings * 0.75

    return price


print(pizza_price(size=14, toppings=2))
~~~

For this call, `size` is initialized to `14` and `toppings` is initialized to `2`. The first assignment to `price` adds it to the call's frame. Later assignments update that same local variable. Try changing `size` to `16` and watch a different assignment to `price` take place.

## Reading Local and Global Variables

When Python reads a variable name inside a function, it follows **name resolution** rules. It first looks in the current function call's frame. If the variable is not local to the function, Python next looks in Globals.

In this example, `message` is read from Globals and `ending` is read from the function call's frame.

~~~python_diagram_runner { editable=true title="Local and Global Name Resolution" }
message: str = "Welcome to COMP 110"

def show_message() -> None:
    ending: str = "!"
    print(message + ending)


show_message()
~~~

If Python cannot resolve a name in the function call's frame or in Globals, it reports a **`NameError`**. Run this diagram to see the error occur when Python tries to read `greeting`.

~~~python_diagram_runner { editable=true title="An Undefined Name" }
def show_greeting() -> None:
    print(greeting)


show_greeting()
~~~

## Local Variables Stay Local

A local variable belongs to one function call's frame. Code in Globals cannot read it, and a different function call cannot read it. Once its function call is complete, its local variables are no longer generally available.

### Local Scope Helps Functions Be Black Boxes

This isolation is an important part of **function abstraction**. This concept is pervasive across many different programming languages. We can think of a function as a **black box**: to use it, we need to understand what goes in through its **parameters** and what comes out as its **return value**. Once a function is defined and verified as correct, programmers using the function should not need to know the names of its local variables or every step it takes inside.

Keeping local variables inside their function call's frame makes this possible. Each function can choose parameter and variable names that make sense for its own job without coordinating those names with every other function in the program. Functions can then be brought together and composed without their local variables colliding.

Both functions below use a parameter named `x` and a local variable named `result`. Step through the diagram and notice that each call stores these names in its own frame. The functions can be composed without either call interfering with the other call's variables.

~~~python_diagram_runner { editable=true title="Local Names Can Be Reused Safely" }
def add_one(x: int) -> int:
    """Add one to x."""
    result: int = x + 1
    return result


def double(x: int) -> int:
    """Double x."""
    result: int = x * 2
    return result


answer: int = double(x=add_one(x=3))
print(answer)
~~~

The inner call to `add_one` returns `4`, and the outer call to `double` receives that value and returns `8`. The caller cares about these inputs and return values. The choice to name an intermediate value `result` is an implementation detail hidden inside each function's black box.

### Local Variables Do Not Leave Their Frame

The returned value from `build_message` can be used in Globals, but the local variable named `result` cannot.

~~~python_diagram_runner { editable=true title="A Local Name is Not Global" }
def build_message(name: str) -> str:
    result: str = "Hello, " + name
    return result


message: str = build_message(name="Ada")
print(message)
print(result)
~~~

The final line produces a `NameError`. Returning the value stored in `result` lets the caller use that value; it does not make the local variable itself global.

### Assignments Inside Functions are Local

By default, assigning a variable inside a function places that variable in the function call's frame, even if a variable with the same name exists in Globals. These are two different variables in two different frames.

~~~python_diagram_runner { editable=true title="The Same Name in Two Frames" }
snack: str = "popcorn"

def choose_snack() -> None:
    snack: str = "pizza"
    print(snack)


choose_snack()
print(snack)
~~~

The call prints `pizza` from its local `snack`. After the call is finished, the final line prints `popcorn` from the global `snack`.

Python has a **`global` statement** for the less common case where a function truly needs to assign a global variable. The statement must appear in the function before that name is used.

~~~python { runnable=true editable=true title="Assigning a Global Variable from a Function" }
visits: int = 0

def record_visit() -> None:
    """Add one to the global visit count."""
    global visits
    visits = visits + 1


record_visit()
record_visit()
print(visits)
~~~

Without `global visits`, an assignment to `visits` in `record_visit` would refer to a local variable instead.

!!! warning "Changing Global Variables"

    A global variable whose value changes is not a static variable. Changing global variables is generally discouraged and is considered bad practice outside of very small, simple programs.

    As a program grows, many different functions could read or change the same global variable. To understand its value at one line, we may need to trace every place in the program that could have changed it. This makes larger programs difficult to reason about, test, and debug.

    Most functions should receive values through parameters and send results back with return values. This keeps each function closer to a black box whose behavior can be understood on its own.

## Scope Describes Where a Name Can Be Read

Programming languages call their rules for name resolution **scope**. A variable's scope is the region of a program where its name can be resolved and its value can be read.

For the programs we have learned so far:

- A global variable can be read by later code in Globals and by functions that do not have a local variable with the same name.
- A parameter or local variable can be read only inside its function definition during a call.
- When a name is read in a function, Python looks in the function call's frame and then in Globals. If the name cannot be found, Python reports a `NameError`.

Memory diagrams make these scope rules visible. To decide what a name means, begin with the current frame and follow the same name-resolution path that Python follows.

## Key Terminology Review

- **Variable**: A name that refers to a value in memory.
- **Declare / declaration**: Introduce a variable's name and type annotation.
- **Type annotation**: A label that communicates the kind of value a variable should refer to.
- **Initialize / initialization**: Give a variable its first value.
- **Assignment**: Store a value in a variable with the `=` operator, after evaluating the right-hand side.
- **Right-hand side (RHS)**: The expression Python evaluates to produce the value for an assignment.
- **Left-hand side (LHS)**: The variable name that tells Python where to store an assignment's value.
- **Equality operator**: The `==` operator, which asks whether two values are equal.
- **Reassignment**: Assign a new value to a variable that has already been initialized.
- **Global variable**: A variable introduced at the top level and stored in the Globals frame.
- **Static variable**: A variable intended to keep the same value for the entire program; its name uses all capital letters by convention.
- **Parameter**: A special variable initialized with an argument value when a function is called.
- **Return value**: The value a function sends back to the code that called it.
- **Local variable**: A variable stored in a function call's frame and accessible only inside that function.
- **Function abstraction / black box**: A function whose callers use its parameters and return value without needing to know its local steps or variables.
- **Frame of execution**: The part of a memory diagram that holds the variables available to one area of running code.
- **Name resolution**: The process Python uses to find the variable referred to by a name.
- **Scope**: The region of a program where a variable's name can be resolved and its value can be read.
- **`NameError`**: The error Python reports when it cannot resolve a name.
