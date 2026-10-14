---
title: More OOP Practice
description: Diagramming, diagramming, diagramming!
---

This page has four programs to read, trace, and diagram. Together they practice three ideas:

- how **classes and protocols work together**, so that one piece of code can use objects of several different classes,
- **when Python calls the magic methods** `__init__`, `__str__`, and `__repr__`, and what happens when a class does not define them, and
- **dynamic dispatch**: how Python decides which method body to run when the same method call can reach objects of different classes.

For a full introduction to protocols, see [Protocols and Interfaces](protocols-interfaces.md). For more practice writing `__str__` and `__repr__`, see [Practice: Classes, Objects, and Methods](intro-oop-practice.md).

## A receipt from purchases at a movie theater! 

A movie theater sells tickets and popcorn, and prints a receipt with the total price including tax. Read the whole program before reading the explanations below it.

```python
from typing import Protocol

TAX_RATE: float = 0.07


def main() -> None:
    late: Ticket = Ticket(False)
    print(late)
    print(late.price())
    early: Ticket = Ticket(True)
    print(early)
    print(early.price())
    snack: Popcorn = Popcorn("large", False)
    print(repr(snack))
    my_receipt: Receipt = Receipt()
    my_receipt.add(late)
    my_receipt.add(early)
    my_receipt.add(snack)
    print(my_receipt.total())


class Ticket:
    matinee: bool

    def __init__(self, matinee: bool):
        self.matinee = matinee

    def __str__(self) -> str:
        if self.matinee:
            return "ticket (matinee)"
        else:
            return "ticket"

    def __repr__(self) -> str:
        return f"Ticket(matinee={self.matinee})"

    def price(self) -> float:
        if self.matinee:
            return 8.0
        else:
            return 12.0


class Popcorn:
    size: str
    butter: bool

    def __init__(self, size: str, butter: bool):
        self.size = size
        self.butter = butter

    def __str__(self) -> str:
        if self.butter:
            return f"{self.size} popcorn with butter"
        else:
            return f"{self.size} popcorn, no butter"

    def __repr__(self) -> str:
        return f"Popcorn(size={self.size!r}, butter={self.butter})"

    def price(self) -> float:
        if self.size == "small":
            return 7.0
        elif self.size == "medium":
            return 8.0
        else:
            return 10.0


class ReceiptItem(Protocol):
    def __str__(self) -> str: ...

    def price(self) -> float: ...


class Receipt:
    items: list[ReceiptItem]
    tax: float

    def __init__(self):
        self.items = []
        self.tax = TAX_RATE

    def add(self, item: ReceiptItem) -> None:
        self.items.append(item)

    def total(self) -> float:
        total_price: float = 0.0
        idx: int = 0
        while idx < len(self.items):
            total_price += self.items[idx].price()
            idx += 1
        return total_price * (1 + self.tax)


if __name__ == "__main__":
    main()
```

??? note "What does this program print?"

    Predict the output before you open this.

    ```text
    ticket
    12.0
    ticket (matinee)
    8.0
    Popcorn(size='large', butter=False)
    32.1
    ```

### How the Classes and the Protocol Work Together

This program has three ordinary classes and one protocol, and each one has a different job:

| Definition | Its job |
|---|---|
| `Ticket`, `Popcorn` | Things a customer can buy. Each one knows its own price and how to describe itself. |
| `Receipt` | Collects purchases and adds up their prices. |
| `ReceiptItem` (protocol) | Describes what `Receipt` needs from a purchase: a `price` method that returns a `float`, and a `__str__` method that returns a `str`. |

`Receipt` never mentions `Ticket` or `Popcorn`. Its `items` attribute is annotated `list[ReceiptItem]`, and `add`'s parameter is annotated `item: ReceiptItem`. In the other direction, neither `Ticket` nor `Popcorn` mentions `ReceiptItem`. They **satisfy** the protocol simply because each class defines every method the protocol lists, with matching parameter and return types. That is why `my_receipt.add(late)` and `my_receipt.add(snack)` are both allowed, even though `late` and `snack` refer to objects of different classes.

The protocol is the agreement between the two sides. If the theater starts selling a `Soda` class, `Receipt` does not need to change: any class with a `price` method that returns a `float` can be added to a receipt.

A protocol only matters to the type checker and to people reading the code. When the program runs, the `class ReceiptItem(Protocol):` definition does not change which methods are called, and a `ReceiptItem` object is never constructed. This is why the memory diagrams on this page never show a protocol in Globals or on the heap.

??? tip "Why does `ReceiptItem` list `__str__`?"

    Every object in Python already has a `__str__` method, even if its class does not define one (see the next section). So every class satisfies the `__str__` part of `ReceiptItem` automatically. Listing it in the protocol still tells readers something useful: code that receives a `ReceiptItem` is expected to print it. The `price` method is the part of the protocol a class could actually be missing.

### When Magic Methods Are Called

A **magic method** is a method whose name starts and ends with two underscores. You rarely call a magic method by name. Instead, Python calls it for you when your code does something specific:

| When your code... | Python calls... | Example from Theater |
|---|---|---|
| calls a class's name, like a function | `__init__`, on the newly constructed object | `Ticket(False)` |
| passes an object to `print` | `__str__` | `print(late)` |
| calls `str` on an object | `__str__` | `str(late)` |
| puts an object in an f-string with `{...}` | `__str__` | `f"{late}"` |
| calls `repr` on an object | `__repr__` | `repr(snack)` |
| puts an object in an f-string with `{...!r}` | `__repr__` | `f"{snack!r}"` |
| prints a list | `__repr__`, on each item in the list | `print(my_receipt.items)` |

Let's apply this table to the first lines of `main`:

- `Ticket(False)` constructs a new `Ticket` object on the heap, then calls `Ticket`'s `__init__` with `self` referring to that new object and `matinee` bound to `False`. `__init__` assigns the object's `matinee` attribute. The constructor call then evaluates to a reference to the new object, which is assigned to `late`.
- `print(late)` calls `Ticket`'s `__str__`, with `self` referring to the same object as `late`. Its `matinee` attribute is `False`, so `__str__` returns `"ticket"`, and `print` prints `ticket`.
- `print(late.price())` does **not** call a magic method on `late`. The expression `late.price()` evaluates to the `float` `12.0` first, and `print` prints that number.
- `print(repr(snack))` calls `Popcorn`'s `__repr__`, which returns `"Popcorn(size='large', butter=False)"`. The `!r` in `{self.size!r}` uses the `__repr__` of the string `"large"`, which adds the quotation marks. A `__repr__` is meant to look like the code that would construct an equal object.

### How Magic Methods Override the Default Behavior

Every object starts out with a default version of each magic method. Defining a magic method in a class **overrides** the default: Python finds the class's own version first and calls it instead.

| If the class... | then `print(obj)` prints... | and `repr(obj)` returns... |
|---|---|---|
| defines `__str__` and `__repr__` | what `__str__` returns | what `__repr__` returns |
| defines only `__repr__` | what `__repr__` returns | what `__repr__` returns |
| defines only `__str__` | what `__str__` returns | the default: `<__main__.Ticket object at 0x102098590>` |
| defines neither | the default: `<__main__.Ticket object at 0x102098590>` | the default: `<__main__.Ticket object at 0x102098590>` |

The default text names the object's class and its location in memory, so the number after `0x` changes from run to run. The second row matters: when a class has no `__str__`, Python falls back to `__repr__`. So a class that defines only `__repr__` still prints something readable.

`__init__` has a default too. A class without an `__init__` method, such as `BopIt` in the last example on this page, is constructed with no arguments: `BopIt()`. Its objects start with no attributes assigned.

### Dynamic Dispatch in `total`

Look at the one line inside `total`'s `while` loop:

```python
total_price += self.items[idx].price()
```

By the time `total` is called, `self.items` refers to a list of three objects: a `Ticket`, another `Ticket`, and a `Popcorn`. The same expression, `self.items[idx].price()`, is evaluated three times, but it calls a different method body depending on which object `self.items[idx]` refers to:

| `idx` | `self.items[idx]` refers to | Method called | Returns |
|---|---|---|---|
| `0` | the `Ticket` with `matinee` `False` | `Ticket`'s `price` | `12.0` |
| `1` | the `Ticket` with `matinee` `True` | `Ticket`'s `price` | `8.0` |
| `2` | the `Popcorn` with `size` `"large"` | `Popcorn`'s `price` | `10.0` |

So `total_price` is `30.0` after the loop, and `total` returns `30.0 * (1 + 0.07)`, which is `32.1`.

This is **dynamic dispatch**: Python picks which method to run *while the program runs*, based on the class of the object that the expression before the dot refers to. It does not use the annotation `ReceiptItem` to choose. It cannot, because `ReceiptItem`'s methods have no bodies to run. See [Dynamic Dispatch](#dynamic-dispatch) at the end of this page for more on when and why this matters.

## Two-Player Board Game (Tic Tac Toe)

Step through this diagram and watch when the `Player#__str__` frame appears.

~~~python_diagram_runner { editable=true title="A tiny two-player board game!" }
class Player:
   name: str
   mark: str

   def __init__(self, name: str, mark: str):
       self.name = name
       self.mark = mark

   def __str__(self) -> str:
       return f"{self.name} ({self.mark})"

class Board:
   grid: list[list[str]]
   players: list[Player]
   turn: int

   def __init__(self, p1: Player, p2: Player):
       self.grid = [["", ""], ["", ""]]
       self.players = [p1, p2]
       self.turn = 0

   def place(self, row: int, col: int) -> None:
       self.grid[row][col] = self.players[self.turn].mark
       if self.turn == 0:
           self.turn = 1
       else:
           self.turn = 0

k: Player = Player("Kayla", "X")
b: Player = Player("Ben", "O")
board: Board = Board(k, b)
print(board.players[board.turn])
board.place(0, 1)
board.place(1, 0)
print(board.grid)
~~~

### What to Notice

- **`__init__` runs once per constructor call.** There are three constructor calls, so there are three `__init__` frames: two for `Player` and one for `Board`. In `Board`'s `__init__`, the list `[p1, p2]` holds references to the *same* `Player` objects that `k` and `b` refer to. No new `Player` objects are constructed.
- **`print(board.players[board.turn])` calls `__str__`.** `board.turn` is `0`, so the expression evaluates to a reference to Kayla's `Player` object. `print` calls `Player`'s `__str__` on it, which returns `"Kayla (X)"`.
- **`print(board.grid)` calls `__repr__` on each item, not `__str__`.** A list is printed using each item's `__repr__`. The items are strings, and a string's `__repr__` includes quotation marks, so the program prints `[['', 'X'], ['O', '']]` rather than `[[, X], [O, ]]`. Without the quotation marks, you could not see the empty strings. The same rule applies to a list of objects: printing `board.players` would use `Player`'s `__repr__`, and because `Player` defines only `__str__`, each item would print with the default `<__main__.Player object at 0x...>` text.
- **`Board` has no `__str__` or `__repr__`.** So `print(board)` would print the default text. Try adding a `__str__` method to `Board` in the editor that returns the grid as rows, then add `print(board)` to the end.

## Cat Class and Objects

~~~python_diagram_runner { editable=true title="Cat class and objects" }
class Cat:
   name: str
   age: int

   def __init__(self, name: str):
       self.name = name
       self.age = 0

   def birthday(self) -> None:
       self.age += 1

   def __str__(self) -> str:
       return f"{self.name} is {self.age}"


cat_a: Cat = Cat("Hank")
cat_b: Cat = Cat("Clover")
cat_a.birthday()
print(cat_a)
print(cat_b)
print(cat_b.name)
~~~

### What to Notice

- **`__init__` can set attributes that are not parameters.** `Cat`'s `__init__` has only a `name` parameter, but it assigns both attributes. Every new `Cat` starts with `age` `0`.
- **Each object has its own attributes.** `cat_a.birthday()` calls `birthday` with `self` referring to Hank's object, so only Hank's `age` changes. The program prints `Hank is 1`, then `Clover is 0`.
- **`__str__` is called based on the value `print` receives.** `print(cat_b)` receives a reference to a `Cat` object, so it calls `Cat`'s `__str__` and prints `Clover is 0`. `print(cat_b.name)` receives the string `"Clover"`, not a `Cat`, so `Cat`'s `__str__` is not called at all. It prints `Clover`.

## Bop It!

In the game Bop It!, a player follows a sequence of spoken commands. In this program, every command is an object with a `phrase` method that returns what the game says. Step through this diagram and pay attention to which `phrase` frame is created each time `phrase()` is called.

~~~python_diagram_runner { editable=true title="BopIt commands!" }
from typing import Protocol

class Command(Protocol):
   def phrase(self) -> str: ...

class BopIt:
   def phrase(self) -> str:
       return "Bop It! "

class TwistIt:
   def phrase(self) -> str:
       return "Twist It! "

class RepeatIt:
   cmd: Command
   times: int

   def __init__(self, cmd: Command, times: int):
       self.cmd = cmd
       self.times = times

   def phrase(self) -> str:
       return self.cmd.phrase() * self.times

game: list[Command] = [BopIt(), RepeatIt(TwistIt(), times=2)]
idx: int = 0
while idx < len(game):
   print(game[idx].phrase())
   idx += 1
~~~

### How the Classes and the Protocol Work Together

`Command` says that a command is any object with a `phrase` method that returns a `str`. `BopIt`, `TwistIt`, and `RepeatIt` all satisfy `Command`, so `game`, annotated `list[Command]`, can hold objects of all three classes.

`RepeatIt` uses the protocol in two ways at once:

1. It **satisfies** `Command`, because it has a `phrase` method that returns a `str`. So a `RepeatIt` object can go in `game`.
2. It **has** a `Command`: its `cmd` attribute is annotated `Command`. So a `RepeatIt` can wrap *any* command, including a `BopIt`, a `TwistIt`, or even another `RepeatIt`.

`BopIt` and `TwistIt` define no `__init__` method, so they use the default `__init__` and are constructed with no arguments: `BopIt()` and `TwistIt()`. Their objects have no attributes, and their only job is to provide a `phrase` method.

### Dynamic Dispatch, Twice

The loop body evaluates `game[idx].phrase()` twice, and each evaluation calls a different `phrase` method:

- When `idx` is `0`, `game[idx]` refers to the `BopIt` object, so `BopIt`'s `phrase` is called. It returns `"Bop It! "`.
- When `idx` is `1`, `game[idx]` refers to the `RepeatIt` object, so `RepeatIt`'s `phrase` is called. Inside it, `self.cmd.phrase()` is a **second** dynamically dispatched call. `self.cmd` refers to the `TwistIt` object, so `TwistIt`'s `phrase` is called, and its frame appears on the stack *above* the `RepeatIt#phrase` frame. It returns `"Twist It! "`, and `RepeatIt`'s `phrase` returns `"Twist It! " * 2`, which is `"Twist It! Twist It! "`.

Notice that `RepeatIt`'s `phrase` method does not know or care which class `self.cmd` refers to. It works with any `Command`.

??? note "Predict: a `RepeatIt` inside a `RepeatIt`"

    What does this line print? How many `phrase` frames are on the stack at the deepest point?

    ```python
    print(RepeatIt(RepeatIt(BopIt(), times=2), times=2).phrase())
    ```

    It prints `Bop It! Bop It! Bop It! Bop It! `. The outer `RepeatIt`'s `phrase` calls the inner `RepeatIt`'s `phrase`, which calls `BopIt`'s `phrase`. So at the deepest point there are three `phrase` frames: outer `RepeatIt`, inner `RepeatIt`, then `BopIt`. The inner call returns `"Bop It! " * 2`, and the outer call repeats that result twice.

## Dynamic Dispatch

**Dynamic dispatch** is how Python decides which method body to run for a method call. When Python evaluates a call such as `game[idx].phrase()`, it:

1. evaluates the expression before the dot, `game[idx]`, to a reference to an object on the heap,
2. looks up `phrase` in *that object's class*, and
3. calls that class's `phrase`, with `self` referring to the object.

The word *dynamic* means the choice is made while the program runs, each time the call is evaluated. It is not made once, when the code is written. Type annotations and protocols take no part in the choice.

### When Is It Used?

Dynamic dispatch happens on **every** method call, and it is also how Python chooses which magic method to call: `print(late)` calls `Ticket`'s `__str__` because `late` refers to a `Ticket` object. You only *notice* it when one line of code can reach objects of different classes. In practice, that happens when a variable, parameter, attribute, or list is annotated with a protocol type, as in all three of these lines from this page:

| Line | Annotated with | Can refer to |
|---|---|---|
| `self.items[idx].price()` in `Receipt` | `list[ReceiptItem]` | a `Ticket` or a `Popcorn` |
| `game[idx].phrase()` in the loop | `list[Command]` | a `BopIt`, a `TwistIt`, or a `RepeatIt` |
| `self.cmd.phrase()` in `RepeatIt` | `Command` | any of the three command classes |

### Why Is It Useful?

Without dynamic dispatch, `total` would need to check what kind of item each one is: `if` it is a `Ticket`, compute a ticket price, `elif` it is a `Popcorn`, compute a popcorn price, and so on. Every new item class would mean editing `total`.

With dynamic dispatch, each class keeps the knowledge about itself (its own `price`, its own `phrase`, its own `__str__`), and the code that *uses* those objects stays short and never changes. Adding a `PullIt` command to Bop It! takes one new class with a `phrase` method. The `while` loop and `RepeatIt` keep working without a single edit.

??? note "You Try: Add a `PullIt` command"

    In the Bop It! diagram above, define a `PullIt` class whose `phrase` method returns `"Pull It! "`. Then change `game` so that the program prints `Bop It! `, then `Twist It! Twist It! `, then `Pull It! Pull It! Pull It! `. Which lines outside of your new class did you need to change?

    ??? note "Show a solution"

        ```python
        class PullIt:
           def phrase(self) -> str:
               return "Pull It! "

        game: list[Command] = [BopIt(), RepeatIt(TwistIt(), times=2), RepeatIt(PullIt(), times=3)]
        ```

        The only other change is the list assigned to `game`. The `while` loop, `RepeatIt`, and `Command` are unchanged.

## Key Terminology Review

- **Magic method**: A method whose name starts and ends with two underscores, such as `__init__`, `__str__`, or `__repr__`. Python calls it for you when your code does something specific, such as constructing an object or printing one.
- **`__init__`**: The magic method Python calls right after constructing a new object, to assign its attributes. A class without one is constructed with no arguments.
- **`__str__`**: The magic method `print`, `str`, and f-strings call to get a readable description of an object, for a person.
- **`__repr__`**: The magic method `repr`, list printing, and f-strings with `!r` call to get an unambiguous description of an object, for a programmer. It is also used by `print` when a class has no `__str__`.
- **Override**: To define a method in a class that replaces a default version, so Python calls the class's version instead.
- **Satisfy (a protocol)**: To have every attribute and method a protocol lists, with matching types. A class does not need to name the protocol it satisfies.
- **Dynamic dispatch**: Choosing which method body to run while the program runs, based on the class of the object the expression before the dot refers to.
