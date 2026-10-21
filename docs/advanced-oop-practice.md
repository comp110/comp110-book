---
title: "Practice: Classes, Magic Methods, Protocols, and 2D Lists"
description: Mixed practice with classes, objects, methods, __init__, __str__, __repr__, protocols, 2D lists, and nested loops, aimed at the most common misunderstandings of each.
---

## How to Use This Page

This page covers the main concepts we have introduced and/or practiced since Quiz 01. Each section targets a mistake we commonly see, so these problems are a good way to find out what you’ve got down and what still needs work.

How to use this page: We don't expect you to do everything (but you are welcome to!). Skim the section headings, and start with the topics that feel least solid. Try each problem by hand before running any code or skipping to the answer, since that’s how you’ll complete the quiz.

This page mixes several kinds of questions. Each one is labeled with its type:

| Type | What you do |
|---|---|
| **Multiple Choice** | Choose the one best answer. |
| **Select All** | Choose every option that is true. There may be one correct option or several. |
| **One Line** | Write a single expression or statement. |
| **Predict** | Write down exactly what a program prints, or which error it reports, before you execute it. |
| **Memory Diagram** | Draw the diagram on paper first, then step through the program and compare. |
| **Trace Table** | Fill in a table with the values of variables each time a line is reached. |
| **Match** | Pair each item in one column with an item in the other. |
| **Parsons** | Put scrambled lines of code in order and indent them. Some lines are distractors that do not belong. |
| **Write It** | Write a function, method, class, or protocol. |
| **Evaluate** | Decide whether code is correct for _every_ input, and give an input that shows the problem if it is not. |
| **Office Hours** | Read a student's question and write the explanation you would give them. |

Commit to an answer before you open any "Check your answers" box. A wrong prediction that you then correct teaches you more than a right answer you only recognized after reading it.

Each code block runs on its own, so classes are defined again in each block that uses them.

## Part 1: Classes and Objects

Questions 1.1 through 1.3 use this `Book` class.

~~~python
class Book:
    """A book on a reading list."""

    title: str
    pages: int
    pages_read: int

    def __init__(self, title: str, pages: int):
        """Initialize a Book that has not been started."""
        self.title = title
        self.pages = pages
        self.pages_read = 0

    def read(self, pages: int) -> None:
        """Record that pages more pages of this book were read."""
        self.pages_read = self.pages_read + pages
~~~

### 1.1 Multiple Choice: How Many Objects?

**(a)** Python executes the `Book` class definition above, and no other statements. How many `Book` objects are on the heap?

- **A.** 0
- **B.** 1
- **C.** 3, one for each attribute
- **D.** 2, one for each method

**(b)** Python then executes these three statements. How many `Book` objects are on the heap now?

~~~python
novel: Book = Book(title="Piranesi", pages=272)
same: Book = novel
guide: Book = Book(title="Piranesi", pages=272)
~~~

- **A.** 1, because both constructor calls have the same arguments
- **B.** 2
- **C.** 3, one for each variable
- **D.** 0, because `Book` objects are stored in Globals, not on the heap

??? note "Check your answers"

    **(a) A.** A class definition is a blueprint. Like a function definition, it makes something available for later use, but it does not create any objects. Objects are created only by constructor calls.

    **(b) B.** There are two constructor calls, so there are two objects. `same: Book = novel` copies the _reference_ stored in `novel`; it does not construct a new object. Two constructor calls with equal arguments still construct two separate objects, which happen to have attributes with equal values.

### 1.2 Select All: What Is `self`?

Consider the method call `novel.read(pages=30)`. Select **every** true statement.

- **A.** Python initializes `self` with the reference stored in `novel`.
- **B.** The call must be written `novel.read(self=novel, pages=30)` so that `read` knows which object to update.
- **C.** During the call, `self` and `novel` are aliases.
- **D.** Inside `read`, the name `pages` refers to the book's `pages` attribute.
- **E.** After the call completes, the `read` frame (including `self`) is gone, but the change to the object's `pages_read` attribute remains.
- **F.** `self` is a reserved keyword in Python, so naming the first parameter anything else is a syntax error.

??? note "Check your answers"

    **A, C, and E** are true.

    - **B** is false. Python supplies the value of `self` automatically from the expression before the dot. Writing `self=novel` in the call raises a `TypeError`.
    - **D** is false, and this is a very common misunderstanding. `pages` by itself is resolved by the usual name resolution rules: Python looks in the `read` frame first, finds the _parameter_ `pages`, and uses its value, `30`. The attribute is read only with `self.pages`. This class happens to use the same name for a parameter and an attribute, which makes the difference easy to miss.
    - **F** is false. `self` is a naming convention, not a keyword. Python initializes the first parameter of a method with the reference, whatever that parameter is named. Always name it `self` anyway, because every Python programmer expects that name.

### 1.3 One Line: Attributes, Methods, and Reassignment

Using `novel`, `same`, and `guide` from question 1.1(b), write **one line** for each:

1. An expression that evaluates to the number of pages of `novel` that are left to read.
2. A statement that records reading 50 pages of `guide` by calling a method.
3. A statement that makes `same` refer to the same object as `guide`, without changing any object's attributes.
4. A statement that changes `novel`'s title to `"Piranesi (Library Copy)"`.

??? note "Check your answers"

    1. `novel.pages - novel.pages_read`
    2. `guide.read(pages=50)`
    3. `same = guide`
    4. `novel.title = "Piranesi (Library Copy)"`

    Compare lines 3 and 4. Line 3 reassigns a _variable_: only the ID stored in `same` changes, and no object changes. Line 4 assigns an _attribute_: the object `novel` refers to changes, so reading `same.title` before line 3 executes would also evaluate to `"Piranesi (Library Copy)"`.

### 1.4 Memory Diagram: A Shelf of References

A list can hold references to objects, just like a variable can. On paper, draw the complete memory diagram for this program as it would look just before it finishes, and write down its output. Then step through it and compare.

~~~python_diagram_runner { editable=true title="Book Diagram" }
class Book:
    """A book on a reading list."""

    title: str
    pages: int
    pages_read: int

    def __init__(self, title: str, pages: int):
        """Initialize a Book that has not been started."""
        self.title = title
        self.pages = pages
        self.pages_read = 0

    def read(self, pages: int) -> None:
        """Record that pages more pages of this book were read."""
        self.pages_read = self.pages_read + pages


novel: Book = Book(title="Piranesi", pages=272)
memoir: Book = Book(title="Educated", pages=334)

shelf: list[Book] = [novel, memoir, novel]
shelf[2].read(pages=40)
shelf[0].read(pages=10)

memoir = Book(title="Educated", pages=334)
shelf[1].read(pages=25)

print(novel.pages_read)
print(memoir.pages_read)
print(shelf[1].pages_read)
print(len(shelf))
~~~

1. How many `Book` objects are on the heap when the program finishes?
2. How many references hold the heap ID of the `"Piranesi"` object? Where is each one stored?
3. After `memoir` is reassigned, which object does `shelf[1]` refer to?
4. What four lines are printed?

??? note "Check your answers"

    1. Three. There are three constructor calls, and two of them construct `"Educated"` objects.
    2. Three references: the variable `novel` in Globals, and the items at index `0` and index `2` of the list all store its ID. `shelf[2].read(pages=40)` and `shelf[0].read(pages=10)` both update this one object.
    3. The _first_ `"Educated"` object. Reassigning `memoir` changes only the ID stored in the variable `memoir`. The list item at index `1` still holds the ID it was given when the list was constructed.
    4. `50`, `0`, `25`, and `3`. The second `"Educated"` object, which `memoir` now refers to, has never been read.

## Part 2: Magic Methods

### 2.1 Match: Which Method Does Python Call?

The `Book` class now defines `__str__` and `__repr__` as well (their bodies are not shown).

~~~python
class Book:
    """A book on a reading list."""

    title: str
    pages: int
    pages_read: int

    def __init__(self, title: str, pages: int): ...
    def read(self, pages: int) -> None: ...
    def __str__(self) -> str: ...
    def __repr__(self) -> str: ...


novel: Book = Book(title="Piranesi", pages=272)
shelf: list[Book] = [novel, Book(title="Educated", pages=334)]
~~~

Match each expression or statement on the left with the method of `Book` that Python calls when it is evaluated. A choice can be used more than once.

| Expression or statement | | Choices |
|---|---|---|
| 1. `Book(title="Educated", pages=334)` | | **W.** `__init__` |
| 2. `print(novel)` | | **X.** `__str__` |
| 3. `repr(novel)` | | **Y.** `__repr__`, once for each item |
| 4. `print(shelf)` | | **Z.** `__repr__`, once |
| 5. `"Now reading: " + str(novel)` | | **N.** None of `Book`'s methods |
| 6. `print(novel.title)` | | **E.** None; Python raises an error |
| 7. `print(str(shelf))` | | |
| 8. `"Now reading: " + novel` | | |

??? note "Check your answers"

    1. **W.** A constructor call calls `__init__`.
    2. **X.** `print` converts a value that is not a `str` with `str`, which calls `__str__`.
    3. **Z.** `repr` calls `__repr__`.
    4. **Y.** Converting a list to a string uses `repr` for each item, even though `Book` defines `__str__`.
    5. **X.** `str(novel)` calls `__str__`, and the result is concatenated with another `str`.
    6. **N.** `novel.title` evaluates to a `str`. The value being printed is not a `Book`, so none of `Book`'s methods is called.
    7. **Y.** `str(shelf)` converts a _list_. The list's string uses `repr` for each item, so wrapping it in `str` does not change which `Book` method is called.
    8. **E.** Concatenation requires two `str` values. Python raises a `TypeError` and does not call `__str__` automatically.

### 2.2 Multiple Choice: Only One Is Defined

**(a)** A `Plant` class defines `__str__`, which returns strings such as `Fern (12.5 cm)`, but it does not define `__repr__`. What does `print([fern])` display?

- **A.** `[Fern (12.5 cm)]`
- **B.** `['Fern (12.5 cm)']`
- **C.** `[<__main__.Plant object at 0x...>]`
- **D.** Nothing; Python raises a `TypeError`

**(b)** A different version of `Plant` defines `__repr__`, which returns strings such as `Plant(name='Fern', height=12.5)`, but it does not define `__str__`. What does `print(fern)` display?

- **A.** `<__main__.Plant object at 0x...>`
- **B.** `Plant(name='Fern', height=12.5)`
- **C.** `Fern (12.5 cm)`
- **D.** Nothing; Python raises an `AttributeError`

??? note "Check your answers"

    **(a) C.** Printing a list uses `repr` for each item, and `repr` never falls back to `__str__`. So the item is shown with the default representation.

    **(b) B.** When a class does not define `__str__`, `str` falls back to calling `__repr__`. This is why `__repr__` covers more situations when only one of the two is defined.

### 2.3 Write It: `__str__` and `__repr__` for a Playlist Track

Complete the `Track` class. `__str__` should say `1 play` for exactly one play and `plays` (plural) for any other number. `__repr__` should follow the constructor call convention. When your code is correct, running it prints the expected values in the comments.

~~~python { runnable=true editable=true title="You Try: Track Representations" }
class Track:
    """A song in a playlist."""

    title: str
    artist: str
    plays: int

    def __init__(self, title: str, artist: str, plays: int):
        """Initialize a Track's title, artist, and number of plays."""
        self.title = title
        self.artist = artist
        self.plays = plays

    def play(self) -> None:
        """Record one more play of this track."""
        self.plays = self.plays + 1

    # TODO: Define __str__ here.

    # TODO: Define __repr__ here.


opener: Track = Track(title="Blue Ridge Morning", artist="The Old Wells", plays=0)
print(opener)  # Expected: Blue Ridge Morning by The Old Wells (0 plays)

opener.play()
print(opener)  # Expected: Blue Ridge Morning by The Old Wells (1 play)

opener.play()
print(opener)  # Expected: Blue Ridge Morning by The Old Wells (2 plays)
print(repr(opener))  # Expected: Track(title='Blue Ridge Morning', artist='The Old Wells', plays=2)

playlist: list[Track] = [opener, Track(title="Porch Light", artist="Juniper", plays=5)]
print(playlist)
# Expected: [Track(title='Blue Ridge Morning', artist='The Old Wells', plays=2), Track(title='Porch Light', artist='Juniper', plays=5)]
~~~

??? note "Show a solution"

    ```python
        def __str__(self) -> str:
            """Return a description of this track for display."""
            if self.plays == 1:
                return self.title + " by " + self.artist + " (1 play)"
            else:
                return self.title + " by " + self.artist + " (" + str(self.plays) + " plays)"

        def __repr__(self) -> str:
            """Return a constructor call expression that would create this track."""
            return "Track(title=" + repr(self.title) + ", artist=" + repr(self.artist) + ", plays=" + repr(self.plays) + ")"
    ```

    `__str__` is a method like any other, so its body can contain an `if` statement. Its condition is evaluated each time `__str__` is called, so the word changes as `plays` changes. Edge cases worth testing here are `0` plays and exactly `1` play.

### 2.4 Office Hours: Diagnose the Symptom

Four students bring you their `Plant` classes. For each message, write a one- or two-sentence explanation of what is happening and how to fix it.

1. "I defined `__str__`, and `print(fern)` shows `Fern (12.5 cm)` like it should. But when I print my list of plants I get `[<__main__.Plant object at 0x7f2a...>]`. Did my `__str__` break?"
2. "My `__str__` displays the right text on the screen, but then the program crashes with `TypeError: __str__ returned non-string (type NoneType)`. How can it be wrong if the text is right?"
3. "At the start of my program I wrote `label: str = str(fern)`. Then I called `fern.grow(amount=5.0)`, but `print(label)` still shows the old height. Is my `grow` method broken?"
4. "My `__repr__` returns `Plant(name=Fern, height=12.5)`. It looks like a constructor call to me. Why did my TA mark it wrong?"

??? note "Check your answers"

    1. `__str__` is fine. Printing a list uses `repr` for each item, and `repr` does not use `__str__`. Define `__repr__` as well.
    2. The body of `__str__` calls `print` instead of using `return`. `print` displays the text, then `__str__` reaches the end of its body and implicitly returns `None`, which is not a `str`. Replace `print(...)` with `return ...`.
    3. `grow` is probably fine. `str(fern)` called `__str__` once, when `label` was assigned, and `label` holds that `str` value. A `str` stored in a variable does not change when the object's attributes are assigned new values later. Call `str(fern)` again, or `print(fern)`, to get a string built from the current height.
    4. The name is missing quotation marks. Copying `Plant(name=Fern, height=12.5)` into a program would make Python try to resolve `Fern` as a variable name. Use `repr(self.name)`, which evaluates to `'Fern'` with quotation marks.

## Part 3: Methods

Questions 3.1 through 3.3 use a `BikeStation` class for a bike-share program. A station has a fixed number of docks, called its capacity, and each dock can hold one bike.

~~~python
class BikeStation:
    """A bike-share station that can hold up to capacity bikes."""

    name: str
    bikes: int
    capacity: int

    def __init__(self, name: str, bikes: int, capacity: int):
        """Initialize a BikeStation's name, number of bikes, and capacity."""
        self.name = name
        self.bikes = bikes
        self.capacity = capacity

    def is_full(self) -> bool:
        """Return whether every dock at this station holds a bike."""
        return self.bikes >= self.capacity
~~~

### 3.1 Evaluate: Five Versions of `dock`

The `dock` method's docstring says: _Add one bike if this station has room. Return whether the bike was docked._ Here are five versions.

**Version A**

~~~python
    def dock(self) -> bool:
        if self.is_full():
            return False
        self.bikes = self.bikes + 1
        return True
~~~

**Version B**

~~~python
    def dock(self) -> bool:
        if self.bikes < self.capacity:
            self.bikes = self.bikes + 1
        return self.bikes < self.capacity
~~~

**Version C**

~~~python
    def dock(self) -> bool:
        if self.is_full():
            return False
        else:
            return True
        self.bikes = self.bikes + 1
~~~

**Version D**

~~~python
    def dock(self) -> bool:
        if is_full():
            return False
        self.bikes = self.bikes + 1
        return True
~~~

**Version E**

~~~python
    def dock(self) -> bool:
        bikes: int = self.bikes
        if bikes < self.capacity:
            bikes = bikes + 1
            return True
        return False
~~~

1. Which versions are correct for every station and every sequence of calls?
2. For each incorrect version, start from `BikeStation(name="Franklin St", bikes=4, capacity=5)` and give a call to `dock` (or a sequence of calls) that shows the problem. Say what happens and what should have happened.

Use this block to test a version: replace the body of `dock` and run it.

~~~python { runnable=true editable=true title="Test a Version of dock" }
class BikeStation:
    """A bike-share station that can hold up to capacity bikes."""

    name: str
    bikes: int
    capacity: int

    def __init__(self, name: str, bikes: int, capacity: int):
        """Initialize a BikeStation's name, number of bikes, and capacity."""
        self.name = name
        self.bikes = bikes
        self.capacity = capacity

    def is_full(self) -> bool:
        """Return whether every dock at this station holds a bike."""
        return self.bikes >= self.capacity

    def dock(self) -> bool:
        """Add one bike if this station has room. Return whether the bike was docked."""
        if self.bikes < self.capacity:
            self.bikes = self.bikes + 1
        return self.bikes < self.capacity


station: BikeStation = BikeStation(name="Franklin St", bikes=4, capacity=5)
print(station.dock())  # Expected: True
print(station.bikes)  # Expected: 5
print(station.dock())  # Expected: False
print(station.bikes)  # Expected: 5
~~~

??? note "Check your answers"

    1. Only **Version A** is correct.
    2. - **Version B** docks the bike that fills the last dock, but then returns whether there is room _after_ docking. The first call sets `bikes` to `5` and returns `False`, even though the bike was docked. It should return `True`.
        - **Version C** never changes `bikes`. Each `return` statement ends the call, so the assignment after the `if`-`else` statement can never be reached. Every call returns `True` and `bikes` stays `4`, no matter how many times `dock` is called.
        - **Version D** raises a `NameError` on the first call. `is_full` by itself is resolved in the `dock` frame and then in Globals, and it is in neither. Methods of the same object are called through `self`: `self.is_full()`.
        - **Version E** returns `True` but leaves `bikes` at `4`. `bikes: int = self.bikes` copies the `int` value `4` into a local variable. Reassigning the local variable does not change the object's attribute. This is the same reason reassigning a parameter does not change the caller's variable.

### 3.2 Parsons: The `undock` Method

Arrange some of these lines, with correct indentation, to define a method of `BikeStation` that matches its docstring. Three lines are distractors that do not belong in a correct method.

~~~text
return True
"""Remove one bike if this station has any. Return whether a bike was removed."""
bikes = self.bikes - 1
if self.bikes == 0:
return self.bikes - 1
def undock(self) -> bool:
self.bikes = self.bikes - 1
print(False)
return False
~~~

??? note "Show a solution"

    ```python
        def undock(self) -> bool:
            """Remove one bike if this station has any. Return whether a bike was removed."""
            if self.bikes == 0:
                return False
            self.bikes = self.bikes - 1
            return True
    ```

    The distractors are:

    - `bikes = self.bikes - 1`, which assigns a local variable instead of the attribute (Version E's mistake in 3.1).
    - `return self.bikes - 1`, which returns an `int` without updating the attribute, and disagrees with the return type `bool`.
    - `print(False)`, which displays a value instead of returning it to the caller.

### 3.3 Write It: A Function That Works with Two Objects

At the end of the day, a bike-share crew moves bikes from busy stations to emptier ones. Write the function `rebalance`. It takes two `BikeStation` objects and moves bikes one at a time from `source` to `destination`, as long as `source` has more bikes than `destination` and `destination` is not full. It returns the number of bikes moved.

Use `undock` and `dock` to move each bike rather than assigning the `bikes` attributes directly.

~~~python { runnable=true editable=true title="You Try: rebalance" }
class BikeStation:
    """A bike-share station that can hold up to capacity bikes."""

    name: str
    bikes: int
    capacity: int

    def __init__(self, name: str, bikes: int, capacity: int):
        """Initialize a BikeStation's name, number of bikes, and capacity."""
        self.name = name
        self.bikes = bikes
        self.capacity = capacity

    def is_full(self) -> bool:
        """Return whether every dock at this station holds a bike."""
        return self.bikes >= self.capacity

    def dock(self) -> bool:
        """Add one bike if this station has room. Return whether the bike was docked."""
        if self.is_full():
            return False
        self.bikes = self.bikes + 1
        return True

    def undock(self) -> bool:
        """Remove one bike if this station has any. Return whether a bike was removed."""
        if self.bikes == 0:
            return False
        self.bikes = self.bikes - 1
        return True


def rebalance(source: BikeStation, destination: BikeStation) -> int:
    """Move bikes from source to destination while source has more bikes and destination has room.

    Return the number of bikes moved.
    """
    # TODO: Replace return 0 with your implementation.
    return 0


downtown: BikeStation = BikeStation(name="Franklin St", bikes=9, capacity=12)
campus: BikeStation = BikeStation(name="Polk Place", bikes=2, capacity=10)
print(rebalance(source=downtown, destination=campus))  # Expected: 4
print(downtown.bikes)  # Expected: 5
print(campus.bikes)  # Expected: 6

small: BikeStation = BikeStation(name="Carrboro", bikes=3, capacity=4)
print(rebalance(source=downtown, destination=small))  # Expected: 1
print(small.is_full())  # Expected: True

print(rebalance(source=small, destination=campus))  # Expected: 0
~~~

??? note "Show a solution"

    ```python
    def rebalance(source: BikeStation, destination: BikeStation) -> int:
        """Move bikes from source to destination while source has more bikes and destination has room.

        Return the number of bikes moved.
        """
        moved: int = 0
        while source.bikes > destination.bikes and not destination.is_full():
            source.undock()
            destination.dock()
            moved = moved + 1
        return moved
    ```

    The parameters `source` and `destination` are aliases of the caller's `downtown`, `campus`, and `small` objects, so the changes made by `undock` and `dock` remain after `rebalance` returns. The three test cases cover each way the repeat block can stop: `source` no longer has more bikes (first call), `destination` becomes full (second call), and the condition evaluates to `False` before the repeat block is executed even once (third call).

## Part 4: Protocols and Interfaces

### 4.1 Select All: True Statements About Protocols

Select **every** true statement.

- **A.** A protocol lists attribute declarations and method signatures, and its method bodies contain only docstrings.
- **B.** A class must write the protocol's name in parentheses, as in `class Reading(Task):`, to satisfy it.
- **C.** A class can have more attributes and methods than a protocol lists and still satisfy it.
- **D.** When `tasks[idx].minutes_left()` is evaluated and `tasks` is annotated `list[Task]`, Python executes the body of `minutes_left` written in the `Task` protocol.
- **E.** In a function whose parameter is annotated `task: Task`, a type checker accepts `task.is_done()` as long as at least one class that satisfies `Task` defines `is_done`.
- **F.** Two classes can satisfy the same protocol even if their `__init__` methods have different parameters.
- **G.** If `Reading` does not satisfy `Task`, Python raises an error at the moment a `Reading` object is placed in a variable annotated `list[Task]`.

??? note "Check your answers"

    **A, C, and F** are true.

    - **B** is false. In Python, a class satisfies a protocol by having every listed member with matching types. It does not name the protocol.
    - **D** is false. Python finds `minutes_left` in the class of the object that `tasks[idx]` refers to. The protocol is never used to find a method body.
    - **E** is false. A type checker accepts only members listed in the protocol, because a `Task` could be an object of _any_ class that satisfies it, including one with no `is_done` method.
    - **F** is true because a protocol does not describe how objects are constructed, only what a constructed object can be used for.
    - **G** is false. Python does not check type annotations when it executes a program. A type checker reports the problem before the program is executed. If the program is executed anyway, an error is raised only when code uses a member the object does not have.

### 4.2 Write It: The Protocol Behind Three Classes

A study planner app tracks three kinds of tasks. Read all three classes carefully.

~~~python
class Reading:
    """A reading assignment. Each page takes 3 minutes to read."""

    title: str
    pages_left: int

    def __init__(self, title: str, pages: int):
        """Initialize a Reading with pages pages left to read."""
        self.title = title
        self.pages_left = pages

    def minutes_left(self) -> int:
        """Return the minutes needed to finish this reading."""
        return self.pages_left * 3

    def work(self, minutes: int) -> None:
        """Read for minutes minutes, finishing one page every 3 minutes."""
        self.pages_left = self.pages_left - minutes // 3
        if self.pages_left < 0:
            self.pages_left = 0

    def progress(self) -> str:
        """Return a description of how much is left, for display."""
        return str(self.pages_left) + " pages left"


class ProblemSet:
    """A problem set. Each problem takes 15 minutes to solve."""

    title: str
    problems: int
    solved: int

    def __init__(self, title: str, problems: int):
        """Initialize a ProblemSet with no problems solved."""
        self.title = title
        self.problems = problems
        self.solved = 0

    def minutes_left(self) -> int:
        """Return the minutes needed to finish this problem set."""
        return (self.problems - self.solved) * 15

    def work(self, minutes: int) -> None:
        """Work for minutes minutes, solving one problem every 15 minutes."""
        self.solved = self.solved + minutes // 15
        if self.solved > self.problems:
            self.solved = self.problems

    def progress(self) -> float:
        """Return the fraction of problems solved."""
        return self.solved / self.problems

    def is_done(self) -> bool:
        """Return whether every problem is solved."""
        return self.solved == self.problems


class Lecture:
    """A recorded lecture video."""

    title: str
    length: int
    minutes_watched: int

    def __init__(self, title: str, length: int):
        """Initialize a Lecture of length minutes that has not been watched."""
        self.title = title
        self.length = length
        self.minutes_watched = 0

    def minutes_left(self) -> int:
        """Return the minutes left in this lecture."""
        return self.length - self.minutes_watched

    def work(self, minutes: int) -> None:
        """Watch for minutes minutes, without going past the end of the video."""
        self.minutes_watched = self.minutes_watched + minutes
        if self.minutes_watched > self.length:
            self.minutes_watched = self.length

    def progress(self) -> float:
        """Return the fraction of this lecture watched."""
        return self.minutes_watched / self.length

    def is_done(self) -> bool:
        """Return whether this lecture has been watched to the end."""
        return self.minutes_watched == self.length
~~~

**(a)** Write a protocol named `Task` that lists **every** member all three classes share with matching types, and **nothing else**.

**(b)** List each member of these classes that you left out of `Task`, and explain why in a few words.

**(c)** Write `total_minutes`, which returns the sum of the minutes left in every task in a list.

**(d)** Write `shortest_task`, which returns a reference to the task with the fewest minutes left. If two tasks are tied, return the one that appears first. Use an `assert` statement so that an empty list raises an `AssertionError`.

**(e)** Write `study_session`, which works on the task with the fewest minutes left for `minutes` minutes. Its body can be a single line.

Write your answers in this block. The three task classes are already included. When your code is correct, running it prints the expected values in the comments.

~~~python { runnable=true editable=true title="You Try: The Task Protocol" }
from typing import Protocol


class Reading:
    """A reading assignment. Each page takes 3 minutes to read."""

    title: str
    pages_left: int

    def __init__(self, title: str, pages: int):
        """Initialize a Reading with pages pages left to read."""
        self.title = title
        self.pages_left = pages

    def minutes_left(self) -> int:
        """Return the minutes needed to finish this reading."""
        return self.pages_left * 3

    def work(self, minutes: int) -> None:
        """Read for minutes minutes, finishing one page every 3 minutes."""
        self.pages_left = self.pages_left - minutes // 3
        if self.pages_left < 0:
            self.pages_left = 0

    def progress(self) -> str:
        """Return a description of how much is left, for display."""
        return str(self.pages_left) + " pages left"


class ProblemSet:
    """A problem set. Each problem takes 15 minutes to solve."""

    title: str
    problems: int
    solved: int

    def __init__(self, title: str, problems: int):
        """Initialize a ProblemSet with no problems solved."""
        self.title = title
        self.problems = problems
        self.solved = 0

    def minutes_left(self) -> int:
        """Return the minutes needed to finish this problem set."""
        return (self.problems - self.solved) * 15

    def work(self, minutes: int) -> None:
        """Work for minutes minutes, solving one problem every 15 minutes."""
        self.solved = self.solved + minutes // 15
        if self.solved > self.problems:
            self.solved = self.problems

    def progress(self) -> float:
        """Return the fraction of problems solved."""
        return self.solved / self.problems

    def is_done(self) -> bool:
        """Return whether every problem is solved."""
        return self.solved == self.problems


class Lecture:
    """A recorded lecture video."""

    title: str
    length: int
    minutes_watched: int

    def __init__(self, title: str, length: int):
        """Initialize a Lecture of length minutes that has not been watched."""
        self.title = title
        self.length = length
        self.minutes_watched = 0

    def minutes_left(self) -> int:
        """Return the minutes left in this lecture."""
        return self.length - self.minutes_watched

    def work(self, minutes: int) -> None:
        """Watch for minutes minutes, without going past the end of the video."""
        self.minutes_watched = self.minutes_watched + minutes
        if self.minutes_watched > self.length:
            self.minutes_watched = self.length

    def progress(self) -> float:
        """Return the fraction of this lecture watched."""
        return self.minutes_watched / self.length

    def is_done(self) -> bool:
        """Return whether this lecture has been watched to the end."""
        return self.minutes_watched == self.length


# TODO (a): Define the Task protocol here.


# TODO (c): Define total_minutes here.


# TODO (d): Define shortest_task here.


# TODO (e): Define study_session here.


plan: list[Task] = [
    Reading(title="Ch. 4 reading", pages=12),
    ProblemSet(title="PS 3", problems=4),
    Lecture(title="Lecture 9", length=50),
]
print(total_minutes(tasks=plan))  # Expected: 146
print(shortest_task(tasks=plan).title)  # Expected: Ch. 4 reading

plan[2].work(minutes=30)
print(shortest_task(tasks=plan).title)  # Expected: Lecture 9

study_session(tasks=plan, minutes=20)
print(total_minutes(tasks=plan))  # Expected: 96
print(plan[2].minutes_left())  # Expected: 0
~~~

??? note "Show a solution"

    **(a)**

    ```python
    class Task(Protocol):
        """The interface every task in a study plan provides."""

        title: str

        def minutes_left(self) -> int:
            """Return the minutes needed to finish this task."""

        def work(self, minutes: int) -> None:
            """Work on this task for minutes minutes."""
    ```

    **(b)**

    - `pages_left`, `problems`, `solved`, `length`, and `minutes_watched` each belong to only one class.
    - `is_done` is defined in `ProblemSet` and `Lecture`, but not in `Reading`.
    - `progress` is defined in all three classes, but `Reading`'s version returns a `str` while the other two return a `float`. A protocol member needs one return type that every class matches.

    **(c)** and **(d)**

    ```python
    def total_minutes(tasks: list[Task]) -> int:
        """Return the total minutes left in every task in tasks."""
        total: int = 0
        idx: int = 0
        while idx < len(tasks):
            total = total + tasks[idx].minutes_left()
            idx = idx + 1
        return total


    def shortest_task(tasks: list[Task]) -> Task:
        """Return the task with the fewest minutes left, or the first such task if tied.

        tasks must not be empty.
        """
        assert len(tasks) > 0, "tasks is empty"
        shortest: Task = tasks[0]
        idx: int = 1
        while idx < len(tasks):
            if tasks[idx].minutes_left() < shortest.minutes_left():
                shortest = tasks[idx]
            idx = idx + 1
        return shortest
    ```

    Comparing with `<` rather than `<=` keeps the _first_ task when two are tied. `shortest_task` returns a reference to one of the existing objects in the list; it does not construct a new task.

    **(e)**

    ```python
    def study_session(tasks: list[Task], minutes: int) -> None:
        """Work for minutes minutes on the task with the fewest minutes left."""
        shortest_task(tasks=tasks).work(minutes=minutes)
    ```

    The call `shortest_task(tasks=tasks)` is evaluated first and evaluates to a reference to a task object. Then `work` is called on that object, using the `work` method defined in that object's class. Because the reference points to an object that is also in the list, the list's object is the one that changes.

    None of these three functions mentions `Reading`, `ProblemSet`, or `Lecture`. They depend only on the `Task` interface.

### 4.3 Write It (Challenge): A Fourth Kind of Task

Add a class `Flashcards` to your program from 4.2 so that it satisfies `Task`. A `Flashcards` object has a `title` and a number of cards left to review, and each card takes 2 minutes. Its `__init__` method has the parameters `title` and `cards`. Then add a `Flashcards(title="Spanish vocab", cards=10)` object to `plan` and predict the first value printed. Do `total_minutes`, `shortest_task`, or `study_session` need to change?

??? note "Show a solution"

    ```python
    class Flashcards:
        """A deck of flashcards to review. Each card takes 2 minutes."""

        title: str
        cards_left: int

        def __init__(self, title: str, cards: int):
            """Initialize a Flashcards deck with cards cards left to review."""
            self.title = title
            self.cards_left = cards

        def minutes_left(self) -> int:
            """Return the minutes needed to review every card left."""
            return self.cards_left * 2

        def work(self, minutes: int) -> None:
            """Review for minutes minutes, finishing one card every 2 minutes."""
            self.cards_left = self.cards_left - minutes // 2
            if self.cards_left < 0:
                self.cards_left = 0
    ```

    With the deck added, `total_minutes` returns `166` and `shortest_task` returns the `"Spanish vocab"` deck (20 minutes). None of the three functions needs to change. That is the payoff of writing them against the `Task` interface instead of against specific classes.

### 4.4 Multiple Choice: Where Does Python Find the Method?

`plan` is annotated `list[Task]`, and `plan[1]` refers to a `ProblemSet` object. When Python evaluates `plan[1].work(minutes=30)`, where does it find the `work` method to call?

- **A.** In the `Task` protocol, because `plan` is annotated `list[Task]`
- **B.** In `ProblemSet`, the class of the object that `plan[1]` refers to
- **C.** In whichever class that satisfies `Task` was defined first in the file
- **D.** Python checks every class that satisfies `Task` and calls each one's `work`

??? note "Check your answers"

    **B.** Python evaluates the expression before the dot, follows the reference to an object on the heap, and finds `work` in that object's class. Type annotations are never used to choose which method body is executed. This is why the single line `tasks[idx].minutes_left()` in `total_minutes` can execute a different method body for each item in the list.

### 4.5 One Line: Who Reports the Problem?

For each situation, write one line naming **who** reports a problem (a type checker, Python, or no one) and **which error**, if any.

1. A program executes `t: Task = Task()`.
2. Inside `total_minutes`, a student writes `tasks[idx].pages_left`, and the list holds one object of each class from 4.2.
3. A student passes a list containing only `Reading` objects to a function that calls `.is_done()` on each item, and the parameter is annotated `list[Task]`.
4. A `Lecture` class's `work` method is renamed `watch`, and a `Lecture` object is placed in `plan`.

??? note "Check your answers"

    1. Python raises a `TypeError` (`Protocols cannot be instantiated`), and a type checker also reports it before the program is executed.
    2. A type checker reports that `Task` has no attribute `pages_left`. If the program is executed anyway, the `Reading` item works, and Python raises an `AttributeError` at the `ProblemSet` item.
    3. A type checker reports that `Task` has no attribute `is_done`. If the program is executed anyway, Python raises an `AttributeError` on the first `Reading` object, because `Reading` has no `is_done` method.
    4. A type checker reports that `Lecture` does not satisfy `Task` because it is missing `work`. If the program is executed anyway, Python raises an `AttributeError` only when code calls `work` on that object.

## Part 5: 2D Lists and Nested Loops

A **2D list** is a list whose items are lists. Each inner list is a **row**, and the items at the same index in each row form a **column**. The expression `grid[row][col]` is evaluated in two steps: `grid[row]` evaluates to a reference to one row, and `[col]` then reads one item of that row.

Questions 5.1 through 5.3 use this list of quiz scores for a study group. Each row is one student, and each column is one quiz.

~~~python
scores: list[list[int]] = [[8, 9, 7, 10], [6, 10, 5, 8], [10, 8, 6, 9]]
~~~

### 5.1 Multiple Choice: Rows and Columns

What does `scores[1][2]` evaluate to?

- **A.** `8`
- **B.** `9`
- **C.** `5`
- **D.** `[6, 10, 5, 8]`

??? note "Check your answers"

    **C.** `scores[1]` evaluates to the second row, `[6, 10, 5, 8]`, and index `2` of that row is `5`. The other choices come from common mix-ups: **A** is `scores[2][1]` (row and column swapped), **B** is `scores[0][1]` (counting from 1 instead of 0), and **D** is `scores[1]` alone.

### 5.2 One Line: Indexing a 2D List

Write one expression or statement for each. Do not hard-code the number of rows or columns.

1. An expression that evaluates to the number of students.
2. An expression that evaluates to the number of quizzes.
3. An expression that evaluates to the third student's entire list of scores.
4. A statement that changes the second student's first quiz score to `7`.
5. An expression that evaluates to the last student's score on the last quiz.

??? note "Check your answers"

    1. `len(scores)`
    2. `len(scores[0])` (the length of one row, which is the number of columns in a rectangular 2D list)
    3. `scores[2]`
    4. `scores[1][0] = 7`
    5. `scores[len(scores) - 1][len(scores[0]) - 1]`

    A common mistake on line 2 is `len(scores)`, which counts rows, not columns. For this list, the two lengths are different (`3` and `4`), but for a square 2D list they are equal, which can hide the mistake. Question 5.7 shows how.

### 5.3 Trace Table: The Highest Score

Fill in one row of the table each time the condition of the `if` statement is evaluated. Then answer the questions.

~~~python_diagram_runner { editable=true title="Trace: The Highest Score" }
grid: list[list[int]] = [[4, 9], [7, 2], [9, 5]]
best: int = grid[0][0]
best_row: int = 0

row: int = 0
while row < len(grid):
    col: int = 0
    while col < len(grid[row]):
        if grid[row][col] > best:
            best = grid[row][col]
            best_row = row
        col = col + 1
    row = row + 1

print(best)
print(best_row)
~~~

| `row` | `col` | `grid[row][col]` | `best` before | condition evaluates to | `best` after | `best_row` after |
|---|---|---|---|---|---|---|
| | | | | | | |

1. How many times is the condition evaluated?
2. What two lines are printed?
3. If `>` were changed to `>=`, what would be printed instead? Why?

??? note "Check your answers"

    | `row` | `col` | `grid[row][col]` | `best` before | condition evaluates to | `best` after | `best_row` after |
    |---|---|---|---|---|---|---|
    | 0 | 0 | 4 | 4 | `False` | 4 | 0 |
    | 0 | 1 | 9 | 4 | `True` | 9 | 0 |
    | 1 | 0 | 7 | 9 | `False` | 9 | 0 |
    | 1 | 1 | 2 | 9 | `False` | 9 | 0 |
    | 2 | 0 | 9 | 9 | `False` | 9 | 0 |
    | 2 | 1 | 5 | 9 | `False` | 9 | 0 |

    1. Six times: once for each item in the 2D list. The inner repeat block is executed 2 times for each of the 3 rows.
    2. `9` and then `0`.
    3. `9` and then `2`. With `>=`, the condition evaluates to `True` for the tied `9` in row `2`, so `best_row` is reassigned to `2`. The choice between `>` and `>=` decides whether the first or the last of tied values is kept, which is why ties are an edge case worth testing.

### 5.4 Predict: The Missing Reset

This program is meant to print the sum of every score. Predict what it prints, then step through it.

~~~python_diagram_runner { editable=true title="Predict: Summing Every Score" }
scores: list[list[int]] = [[8, 9, 7, 10], [6, 10, 5, 8], [10, 8, 6, 9]]

total: int = 0
row: int = 0
col: int = 0
while row < len(scores):
    while col < len(scores[row]):
        total = total + scores[row][col]
        col = col + 1
    row = row + 1

print(total)
~~~

1. What is printed? What _should_ be printed?
2. How many times in total is the inner repeat block executed?
3. Move one line to fix the program, and step through it again.

??? note "Check your answers"

    1. `34`, which is only the first student's total. It should print `96`.
    2. Four times, all while `row` is `0`. When the outer repeat block is executed the second time, `col` is still `4`, so the inner condition `col < len(scores[row])` evaluates to `False` immediately, and the inner repeat block is skipped for every remaining row.
    3. Move `col: int = 0` inside the outer repeat block, before the inner `while` statement, so that `col` starts over at `0` for each row:

        ```python
        while row < len(scores):
            col: int = 0
            while col < len(scores[row]):
                total = total + scores[row][col]
                col = col + 1
            row = row + 1
        ```

### 5.5 Memory Diagram: One Row, Three Times

This function is meant to build an empty classroom seating chart: `rows` rows, each with `cols` empty seats (the empty string `""`). Before stepping through it, draw the memory diagram as it would look **just before `blank_chart` returns**, and predict the output.

~~~python_diagram_runner { editable=true title="Draw It: A Blank Seating Chart" }
def blank_chart(rows: int, cols: int) -> list[list[str]]:
    """Return a seating chart with rows rows of cols empty seats each."""
    chart: list[list[str]] = []
    row: list[str] = []
    col_idx: int = 0
    while col_idx < cols:
        row.append("")
        col_idx = col_idx + 1

    row_idx: int = 0
    while row_idx < rows:
        chart.append(row)
        row_idx = row_idx + 1
    return chart


seats: list[list[str]] = blank_chart(rows=3, cols=2)
print(seats)
seats[0][1] = "Ada"
print(seats)
~~~

1. Just before `blank_chart` returns, how many list objects are on the heap? How many references hold each one's ID?
2. What two lines are printed?
3. A classmate tests this function with `assert blank_chart(rows=3, cols=2) == [["", ""], ["", ""], ["", ""]]`. Does the test pass? Why?
4. Fix `blank_chart` by moving lines, without adding any new ones.
5. Write a test that **fails** with the original version and **passes** with your fix.

??? note "Check your answers"

    1. Two list objects. The outer list's ID is held by one reference, the variable `chart`. The single row list's ID is held by **four** references: the variable `row` and each of the three items of `chart`. `chart.append(row)` appends the same row's ID each time; it does not copy the row.
    2. `[['', ''], ['', ''], ['', '']]` and then `[['', 'Ada'], ['', 'Ada'], ['', 'Ada']]`. Assigning `seats[0][1]` changes the one row list, and all three items of `seats` refer to it.
    3. The test passes. `==` compares items, and every row has the items `""` and `""`. The bug appears only after the 2D list is mutated, so a test that checks only the returned value cannot catch it.
    4. Construct a new row inside the outer repeat block, so each execution of the repeat block constructs a separate list:

        ```python
        def blank_chart(rows: int, cols: int) -> list[list[str]]:
            """Return a seating chart with rows rows of cols empty seats each."""
            chart: list[list[str]] = []
            row_idx: int = 0
            while row_idx < rows:
                row: list[str] = []
                col_idx: int = 0
                while col_idx < cols:
                    row.append("")
                    col_idx = col_idx + 1
                chart.append(row)
                row_idx = row_idx + 1
            return chart
        ```

    5. Either of these works. The first mutates the result and checks that only one seat changed. The second checks with `is not` that two rows are separate lists.

        ```python
        def test_blank_chart_rows_are_separate() -> None:
            """Assigning a seat in one row does not change any other row."""
            chart: list[list[str]] = blank_chart(rows=3, cols=2)
            chart[0][1] = "Ada"
            assert chart == [["", "Ada"], ["", ""], ["", ""]]


        def test_blank_chart_rows_are_different_lists() -> None:
            """Each row is a different list."""
            chart: list[list[str]] = blank_chart(rows=2, cols=2)
            assert chart[0] is not chart[1]
        ```

### 5.6 Write It: Row Totals and Column Averages

Write two functions for the quiz scores.

- `student_totals` returns a list with each student's total score, in order. (Visit the 2D list row by row.)
- `quiz_averages` returns a list with the average score on each quiz, in order. (Think carefully about which loop should be the outer one.)

Assume the 2D list is rectangular and has at least one row. Neither function should mutate `scores`.

~~~python { runnable=true editable=true title="You Try: Totals and Averages" }
def student_totals(scores: list[list[int]]) -> list[int]:
    """Return a list of the sum of each row of scores, in order."""
    # TODO: Replace return [] with your implementation.
    return []


def quiz_averages(scores: list[list[int]]) -> list[float]:
    """Return a list of the average of each column of scores, in order."""
    # TODO: Replace return [] with your implementation.
    return []


scores: list[list[int]] = [[8, 9, 7, 10], [6, 10, 5, 8], [10, 8, 6, 9]]
print(student_totals(scores=scores))  # Expected: [34, 29, 33]
print(quiz_averages(scores=scores))  # Expected: [8.0, 9.0, 6.0, 9.0]
print(scores)  # Expected: [[8, 9, 7, 10], [6, 10, 5, 8], [10, 8, 6, 9]]
~~~

??? note "Show a solution"

    ```python
    def student_totals(scores: list[list[int]]) -> list[int]:
        """Return a list of the sum of each row of scores, in order."""
        totals: list[int] = []
        row: int = 0
        while row < len(scores):
            total: int = 0
            col: int = 0
            while col < len(scores[row]):
                total = total + scores[row][col]
                col = col + 1
            totals.append(total)
            row = row + 1
        return totals


    def quiz_averages(scores: list[list[int]]) -> list[float]:
        """Return a list of the average of each column of scores, in order."""
        averages: list[float] = []
        col: int = 0
        while col < len(scores[0]):
            total: int = 0
            row: int = 0
            while row < len(scores):
                total = total + scores[row][col]
                row = row + 1
            averages.append(total / len(scores))
            col = col + 1
        return averages
    ```

    In `quiz_averages`, the _outer_ loop visits columns and the _inner_ loop visits rows, because each average needs every row's item in one column. Notice that the indexing is still `scores[row][col]`, row first. The order of the loops changes; the order of the indices does not. In both functions, the accumulator (`total`) is reset inside the outer repeat block, for the same reason `col` had to be reset in 5.4.

### 5.7 Evaluate: AI-Generated Code and Tests

A student asked an AI tool for a function that counts perfect scores (`10`s) in a 2D list, along with tests. Both tests pass.

~~~python
def count_perfect(scores: list[list[int]]) -> int:
    """Return how many scores in scores are 10."""
    count: int = 0
    row: int = 0
    while row < len(scores):
        col: int = 0
        while col < len(scores):
            if scores[row][col] == 10:
                count = count + 1
            col = col + 1
        row = row + 1
    return count


def test_count_perfect_none() -> None:
    """A 2D list with no 10s has a count of 0."""
    assert count_perfect(scores=[[8, 9], [7, 6]]) == 0


def test_count_perfect_some() -> None:
    """Every 10 is counted."""
    assert count_perfect(scores=[[10, 9, 10], [7, 10, 6], [10, 10, 5]]) == 5
~~~

1. Find the bug. Why do both tests pass anyway?
2. What does `count_perfect(scores=[[8, 9, 7, 10], [6, 10, 5, 8], [10, 8, 6, 9]])` return? What should it return?
3. Give a 2D list for which `count_perfect` raises an `IndexError` instead of returning a value.
4. Write one test that fails with this version. Then fix the function.

~~~python { runnable=true editable=true title="Test count_perfect" }
def count_perfect(scores: list[list[int]]) -> int:
    """Return how many scores in scores are 10."""
    count: int = 0
    row: int = 0
    while row < len(scores):
        col: int = 0
        while col < len(scores):
            if scores[row][col] == 10:
                count = count + 1
            col = col + 1
        row = row + 1
    return count


print(count_perfect(scores=[[10, 9, 10], [7, 10, 6], [10, 10, 5]]))  # Expected: 5
print(count_perfect(scores=[[8, 9, 7, 10], [6, 10, 5, 8], [10, 8, 6, 9]]))  # Expected: 3
~~~

??? note "Check your answers"

    1. The inner condition is `col < len(scores)`, which compares `col` to the number of _rows_. It should compare to the number of columns, `len(scores[row])`. Both tests use **square** 2D lists, where the number of rows equals the number of columns, so the mistake has no effect on them.
    2. It returns `2` but should return `3`. With 3 rows, the inner repeat block visits only columns `0` through `2`, so the `10` in the last column of the first row is never checked.
    3. Any 2D list with more rows than columns, such as `[[10], [10]]`. With 2 rows, the inner repeat block reaches `col` equal to `1`, and `scores[0][1]` is not a valid index of a row with one item.
    4. For example:

        ```python
        def test_count_perfect_more_columns_than_rows() -> None:
            """10s in every column are counted when the 2D list is not square."""
            assert count_perfect(scores=[[8, 9, 7, 10], [6, 10, 5, 8], [10, 8, 6, 9]]) == 3
        ```

        The fix is to change the inner condition to `col < len(scores[row])`.

    Neither of the AI's tests is wrong; each checks a real case. The problem is the case they leave out. When you evaluate tests you did not write, ask which _shapes_ of input they cover. For 2D lists, that means non-square lists, a single row, and a single column.

## Part 6: Putting It Together

### 6.1 Write It: A `SeatingChart` Class

Write a `SeatingChart` class that stores a 2D list of names as an attribute. An empty seat holds the empty string `""`.

- `__init__(self, rows: int, cols: int)` initializes `seats` with `rows` rows of `cols` empty seats each. Assume `rows` and `cols` are each at least `1`. (Watch out for the bug in 5.5.)
- `assign(self, row: int, col: int, name: str) -> bool` puts `name` in the seat at `row` and `col` if that seat is empty. It returns whether `name` was placed in the seat.
- `open_seats(self) -> int` returns the number of empty seats.
- `__str__(self) -> str` returns a description such as `4 of 6 seats open`.

~~~python { runnable=true editable=true title="You Try: SeatingChart" }
class SeatingChart:
    """A classroom seating chart. An empty seat holds the empty string."""

    seats: list[list[str]]

    # TODO: Define __init__, assign, open_seats, and __str__ here.


chart: SeatingChart = SeatingChart(rows=2, cols=3)
print(chart.assign(row=0, col=1, name="Ada"))  # Expected: True
print(chart.assign(row=0, col=1, name="Grace"))  # Expected: False
print(chart.assign(row=1, col=1, name="Grace"))  # Expected: True
print(chart.seats)  # Expected: [['', 'Ada', ''], ['', 'Grace', '']]
print(chart.open_seats())  # Expected: 4
print(chart)  # Expected: 4 of 6 seats open
print(chart.seats[0] is chart.seats[1])  # Expected: False
~~~

??? note "Show a solution"

    ```python
    class SeatingChart:
        """A classroom seating chart. An empty seat holds the empty string."""

        seats: list[list[str]]

        def __init__(self, rows: int, cols: int):
            """Initialize a chart with rows rows of cols empty seats each."""
            self.seats = []
            row_idx: int = 0
            while row_idx < rows:
                row: list[str] = []
                col_idx: int = 0
                while col_idx < cols:
                    row.append("")
                    col_idx = col_idx + 1
                self.seats.append(row)
                row_idx = row_idx + 1

        def assign(self, row: int, col: int, name: str) -> bool:
            """Place name in the seat at row and col if it is empty. Return whether name was placed."""
            if self.seats[row][col] == "":
                self.seats[row][col] = name
                return True
            return False

        def open_seats(self) -> int:
            """Return the number of empty seats."""
            count: int = 0
            row: int = 0
            while row < len(self.seats):
                col: int = 0
                while col < len(self.seats[row]):
                    if self.seats[row][col] == "":
                        count = count + 1
                    col = col + 1
                row = row + 1
            return count

        def __str__(self) -> str:
            """Return how many seats are open, for display."""
            total: int = len(self.seats) * len(self.seats[0])
            return str(self.open_seats()) + " of " + str(total) + " seats open"
    ```

    In `assign`, the parameters `row` and `col` are `int` values, and `self.seats[row][col]` uses them as indices into the attribute. In `__init__`, notice that `row` is a local _list_ variable instead. Each method has its own frame, so the same name can mean different things in different methods.

    If `self.seats` had been built with the aliasing bug from 5.5, the second call to `assign` with `row=1` would return `False`, because Ada's name would already appear in every row. The final expected line checks for that bug directly.

### 6.2 Memory Diagram: Aliasing a Row of an Attribute

Paste your completed `SeatingChart` methods into this diagram. Before stepping through it, predict the output and draw the final diagram: Globals, every object on the heap with its ID, and the ID stored in every variable, attribute, and list item that refers to an object.

~~~python_diagram_runner { editable=true title="Draw It: A Row Alias" }
class SeatingChart:
    """A classroom seating chart. An empty seat holds the empty string."""

    seats: list[list[str]]

    def __init__(self, rows: int, cols: int):
        """Initialize a chart with rows rows of cols empty seats each."""
        # TODO: Paste your implementation.
        self.seats = []

    def assign(self, row: int, col: int, name: str) -> bool:
        """Place name in the seat at row and col if it is empty. Return whether name was placed."""
        # TODO: Paste your implementation.
        return False

    def open_seats(self) -> int:
        """Return the number of empty seats."""
        # TODO: Paste your implementation.
        return 0

    def __str__(self) -> str:
        """Return how many seats are open, for display."""
        # TODO: Paste your implementation.
        return ""


chart: SeatingChart = SeatingChart(rows=2, cols=2)
front: list[str] = chart.seats[0]
front[1] = "Ada"

chart.assign(row=0, col=1, name="Alan")
chart.assign(row=1, col=0, name="Grace")

front = chart.seats[1]
front[1] = "Katherine"

print(chart.seats)
print(chart.open_seats())
print(chart)
~~~

1. How many `SeatingChart` objects and how many list objects are on the heap when the program finishes?
2. After `front[1] = "Ada"` is executed, which seat holds `"Ada"`? Did any method of `SeatingChart` execute to put it there?
3. What does `chart.assign(row=0, col=1, name="Alan")` return? What happens to that returned value?
4. Which object's ID does `front` store at the end of the program?
5. What three lines are printed?

??? note "Check your answers"

    1. One `SeatingChart` object and three list objects: the outer list that the `seats` attribute refers to, and its two rows.
    2. Row `0`, column `1`. No method was called. `front` is an alias of the first row, so assigning `front[1]` changes the list that `chart.seats[0]` also refers to. A class's methods are not the only code that can change its attributes once a reference to one of its lists is shared.
    3. It returns `False`, because the seat already holds `"Ada"`. The call is a statement by itself, so its returned value is not used anywhere and is discarded. Alan is not seated, and the program gives no sign of it. If the result matters, store it or use it in a condition.
    4. The ID of the second row, the list that `chart.seats[1]` also refers to. Reassigning `front` changed only the ID it stores; the first row still holds `"Ada"`.
    5. `[['', 'Ada'], ['Grace', 'Katherine']]`, then `1`, then `1 of 4 seats open`.

### 6.3 Evaluate: Choosing a `__repr__`

Two students propose a `__repr__` for `SeatingChart`.

**Version A**

~~~python
    def __repr__(self) -> str:
        """Return a constructor call expression for a chart of this size."""
        return "SeatingChart(rows=" + repr(len(self.seats)) + ", cols=" + repr(len(self.seats[0])) + ")"
~~~

**Version B**

~~~python
    def __repr__(self) -> str:
        """Return a representation that shows every seat."""
        return "SeatingChart(seats=" + repr(self.seats) + ")"
~~~

1. What does each version return for the chart at the end of 6.2?
2. The `__repr__` convention is a string that looks like a constructor call that would create an _equal_ object. Does either version fully meet that convention? Explain in one or two sentences.
3. You are debugging a failing test involving a `SeatingChart`. Which version would you rather see in pytest's report, and why?

??? note "Check your answers"

    1. Version A returns `SeatingChart(rows=2, cols=2)`. Version B returns `SeatingChart(seats=[['', 'Ada'], ['Grace', 'Katherine']])`.
    2. Neither fully meets it. Version A is a valid constructor call, but the object it would construct has every seat empty, so the names are lost. Version B shows all of the object's data, but it is not a valid constructor call, because `__init__` has no `seats` parameter. The convention says "as closely as possible," and sometimes a class's constructor cannot recreate every object it could end up as.
    3. Version B. A failing test about seat assignments almost certainly depends on _which_ names are in _which_ seats, and Version A hides exactly that information. When a constructor call cannot capture an object's state, a `__repr__` that shows the state is more useful to a programmer than one that only looks like a constructor call.

## Misconception Checklist

After you finish, use this table to find the questions to revisit for any idea that still feels shaky.

| Misconception | Questions |
|---|---|
| A class definition creates an object. | 1.1 |
| Assigning a variable that holds an object copies the object. | 1.1, 1.4, 5.5, 6.2 |
| A parameter with the same name as an attribute refers to the attribute. | 1.2 |
| Reassigning a variable or list item changes the object it used to refer to. | 1.3, 1.4, 6.2 |
| Copying an attribute's `int` value into a local variable lets you update the attribute through it. | 3.1 (Version E), 3.2 |
| A method can call another method of the same object without `self.`. | 3.1 (Version D) |
| Printing a list uses `__str__` for each item. | 2.1, 2.2, 2.4 |
| A string returned by `__str__` updates when the object changes. | 2.4 |
| `__str__` and `__repr__` can display their result instead of returning it. | 2.4, 3.2 |
| `__repr__` should use `str` on each attribute. | 2.3, 2.4 |
| A class must name the protocol it satisfies. | 4.1 |
| Python uses a variable's type annotation to choose which method body is executed. | 4.1, 4.4 |
| A protocol should list every member that _any_ of its classes has. | 4.2 |
| Python checks type annotations while it executes a program. | 4.1, 4.5 |
| `len(grid)` is the number of columns. | 5.2, 5.7 |
| `grid[row][col]` becomes `grid[col][row]` when the loops are swapped. | 5.6 |
| An inner loop's index (or an accumulator) resets on its own for each row. | 5.4, 5.6 |
| Appending the same row list several times creates separate rows. | 5.5, 6.1 |
| Passing tests mean code is correct. | 5.5, 5.7 |
| A method call's returned value is used even when the call is a statement by itself. | 6.2 |