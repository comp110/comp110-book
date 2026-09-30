---
title: Classes, Objects, and Methods
description: Learn how to define your own types with classes, construct objects, and give those objects behavior with methods.
---

## Why Define a Class?

So far, each object in this course has had a data type that is automatically built into Python, such as an `int`, a `str`, or a `list`. Many programs work with objects that are described by _several_ related values, often of different types. A player in a points-based game, for example, has a name and a score.

With only the types we know, we could use one variable for each value:

~~~python { runnable=true editable=true title="Related Values in Separate Variables" }
player_1_name: str = "Ada"
player_1_score: int = 0

player_2_name: str = "Grace"
player_2_score: int = 0

player_1_score = player_1_score + 12

print(player_1_name + " has " + str(player_1_score) + " points")
print(player_2_name + " has " + str(player_2_score) + " points")
~~~

This works, but only the naming convention connects `player_1_name` to `player_1_score`. Python treats them as two unrelated variables. Adding a third player means declaring, initializing, and keeping track of two more variables, and a function that works with one player would need a separate parameter for each of the player's values.

A **class** lets us define a new type that groups related values together. A value of that type is called an **object**. With a `Player` class, one variable can refer to one `Player` object, and that object holds both the player's name and score. Another `Player` object would also hold a name and a score, but they could contain different values.

## Defining a Class

A **class definition** begins with the keyword `class`, followed by the class's capitalized name and a colon. The indented lines that follow make up the class's body.

~~~python
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0
~~~

Let's read this definition piece by piece:

- `class Player:` defines a new type named `Player`. Class names are capitalized, and a name made of several words capitalizes each word with no underscores, as in `GameBoard` or `WeatherReport`. This makes class names easy to tell apart from snake_case variable and function names.
- The docstring describes what the class represents.
- `name: str` and `score: int` declare the class's **attributes**. An attribute is a variable that belongs to an object. Every `Player` object will have its own `name` and its own `score`. These declarations tell us each attribute's type, but they do not give the attributes values.
- `def __init__(self, name: str) -> None:` defines a special function that Python calls to initialize each new `Player` object. We will look at it closely in the next section.

Just as defining a function does not call it, defining a class does not create any objects. A class definition is a blueprint: it describes the attributes every `Player` object will have, and it can be used to create as many `Player` objects as a program needs.

## Constructing Objects

To create a new object, we call the class's name as if it were a function. This is called a **constructor call**, and each object it creates is called an **instance** of the class. The words "object" and "instance" are often used interchangeably: `ada` below refers to a `Player` object, which is an **instance** of the `Player` class.

~~~python { runnable=true editable=true title="A Constructor Call" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0


ada: Player = Player(name="Ada")

print(ada.name)
print(ada.score)
~~~

The class name is also the type used in the variable's type annotation: `ada: Player` declares that `ada` will refer to a `Player` object.

### The `__init__` Method and `self`

The special function named `__init__` (pronounced "dunder init," short for "double underscore init") is the class's **initializer** (also called a **constructor**). Its job is to give each attribute of a brand new object its first value. A function defined inside a class is called a **method**; `__init__` is the first method we have seen, and we will write many more later on this page.

The first parameter of `__init__` is named `self`. When Python calls `__init__`, it initializes `self` with a reference to the new object being constructed. Inside `__init__`, `self.name` means "the `name` attribute of the object `self` refers to."

Python evaluates the constructor call `Player(name="Ada")` in these steps:

1. Create a new `Player` object on the heap. Its attributes do not have values yet.
2. Call `__init__`, which establishes a new frame. The parameter `self` is initialized with a reference to the new object, and `name` is initialized with the argument `"Ada"`.
3. Execute the body of `__init__`. The statement `self.name = name` assigns `"Ada"` to the object's `name` attribute, and `self.score = 0` assigns `0` to its `score` attribute.
4. When the `__init__` call completes, the constructor call evaluates to a reference to the newly initialized object.

Then, the assignment stores that reference in the global variable, `ada`.

Notice that the constructor call provides an argument only for `name`. Python supplies the value of `self` automatically. Also notice the difference between `self.name` and `name` in the statement `self.name = name`: the left-hand side is the object's attribute, and the right-hand side is the `__init__` call's parameter.

## Objects Live on the Heap

Primitive types, such as `int`, `float`, and `str`, are drawn directly inside a variable's box in a memory diagram. Reference types are drawn differently. Each object is drawn in a separate area of the diagram called the **heap**. A variable that stores an instance of a class (an object of that class' type) will refer to the object on the heap based on its ID.

Step through this diagram. Pay attention to three moments:

- When the `__init__` frame is established, `self` stores the ID of the new `Player` object, whose attributes are still empty.
- As each statement in the `__init__` method body is executed, an attribute of the object on the heap receives a value.
- After the `__init__` call completes, the variable `ada` in Globals also refers to the object's ID.

~~~python_diagram_runner { editable=true title="Constructing an Object" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0


ada: Player = Player(name="Ada")
print(ada.name)
~~~

The `__init__` frame and its variables are gone once the call completes, but the object remains on the heap because `ada` still refers to it.

## Reading and Assigning Attributes

We access an object's attributes with **dot notation**: an expression that evaluates to an object, a dot, and an attribute name. To evaluate `ada.score`, Python reads the reference stored in `ada`, follows it to the object on the heap, and reads that object's `score` attribute.

An attribute can also appear on the left-hand side of an assignment. The same assignment rules from before apply: Python evaluates the right-hand side first, then stores the result in the location named on the left-hand side. For instance, this could be used to update `ada`'s `score` attribute.

~~~python_diagram_runner { editable=true title="Reading and Assigning an Attribute" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0


ada: Player = Player(name="Ada")
ada.score = ada.score + 12
print(ada.score)
~~~

To evaluate the right-hand side of `ada.score = ada.score + 12`, Python reads `0` from `ada`'s `score` attribute and adds `12`, producing `12`. The left-hand side `ada.score` names the `score` attribute of the object `ada` refers to, so `12` is stored there. The variable `ada` itself is unchanged: it still refers to the same object. Because an object's attributes can be assigned new values after the object is constructed, we say objects are **mutable**.

### Each Object Has Its Own Attributes

Every constructor call creates a separate object with its own attributes. Assigning an attribute of one object has no effect on any other object.

~~~python_diagram_runner { editable=true title="Two Separate Objects" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0


ada: Player = Player(name="Ada")
grace: Player = Player(name="Grace")

ada.score = ada.score + 12
grace.score = grace.score + 20

print(ada.name + " has " + str(ada.score) + " points")
print(grace.name + " has " + str(grace.score) + " points")
~~~

Compare this program with the one at the top of the page. Each player's name and score are now stored together in one object, and adding a third player requires only one more constructor call.

## References and Aliasing

When the right-hand side of an assignment evaluates to a reference, the reference is what gets stored. The object is _not_ copied. Two variables that hold references to the same object are called **aliases** of that object. An attribute assigned through one alias is visible through every alias, because there is only one object.

Step through this diagram and compare what happens to the `int` variables with what happens to the `Player` variables.

~~~python_diagram_runner { editable=true title="Aliasing" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0


points: int = 10
more_points: int = points
more_points = 25
print(points)

ada: Player = Player(name="Ada")
teammate: Player = ada
teammate.score = 25
print(ada.score)
~~~

The assignment `more_points: int = points` copies the value `10` into `more_points`, so reassigning `more_points` does not affect `points`, which is still `10`. The assignment `teammate: Player = ada` copies the _reference_ stored in `ada`, so both variables have arrows to the same object. Assigning `teammate.score` changes that one object's `score` attribute, and reading `ada.score` evaluates to `25`.

Reassigning an alias is different from assigning one of its attributes. If the program later executed `teammate = Player(name="Grace")`, `teammate` would receive a reference to a new object, and `ada` would still refer to the original object.

## Objects as Arguments and Return Values

A function can have a parameter that refers to an instance of a class. When the function is called, the parameter is initialized with a copy of the argument's _reference_, so the parameter and the argument are aliases of the same object.

~~~python_diagram_runner { editable=true title="Passing an Object to a Function" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0


def award_bonus(player: Player, bonus: int) -> None:
    """Add bonus points to a player's score."""
    player.score = player.score + bonus


ada: Player = Player(name="Ada")
award_bonus(player=ada, bonus=5)
print(ada.score)
~~~

The parameter `player` is a local variable in the `award_bonus` frame, just like any other parameter. The statement in the function body, however, does not reassign `player`. It assigns the `score` attribute of the object `player` refers to, which is the same object `ada` refers to. That change remains visible after the call completes.

A function can also return a reference to an object. This function returns whichever of its two arguments has the higher score. It returns a reference to one of the existing objects rather than creating a new one.

~~~python_diagram_runner { editable=true title="Returning a Reference" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0


def leader(a: Player, b: Player) -> Player:
    """Return the player with the higher score, or a if they are tied."""
    if a.score >= b.score:
        return a
    else:
        return b


ada: Player = Player(name="Ada")
grace: Player = Player(name="Grace")
grace.score = 20

winner: Player = leader(a=ada, b=grace)
print(winner.name)
~~~

After the call completes, `winner` and `grace` are aliases: both have arrows to the same `Player` object on the heap.

## Methods

The `award_bonus` function above works, but it is defined separately from the `Player` class even though its only purpose is to update a `Player`. A **method** is a function defined inside a class body. Methods let a class define both the data each object holds and the operations that can be performed on those objects.

### Defining a Method

A method definition looks like a function definition, indented inside the class body. Its first parameter is always `self`.

~~~python
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0

    def earn_points(self, points: int) -> None:
        """Add points to this player's score."""
        self.score = self.score + points
~~~

The `earn_points` method has two parameters: `self`, which will refer to the `Player` object the method is called on, and `points`, the number of points to add.

### Calling a Method

A **method call** uses dot notation: an expression that evaluates to an object, a dot, the method's name, and arguments in parentheses. The expression before the dot determines which object the method is called on.

~~~python_diagram_runner { editable=true title="A Method Call" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0

    def earn_points(self, points: int) -> None:
        """Add points to this player's score."""
        self.score = self.score + points


ada: Player = Player(name="Ada")
grace: Player = Player(name="Grace")

ada.earn_points(points=12)
grace.earn_points(points=20)
ada.earn_points(points=5)

print(ada.score)
print(grace.score)
~~~

Python evaluates the method call `ada.earn_points(points=12)` in these steps:

1. Evaluate the expression before the dot. `ada` evaluates to a reference to a `Player` object.
2. Find the `earn_points` method defined in that object's class, `Player`.
3. Establish a new frame for the call. The parameter `self` is initialized with the reference from step 1, and `points` is initialized with the argument `12`.
4. Execute the method's body. `self.score = self.score + points` assigns `12` to the `score` attribute of the object `self` refers to.

As with `__init__`, the call does not include an argument for `self`. Python initializes `self` with the reference from the expression before the dot. In the diagram, notice that `self` refers to `ada`'s object during the first and third calls and to `grace`'s object during the second call. The same method definition works with whichever object it is called on.

### Methods Compare to Functions

The method call `ada.earn_points(points=5)` has the same effect on `ada`'s object as the function call `award_bonus(player=ada, bonus=5)` from earlier. The difference is where the definition lives and how the object is passed in:

| | Function | Method |
|---|---|---|
| Definition | `def award_bonus(player: Player, bonus: int) -> None:` at the top level | `def earn_points(self, points: int) -> None:` inside the class body |
| Call | `award_bonus(player=ada, bonus=5)` | `ada.earn_points(points=5)` |
| How the object is passed | As an ordinary argument | As the expression before the dot, which initializes `self` |

Defining operations as methods keeps them together with the class they belong to. Someone reading the `Player` class can see both what a player _has_ (its attributes) and what can be done with a player (its methods) in one place.

### Methods Can Return Values

Like functions, methods can return values. A method that returns a value usually computes it from the object's attributes. The `has_won` method below evaluates a Boolean expression each time it is called, so its result always reflects the object's current `score`.

~~~python_diagram_runner { editable=true title="A Method that Returns a Value" }
WINNING_SCORE: int = 100


class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0

    def earn_points(self, points: int) -> None:
        """Add points to this player's score."""
        self.score = self.score + points

    def has_won(self) -> bool:
        """Return whether this player has reached the winning score."""
        return self.score >= WINNING_SCORE


ada: Player = Player(name="Ada")
ada.earn_points(points=60)
print(ada.has_won())

ada.earn_points(points=45)
print(ada.has_won())
~~~

The first call to `has_won` returns `False` because `60 >= 100` evaluates to `False`. After Ada earns 45 more points, the second call returns `True`. In the body of `has_won`, `self.score` is an attribute of the object, and the static variable `WINNING_SCORE` is resolved using the name resolution rules you already know: it is not a local variable in the method's frame, so Python finds it in Globals.

A method with no parameters other than `self`, such as `has_won`, is still called with empty parentheses. Writing `ada.has_won` without parentheses does not call the method.

### Methods Can Call Other Methods

Inside a method, `self` refers to an object, so the method can call other methods on that same object with `self.` followed by the method name.

~~~python { runnable=true editable=true title="A Method Calling Another Method" }
WINNING_SCORE: int = 100


class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0

    def earn_points(self, points: int) -> None:
        """Add points to this player's score."""
        self.score = self.score + points

    def has_won(self) -> bool:
        """Return whether this player has reached the winning score."""
        return self.score >= WINNING_SCORE

    def status(self) -> str:
        """Return a description of this player's progress."""
        if self.has_won():
            return self.name + " has won with " + str(self.score) + " points!"
        else:
            return self.name + " has " + str(self.score) + " points."


ada: Player = Player(name="Ada")
ada.earn_points(points=60)
print(ada.status())

ada.earn_points(points=45)
print(ada.status())
~~~

When `status` evaluates the condition `self.has_won()`, a new frame is established for the `has_won` call, and its `self` is initialized with the same reference as `status`'s `self`.

### Methods Can Work with `float` Attributes, Too

Here is another class whose methods include one that returns a value and one that updates attributes. The `distance_to_origin` method uses the same calculation as the `distance` function from Variable Fundamentals, with `self.x` and `self.y` as one of the points and the origin as the other.

~~~python { runnable=true editable=true title="A Point Class" }
class Point:
    """A point on a two-dimensional plane."""

    x: float
    y: float

    def __init__(self, x: float, y: float) -> None:
        """Initialize a Point's coordinates."""
        self.x = x
        self.y = y

    def distance_to_origin(self) -> float:
        """Calculate the straight-line distance from this point to (0, 0)."""
        return (self.x * self.x + self.y * self.y) ** 0.5

    def translate(self, dx: float, dy: float) -> None:
        """Move this point by dx horizontally and dy vertically."""
        self.x = self.x + dx
        self.y = self.y + dy


p: Point = Point(x=3.0, y=4.0)
print(p.distance_to_origin())

p.translate(dx=3.0, dy=4.0)
print(p.distance_to_origin())
~~~

## Common Errors

### Forgetting `self.` When Initializing an Attribute

In `__init__`, an assignment without `self.` assigns a local variable in the `__init__` frame, following the same rule as any other assignment in a function body. The attribute of the new object is never assigned a value. Step through this diagram and watch where `score` appears.

~~~python_diagram_runner { editable=true title="A Local Variable Instead of an Attribute" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        score = 0


ada: Player = Player(name="Ada")
print(ada.name)
print(ada.score)
~~~

The `score` variable is added to the `__init__` frame, not to the object on the heap, and it is gone once the call completes. When the final line tries to read `ada.score`, Python reports an **`AttributeError`**: the object has no `score` attribute.

### Forgetting `self.` When Reading an Attribute

Inside a method, an attribute must be read through `self`. A name written by itself is resolved by the usual name resolution rules: Python looks in the method call's frame, then in Globals. The object's attributes are not checked.

~~~python_diagram_runner { editable=true title="An Attribute Read Without self" }
class Player:
    """A player in a points-based game."""

    name: str
    score: int

    def __init__(self, name: str) -> None:
        """Initialize a new Player with a score of 0."""
        self.name = name
        self.score = 0

    def has_points(self) -> bool:
        """Return whether this player has earned any points."""
        return score > 0


ada: Player = Player(name="Ada")
print(ada.has_points())
~~~

Because `score` is neither a local variable in the `has_points` frame nor a variable in Globals, Python reports a `NameError`. Writing `self.score` fixes the error.

## Key Terminology Review

- **Class**: A definition of a new type that describes the attributes and methods its objects will have.
- **Class definition**: A statement beginning with `class` that defines a class's name, attributes, and methods.
- **Object / instance**: A value of a class's type, created by a constructor call and stored on the heap.
- **Attribute**: A variable that belongs to an object. Each object has its own attributes.
- **Constructor call**: A call to a class's name, such as `Player(name="Ada")`, that creates and initializes a new object and evaluates to a reference to it.
- **Initializer (`__init__`)**: The special method Python calls during a constructor call to give a new object's attributes their first values.
- **`self`**: The first parameter of every method, initialized with a reference to the object the method is called on.
- **Heap**: The area of a memory diagram where objects are drawn.
- **Reference**: A value that identifies an object on the heap, drawn as an arrow from a variable to the object.
- **Dot notation**: The syntax `expression.name` for accessing an attribute or calling a method on the object the expression evaluates to.
- **Mutable**: Able to be changed after construction. An object's attributes can be assigned new values.
- **Alias**: One of two or more variables or parameters that hold references to the same object.
- **Method**: A function defined inside a class body whose first parameter is `self`.
- **Method call**: A call such as `ada.earn_points(points=12)`, in which the expression before the dot initializes `self`.
- **`AttributeError`**: The error Python reports when an object does not have an attribute with the requested name.