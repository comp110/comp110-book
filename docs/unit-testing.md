---
title: Unit Tests, Importing, and Modularity
description: Split a program into modules, import definitions from one file into another, and write pytest unit tests that check a function's behavior.
---

## Why Split a Program into Files?

Every program so far has been written in a single file. That works while programs are short. As a program grows, one file ends up holding many unrelated jobs: function definitions, code that calls those functions, and code that checks whether the functions are correct.

**Modularity** is the practice of dividing a program into separate parts, each with one clear job. In Python, the basic unit of modularity is the **module**: a file whose name ends in `.py`. Each module can hold related definitions, and other modules can use those definitions by **importing** them.

This page builds a small program for the dice game **Pig**. On each turn, a player rolls a die as many times as they like, adding each roll to a turn total. A roll of `1` ends the turn and the turn total is lost. The first player to reach 100 points wins. We will place the game's scoring rules in one module and the tests that check those rules in another.

Each code block on this page shows the contents of one file. To try the examples, create the files in a single folder on your computer.

## A Module Is a File of Definitions

Here is the module that holds Pig's scoring rules. Its file name is `pig.py`, so its module name is `pig`.

~~~python { title="pig.py" }
"""Scoring rules for the dice game Pig."""

GOAL: int = 100


def points_after_roll(turn_total: int, roll: int) -> int:
    """Return the turn total after one roll. A roll of 1 ends the turn with 0 points."""
    if roll == 1:
        return 0
    else:
        return turn_total + roll


def has_won(score: int) -> bool:
    """Return whether score has reached the goal."""
    return score >= GOAL
~~~

This module contains one static variable and two function definitions. It contains no function calls at the top level, so executing `pig.py` by itself would define `GOAL`, `points_after_roll`, and `has_won` and then complete without printing anything. That is intentional: this module's job is to _provide_ definitions, and other modules decide when to call them.

The docstring at the top of the file is a **module docstring**. Like a function's docstring, it describes the module's purpose.

## Importing a Module

An **`import` statement** makes the definitions in another module available in the current module. There are two forms you will use.

### `import module_name`

The statement `import pig` executes the `pig` module and then adds the name `pig` to the current frame. The name `pig` refers to the module itself. To read a definition from the module, use dot notation, just as you would to read an attribute of an object.

~~~python { title="game.py" }
"""Play a few rolls of Pig."""

import pig

turn_total: int = 0
turn_total = pig.points_after_roll(turn_total=turn_total, roll=4)
turn_total = pig.points_after_roll(turn_total=turn_total, roll=5)

print(turn_total)
print(pig.GOAL)
print(pig.has_won(score=turn_total))
~~~

Executing `game.py` prints `9`, `100`, and `False`. Every use of a definition from `pig` is written with the prefix `pig.`, so a reader can tell where each name is defined.

### `from module_name import name`

The statement `from pig import points_after_roll, has_won` executes the `pig` module and then adds the names `points_after_roll` and `has_won` directly to the current frame. These names can be used without a prefix.

~~~python { title="game.py" }
"""Play a few rolls of Pig."""

from pig import points_after_roll, has_won

turn_total: int = 0
turn_total = points_after_roll(turn_total=turn_total, roll=4)
turn_total = points_after_roll(turn_total=turn_total, roll=5)

print(turn_total)
print(has_won(score=turn_total))
~~~

Only the names listed after `import` are added. This version of `game.py` did not import `GOAL`, so the name `GOAL` cannot be resolved in `game.py`. The `has_won` function can still read `GOAL`, though: when Python resolves a name inside `has_won`, it looks in that function's frame and then in the globals of the module where `has_won` was _defined_, which is `pig`.

### Comparing the Two Forms

| | `import pig` | `from pig import has_won` |
|---|---|---|
| Name added to the importing module | `pig`, which refers to the module | `has_won`, which refers to the function |
| How the function is called | `pig.has_won(score=100)` | `has_won(score=100)` |
| Names from `pig` that are available | All of them, through `pig.` | Only the names listed after `import` |

Import statements are written at the top of a module, after its docstring, so a reader can see at a glance which other modules it depends on.

## Importing Executes the Module

When Python reaches an import statement for a module that has not been imported yet, it executes that module's top-level statements from top to bottom. Definitions are defined, and any other top-level statements, including calls to `print`, are executed too. A module is executed only the first time it is imported; a second `import` of the same module reuses the module that already exists.

Suppose a programmer added a quick check to the bottom of `pig.py`:

~~~python { title="pig.py (with a top-level call)" }
"""Scoring rules for the dice game Pig."""

GOAL: int = 100


def points_after_roll(turn_total: int, roll: int) -> int:
    """Return the turn total after one roll. A roll of 1 ends the turn with 0 points."""
    if roll == 1:
        return 0
    else:
        return turn_total + roll


def has_won(score: int) -> bool:
    """Return whether score has reached the goal."""
    return score >= GOAL


print(points_after_roll(turn_total=7, roll=4))
~~~

Now every module that imports `pig`, including `game.py` and the test module later on this page, calls `print` when its import statement is executed. Executing `game.py` prints an extra `11` before any of its own output. This is a reason to keep modules that provide definitions free of top-level calls. There are two better places for a call like this one. A check of whether a function returns the correct value belongs in a test module, the subject of the Unit Tests section below. Code that should be executed only when you execute `pig.py` directly belongs in a _main guard_, described next.

## The Main Guard: `if __name__ == "__main__":`

### The `__name__` Variable

Every module has a global variable named `__name__` (pronounced "dunder name"). Python assigns it before executing any of the module's statements, and its value depends on how the module came to be executed:

- When a file is executed directly as the program, as in `python pig.py`, that module's `__name__` is the string `"__main__"`.
- When a module is executed because another module imported it, its `__name__` is the module's name. For `pig.py`, that is `"pig"`.

To see this, suppose `pig.py` printed its own `__name__` at the end:

~~~python { title="pig.py (printing __name__)" }
"""Scoring rules for the dice game Pig."""

GOAL: int = 100


def points_after_roll(turn_total: int, roll: int) -> int:
    """Return the turn total after one roll. A roll of 1 ends the turn with 0 points."""
    if roll == 1:
        return 0
    else:
        return turn_total + roll


def has_won(score: int) -> bool:
    """Return whether score has reached the goal."""
    return score >= GOAL


print("pig's __name__ is " + __name__)
~~~

Executing `pig.py` directly prints:

~~~text
pig's __name__ is __main__
~~~

Executing the first version of `game.py`, which begins with `import pig`, prints:

~~~text
pig's __name__ is pig
9
100
False
~~~

The same statement in the same file evaluates `__name__` to a different value, depending on whether `pig.py` is the program being executed or a module being imported.

### Guarding Top-Level Statements

Because `__name__` has a different value in each situation, an `if` statement can test it. A **main guard** is an `if` statement at the bottom of a module whose condition is `__name__ == "__main__"`:

~~~python { title="pig.py (with a main guard)" }
"""Scoring rules for the dice game Pig."""

GOAL: int = 100


def points_after_roll(turn_total: int, roll: int) -> int:
    """Return the turn total after one roll. A roll of 1 ends the turn with 0 points."""
    if roll == 1:
        return 0
    else:
        return turn_total + roll


def has_won(score: int) -> bool:
    """Return whether score has reached the goal."""
    return score >= GOAL


if __name__ == "__main__":
    print(points_after_roll(turn_total=7, roll=4))
~~~

- When `pig.py` is executed directly, `__name__` is `"__main__"`, so the condition evaluates to `True` and the then block is executed. The program prints `11`.
- When `game.py` or `pig_test.py` imports `pig`, `__name__` is `"pig"`, so the condition `"pig" == "__main__"` evaluates to `False` and the then block is skipped. The definitions are still defined, and nothing extra is printed.

The main guard goes at the bottom of the module, after every definition, so that every function it calls has already been defined. Only the statements indented inside its then block are guarded. A top-level statement written outside the main guard is executed whether the module is executed directly or imported.

A main guard is useful for code that belongs to the module but should be executed only when the module is the program, such as a short demonstration while you are writing a function. It is not a replacement for unit tests. A demonstration that prints a value still depends on a person reading the output and knowing what the right value is, which is the problem unit tests solve.

## Common Import Errors

Each of these errors is reported when Python executes the line that contains the problem.

| Code | Error | Cause |
|---|---|---|
| `import pgi` | `ModuleNotFoundError` | No file named `pgi.py` can be found. Check the spelling, and check that both files are in the same folder. |
| `from pig import roll_points` | `ImportError` | The `pig` module exists, but it defines no name `roll_points`. |
| `import pig` followed by `has_won(score=100)` | `NameError` | `import pig` adds only the name `pig`. Write `pig.has_won(score=100)` or use `from pig import has_won`. |

## Unit Tests

### What Is a Unit Test?

So far, we have checked functions by calling them, printing their return values, and reading the output to see whether it looks right. This works once, but it depends on a person remembering what the right output is, and it must be repeated by hand every time the code changes.

A **unit test** is a function that calls one small unit of a program, usually one function, with specific arguments and checks whether the returned value matches the **expected value**. Because the expected value is written in the test, the check can be repeated automatically as often as we like.

### The `assert` Statement

A test checks its result with an **`assert` statement**. The keyword `assert` is followed by a Boolean expression. When the expression evaluates to `True`, nothing happens and Python continues to the next statement. When it evaluates to `False`, Python stops with an `AssertionError`.

~~~python { runnable=true editable=true title="The assert Statement" }
def points_after_roll(turn_total: int, roll: int) -> int:
    """Return the turn total after one roll. A roll of 1 ends the turn with 0 points."""
    if roll == 1:
        return 0
    else:
        return turn_total + roll


assert points_after_roll(turn_total=7, roll=4) == 11
print("First assertion passed.")

assert points_after_roll(turn_total=7, roll=1) == 0
print("Second assertion passed.")

assert points_after_roll(turn_total=7, roll=1) == 7
print("This line is never reached.")
~~~

The first two assertions evaluate to `True`. The third evaluates to `False`, because the actual value `0` is not equal to `7`, so Python reports an `AssertionError` and the final `print` is never executed. Try changing the expected value in the third assertion to `0` and running the program again.

The typical form of an assertion in a test is:

~~~python
assert actual_expression == expected_value
~~~

The left side calls the function under test. The right side is the value the function _should_ return, worked out by the person writing the test, not by calling the function.

### Writing Test Functions

Tests are written as functions in their own module. We use **pytest**, a widely used testing framework, to find and call them. pytest follows these naming conventions:

- A test module's name is the name of the module it tests followed by `_test`. The tests for `pig.py` go in `pig_test.py`, in the same folder.
- Each test is a function whose name begins with `test_`. The rest of the name describes the case it checks.
- A test function has no parameters and returns `None`.

~~~python { title="pig_test.py" }
"""Unit tests for the pig module."""

from pig import points_after_roll, has_won


def test_points_after_roll_adds_roll() -> None:
    """A roll from 2 through 6 is added to the turn total."""
    assert points_after_roll(turn_total=7, roll=4) == 11


def test_points_after_roll_first_roll() -> None:
    """The first roll of a turn starts from a turn total of 0."""
    assert points_after_roll(turn_total=0, roll=6) == 6


def test_points_after_roll_one_ends_turn() -> None:
    """A roll of 1 sets the turn total to 0."""
    assert points_after_roll(turn_total=7, roll=1) == 0


def test_has_won_below_goal() -> None:
    """A score just below the goal has not won."""
    assert has_won(score=99) == False


def test_has_won_at_goal() -> None:
    """A score exactly at the goal has won."""
    assert has_won(score=100) == True
~~~

Notice how importing makes this arrangement possible. `pig.py` holds the code that does the work, and `pig_test.py` holds the code that checks it. The test module imports the functions it tests, so the tests do not need their own copy of `pig`'s definitions, and `pig.py` does not need to contain any testing code.

Each test checks one case and has a docstring describing that case. When a test fails, its name and docstring tell you which behavior is broken.

### Running pytest

To run the tests, open a terminal in the folder that holds both files and enter:

~~~text
python -m pytest pig_test.py
~~~

pytest imports `pig_test`, which in turn imports `pig`. It then finds every function whose name begins with `test_` and calls each one. A test **passes** if its call completes without an error. A test **fails** if an assertion in it evaluates to `False` or if any other error occurs.

When every test passes, pytest prints a dot for each test and a summary:

~~~text
pig_test.py .....                                                 [100%]

============================== 5 passed in 0.02s ===============================
~~~

### Reading a Failing Test

Suppose `has_won` were written with `>` instead of `>=`:

~~~python
def has_won(score: int) -> bool:
    """Return whether score has reached the goal."""
    return score > GOAL
~~~

Running pytest again produces this report:

~~~text
pig_test.py ....F                                                 [100%]

=================================== FAILURES ===================================
_____________________________ test_has_won_at_goal _____________________________

    def test_has_won_at_goal() -> None:
        """A score exactly at the goal has won."""
>       assert has_won(score=100) == True
E       assert False == True
E        +  where False = has_won(score=100)

pig_test.py:28: AssertionError
=========================== short test summary info ============================
FAILED pig_test.py::test_has_won_at_goal - assert False == True
========================= 1 failed, 4 passed in 0.02s ==========================
~~~

Read the report from the top:

1. The line `....F` shows one character per test, in order: four passed (`.`) and the fifth failed (`F`).
2. The heading names the failing test, `test_has_won_at_goal`.
3. The line marked `>` is the assertion that evaluated to `False`.
4. The lines marked `E` show the values involved: `has_won(score=100)` returned `False`, and the assertion compared `False == True`.

The failure tells us that `has_won` returns the wrong value when the score is exactly `100`. That points directly at the comparison in `has_won`'s `return` statement.

## Choosing Test Cases

A function's tests are only as good as the cases they check. A useful set of tests covers each kind of input the function must handle.

- **Use cases** are the typical inputs the function exists for. For `points_after_roll`, rolls from `2` through `6` added to a turn total.
- **Edge cases** are inputs at a boundary, where behavior changes or where mistakes are most likely. For `has_won`, the score `100` is the boundary between not winning and winning. The score `99`, just below it, is an edge case too. For `points_after_roll`, a roll of `1` and a turn total of `0` are edge cases.

A good habit is to work out each test's expected value from the function's description, by hand, _before_ looking at its implementation. A test whose expected value was copied from the function's own output only confirms that the function does whatever it currently does.

### A Passing Test Does Not Prove Code Is Correct

Tests can show that code is wrong, but passing tests cannot show that code is right for every input. They show only that the code returns the expected value for the cases that were tested.

Consider this set of tests for `has_won`:

~~~python { title="pig_test.py (weaker tests)" }
def test_has_won_low_score() -> None:
    """A low score has not won."""
    assert has_won(score=20) == False


def test_has_won_high_score() -> None:
    """A high score has won."""
    assert has_won(score=150) == True
~~~

Both tests pass with the correct `>=` version of `has_won`. Both _also_ pass with the incorrect `>` version, because neither checks the edge case `100`. These tests would let the bug go unnoticed. This matters whenever you are checking code you did not write yourself, whether a classmate wrote it, it came from the web, or an AI tool generated it: before trusting a set of passing tests, ask which cases they check and which cases they leave out.

## Modularity Recap

Splitting the Pig program into modules gives each file one job:

| File | Job |
|---|---|
| `pig.py` | Defines the scoring rules. Contains no top-level calls outside a main guard. |
| `pig_test.py` | Imports from `pig` and checks its functions with unit tests. |
| `game.py` | Imports from `pig` and calls its functions to play the game. |

This arrangement extends the idea of function abstraction from Variable Fundamentals. A module that imports `pig` needs to know the names, parameters, and return values of `pig`'s functions, not their implementations. If `has_won` is rewritten, `game.py` and `pig_test.py` do not need to change, and running the tests again checks that the rewritten function still returns the expected values.

## You Try

### Predict: Executed Directly or Imported?

These two files are in the same folder.

~~~python { title="dice.py" }
"""Helpers for dice games."""

SIDES: int = 6


def max_total(dice_count: int) -> int:
    """Return the largest total that dice_count dice can roll."""
    return dice_count * SIDES


print("dice module: " + __name__)

if __name__ == "__main__":
    print(max_total(dice_count=2))
~~~

~~~python { title="roller.py" }
"""Use the dice module."""

from dice import max_total

print(max_total(dice_count=3))
~~~

1. What is printed when you execute `python dice.py`?
2. What is printed when you execute `python roller.py`?
3. When `roller.py` is executed, is `max_total(dice_count=2)` ever called? Why or why not?

??? note "Check your answers"

    1. `dice module: __main__` and then `12`. `dice.py` is executed directly, so its `__name__` is `"__main__"`, the main guard's condition evaluates to `True`, and its then block is executed.
    2. `dice module: dice` and then `18`. The import statement executes `dice.py`, and the `print` call outside the main guard is executed during the import. Inside `dice.py`, `__name__` is `"dice"`, so the main guard's condition evaluates to `False`.
    3. No. The call is inside the main guard's then block, which is skipped when `dice` is imported. To keep `dice.py` from printing anything when it is imported, move the first `print` call into the main guard as well.

### Write Tests for a Function

Add this function to `pig.py`. It returns how many more points a player needs to reach the goal.

~~~python
def points_needed(score: int) -> int:
    """Return how many more points are needed to reach GOAL, or 0 if score has reached it."""
    if score >= GOAL:
        return 0
    else:
        return GOAL - score
~~~

In `pig_test.py`, update the import statement so that it also imports `points_needed`. Then write at least three tests: one use case, one test for the edge case `score=100`, and one test for a score above the goal. Work out each expected value from the docstring before running pytest.

??? note "Show a solution"

    ```python
    from pig import points_after_roll, has_won, points_needed


    def test_points_needed_use_case() -> None:
        """A score below the goal needs the difference."""
        assert points_needed(score=60) == 40


    def test_points_needed_at_goal() -> None:
        """A score exactly at the goal needs 0 more points."""
        assert points_needed(score=100) == 0


    def test_points_needed_above_goal() -> None:
        """A score above the goal needs 0 more points, not a negative number."""
        assert points_needed(score=112) == 0
    ```

### Evaluate: Do These Tests Catch the Bug?

A student wrote this version of `points_needed`:

~~~python
def points_needed(score: int) -> int:
    """Return how many more points are needed to reach GOAL, or 0 if score has reached it."""
    return GOAL - score
~~~

1. For which inputs does this version return the wrong value?
2. Would each of the three tests in the solution above pass or fail with this version?
3. Write one test for `points_needed` that passes with the student's version even though the version is incorrect. What does this tell you about evaluating code by its passing tests?

??? note "Check your answers"

    1. Every score above `GOAL`. For example, `points_needed(score=112)` returns `-12` instead of `0`.
    2. `test_points_needed_use_case` passes, because `100 - 60` evaluates to `40`. `test_points_needed_at_goal` passes, because `100 - 100` evaluates to `0`. `test_points_needed_above_goal` fails, because `-12` is not equal to `0`.
    3. Any test that uses a score at or below the goal, such as `assert points_needed(score=60) == 40`. Passing tests show only that the code is correct for the cases tested. To evaluate code, check whether the tests cover every kind of input described in the docstring.

### Find the Error

Each `pig_test.py` below produces an error or an unexpected result. Predict what happens, then explain the fix.

**Version A**

~~~python
"""Unit tests for the pig module."""

import pig


def test_has_won_at_goal() -> None:
    """A score exactly at the goal has won."""
    assert has_won(score=100) == True
~~~

**Version B**

~~~python
"""Unit tests for the pig module."""

from pig import has_won


def check_has_won_at_goal() -> None:
    """A score exactly at the goal has won."""
    assert has_won(score=100) == True
~~~

??? note "Check your answers"

    - **Version A**: The test fails with a `NameError`. `import pig` adds only the name `pig` to the test module, so `has_won` cannot be resolved. Either call `pig.has_won(score=100)` or change the import to `from pig import has_won`.
    - **Version B**: No error is reported, but pytest reports `no tests ran`. The function's name does not begin with `test_`, so pytest does not recognize it as a test and never calls it. Rename it `test_has_won_at_goal`.

## Testing Whether a List Was Mutated

Every test so far has checked a function's return value. When a function has a list parameter, there is a second thing to check: whether the list passed as an argument was **mutated**, meaning its items were changed, added, or removed. A list is an object on the heap, so a list parameter holds a reference to the _same_ list the caller passed in. Any mutation made through the parameter is visible to the caller after the call completes.

Some functions are supposed to mutate their list argument, and others are supposed to leave it unchanged. A function's docstring should say which, and a unit test can check either kind of behavior.

Here is a new module with one function of each kind. `turn_score` computes the points from a turn's list of rolls and should leave that list unchanged. `bank_points` adds points to one player's entry in a list of scores, so it should mutate that list.

~~~python { title="turns.py" }
"""Functions for working with a turn's rolls in the dice game Pig."""


def turn_score(rolls: list[int]) -> int:
    """Return the points earned from a turn's rolls: 0 if any roll is 1, otherwise their sum."""
    total: int = 0
    idx: int = 0
    while idx < len(rolls):
        if rolls[idx] == 1:
            return 0
        total = total + rolls[idx]
        idx = idx + 1
    return total


def bank_points(scores: list[int], player: int, points: int) -> None:
    """Add points to the score of the player at index player in scores."""
    scores[player] = scores[player] + points
~~~

### The Pattern: Arrange, Act, Assert

A test that checks for mutation does not compare a return value. Instead, it follows three steps:

1. **Arrange**: Assign a list to a variable in the test.
2. **Act**: Call the function with that variable as the argument.
3. **Assert**: After the call completes, compare the variable's list with a list literal written out by hand.

~~~python { title="turns_test.py" }
"""Unit tests for the turns module."""

from turns import turn_score, bank_points


def test_turn_score_sums_rolls() -> None:
    """A turn with no 1s earns the sum of its rolls."""
    rolls: list[int] = [4, 6, 3]
    assert turn_score(rolls=rolls) == 13


def test_turn_score_does_not_mutate() -> None:
    """turn_score leaves its list argument unchanged."""
    rolls: list[int] = [4, 6, 3]
    turn_score(rolls=rolls)
    assert rolls == [4, 6, 3]


def test_bank_points_adds_to_one_player() -> None:
    """bank_points adds to the chosen player's score and no other."""
    scores: list[int] = [10, 20]
    bank_points(scores=scores, player=1, points=15)
    assert scores == [10, 35]
~~~

In `test_turn_score_does_not_mutate`, the call `turn_score(rolls=rolls)` is a statement by itself. Its return value is not used, because this test checks something else: the `rolls` variable in the test's frame holds a reference to the same list that `turn_score` received, so comparing `rolls` with `[4, 6, 3]` after the call checks whether `turn_score` changed that list.

`test_bank_points_adds_to_one_player` uses the same pattern to check the opposite behavior. Its expected list `[10, 35]` checks two things at once: the score at index `1` increased by `15`, and the score at index `0` did not change.

The `==` operator compares two lists item by item. It evaluates to `True` when both lists have the same length and every pair of items at the same index is equal.

### A Mutation Bug That Returns the Correct Value

Suppose `turn_score` were written with the list method `pop`, which removes and returns the last item of a list:

~~~python
def turn_score(rolls: list[int]) -> int:
    """Return the points earned from a turn's rolls: 0 if any roll is 1, otherwise their sum."""
    total: int = 0
    while len(rolls) > 0:
        roll: int = rolls.pop()
        if roll == 1:
            return 0
        total = total + roll
    return total
~~~

This version returns `13` for the rolls `[4, 6, 3]`, so `test_turn_score_sums_rolls` still passes. But each time the repeat block is executed, `pop` removes an item from the caller's list. By the time the call completes, the list is empty. A program that wanted to display a player's rolls after scoring the turn would find none left.

Only the mutation test catches this bug:

~~~text
turns_test.py .F.                                                       [100%]

=================================== FAILURES ===================================
_______________________ test_turn_score_does_not_mutate ________________________

    def test_turn_score_does_not_mutate() -> None:
        """turn_score leaves its list argument unchanged."""
        rolls: list[int] = [4, 6, 3]
        turn_score(rolls=rolls)
>       assert rolls == [4, 6, 3]
E       assert [] == [4, 6, 3]
E         
E         Right contains 3 more items, first extra item: 4
E         Use -v to get more diff

turns_test.py:16: AssertionError
=========================== short test summary info ============================
FAILED turns_test.py::test_turn_score_does_not_mutate - assert [] == [4, 6, 3]
========================= 1 failed, 2 passed in 0.02s ==========================
~~~

The `E` lines show that after the call, `rolls` refers to an empty list. This is another case where passing tests did not show that the code was correct: a set of tests that checks only return values would pass for this version.

### Compare Against a List Literal, Not an Alias

It might seem reasonable to store the "before" list in a second variable and compare against it after the call. Step through this program, which uses the `pop` version of `turn_score`, and watch the arrows from `rolls` and `expected`.

~~~python_diagram_runner { editable=true title="An Alias Hides the Mutation" }
def turn_score(rolls: list[int]) -> int:
    """Return the points earned from a turn's rolls: 0 if any roll is 1, otherwise their sum."""
    total: int = 0
    while len(rolls) > 0:
        roll: int = rolls.pop()
        if roll == 1:
            return 0
        total = total + roll
    return total


rolls: list[int] = [4, 6, 3]
expected: list[int] = rolls
turn_score(rolls=rolls)
assert rolls == expected
print("The assertion passed, but rolls is now " + str(rolls))
~~~

The assignment `expected: list[int] = rolls` does not copy the list. It stores a second reference to the same list on the heap, so `rolls` and `expected` are aliases. When `turn_score` empties that list, both variables refer to the same empty list, and `rolls == expected` evaluates to `True`. The assertion passes even though the list was mutated.

Writing the expected list as a literal, `[4, 6, 3]`, avoids this problem. The literal is evaluated after the call completes, so it constructs a new list with the original values, separate from the list the function received.

### Try It: Write a Mutation Test

Add this function to `turns.py`:

~~~python
def without_ones(rolls: list[int]) -> list[int]:
    """Return a new list of the rolls in rolls that are not 1, in the same order. rolls is unchanged."""
    result: list[int] = []
    idx: int = 0
    while idx < len(rolls):
        if rolls[idx] != 1:
            result.append(rolls[idx])
        idx = idx + 1
    return result
~~~

Its docstring promises two behaviors. Write one test for each: one that checks the returned list, and one that checks that the argument was not mutated.

??? note "Show a solution"

    ```python
    def test_without_ones_removes_ones() -> None:
        """The returned list contains every roll except the 1s, in order."""
        rolls: list[int] = [3, 1, 5, 1]
        assert without_ones(rolls=rolls) == [3, 5]


    def test_without_ones_does_not_mutate() -> None:
        """without_ones leaves its list argument unchanged."""
        rolls: list[int] = [3, 1, 5, 1]
        without_ones(rolls=rolls)
        assert rolls == [3, 1, 5, 1]
    ```

    Remember to add `without_ones` to the import statement at the top of `turns_test.py`.



### Checking for the Same List with `is`
 
The `==` operator checks whether two lists have equal items. It cannot tell whether two references point to the _same_ list on the heap or to two separate lists that happen to hold the same items. The **`is` operator** checks exactly that. The expression `a is b` evaluates to `True` when `a` and `b` refer to the same object, meaning their arrows in a memory diagram point to the same place. The expression `a is not b` evaluates to `True` when they refer to different objects.
 
Step through this diagram and compare the four printed values.
 
~~~python_diagram_runner { editable=true title="== Compared with is" }
rolls: list[int] = [4, 6, 3]
same: list[int] = rolls
copy: list[int] = [4, 6, 3]
 
print(rolls == same)
print(rolls is same)
print(rolls == copy)
print(rolls is copy)
~~~
 
The program prints `True`, `True`, `True`, and `False`. `rolls` and `same` are aliases of one list, so both comparisons evaluate to `True`. `copy` refers to a second list constructed by a second list literal. Its items are equal to those of `rolls`, so `rolls == copy` evaluates to `True`, but it is a different list, so `rolls is copy` evaluates to `False`.
 
Use `is` only to check whether two references point to the same object. To compare values such as numbers, strings, or the items of two lists, use `==`.
 
#### Two Kinds of List-Returning Functions
 
The `is` operator is useful for testing functions that return a list, because there are two different promises such a function can make:
 
- It returns a **new list** and leaves its argument unchanged, like `without_ones`. A test can check `result is not rolls`.
- It **mutates its argument and returns that same list**. A test can check `result is rolls`.
Here is a function of the second kind. Add it to `turns.py` next to `without_ones`. The list method call `rolls.pop(idx)` removes the item at index `idx`.
 
~~~python
def remove_ones(rolls: list[int]) -> list[int]:
    """Remove every 1 from rolls, keeping the other rolls in order, and return rolls."""
    idx: int = 0
    while idx < len(rolls):
        if rolls[idx] == 1:
            rolls.pop(idx)
        else:
            idx = idx + 1
    return rolls
~~~
 
When `pop` removes an item, the items after it each move one index lower, so `idx` is increased only when the item at `idx` is kept.
 
These tests check each function's promise:
 
~~~python { title="turns_test.py (identity tests)" }
"""Unit tests for the turns module."""
 
from turns import without_ones, remove_ones
 
 
def test_without_ones_returns_new_list() -> None:
    """without_ones returns a different list from its argument."""
    rolls: list[int] = [4, 6, 3]
    result: list[int] = without_ones(rolls=rolls)
    assert result is not rolls
 
 
def test_remove_ones_mutates_and_returns_same_list() -> None:
    """remove_ones removes the 1s from its argument and returns that same list."""
    rolls: list[int] = [1, 3, 1, 1, 5]
    result: list[int] = remove_ones(rolls=rolls)
    assert result is rolls
    assert rolls == [3, 5]
~~~
 
The second test needs both assertions. `result is rolls` checks that the returned reference points to the argument's list, but it says nothing about that list's items. `rolls == [3, 5]` checks that the list was mutated correctly. Its argument `[1, 3, 1, 1, 5]` includes two 1s in a row, an edge case where a mistake in when to increase `idx` would leave a `1` behind.
 
Similarly, `result is not rolls` does not show that `without_ones` left `rolls` unchanged; a function could return a new list _and_ mutate its argument. That is still the job of the mutation test from earlier, which compares `rolls` with a list literal after the call.
 
#### A Bug Only `is not` Catches
 
Suppose someone added a shortcut to `without_ones`: when no rolls were removed, return the original list instead of the new one.
 
~~~python
def without_ones(rolls: list[int]) -> list[int]:
    """Return a new list of the rolls in rolls that are not 1, in the same order. rolls is unchanged."""
    result: list[int] = []
    idx: int = 0
    while idx < len(rolls):
        if rolls[idx] != 1:
            result.append(rolls[idx])
        idx = idx + 1
    if len(result) == len(rolls):
        return rolls
    return result
~~~
 
This version never mutates `rolls`, and for every argument it returns a list whose items are correct. Every test that uses `==` passes, including the mutation test. But for an argument with no 1s, the docstring's promise of a _new_ list is broken. A caller who later mutates the returned list mutates their original list too:
 
~~~python
rolls: list[int] = [4, 6, 3]
kept: list[int] = without_ones(rolls=rolls)
kept.append(2)
print(rolls)  # Prints [4, 6, 3, 2] with the shortcut version
~~~
 
The `is not` test is the one that catches it:
 
~~~text
turns_test.py F.                                                         [100%]
 
=================================== FAILURES ===================================
______________________ test_without_ones_returns_new_list ______________________
 
    def test_without_ones_returns_new_list() -> None:
        """without_ones returns a different list from its argument."""
        rolls: list[int] = [4, 6, 3]
        result: list[int] = without_ones(rolls=rolls)
>       assert result is not rolls
E       assert [4, 6, 3] is not [4, 6, 3]
 
turns_test.py:10: AssertionError
=========================== short test summary info ============================
FAILED turns_test.py::test_without_ones_returns_new_list - assert [4, 6, 3] i...
========================= 1 failed, 1 passed in 0.02s ==========================
~~~
 
The line `assert [4, 6, 3] is not [4, 6, 3]` can look surprising at first. pytest displays the items of each list, and those items are equal. The assertion fails because both sides refer to the same list on the heap.
 
Notice which argument the test uses. With an argument that contains a 1, such as `[3, 1, 5, 1]`, the shortcut is never taken, and the test would pass. Like the other bugs on this page, this one is caught only by a test whose input reaches the case where the mistake happens.
 

## Testing That an `AssertionError` Is Raised

### Assert Statements Inside a Function

So far, `assert` statements have appeared only in tests. They can also appear inside a function, to check that the function's arguments meet the requirements in its docstring. If an argument does not meet a requirement, the assertion evaluates to `False` and Python **raises** an `AssertionError`: the function call stops, and the rest of the function body is not executed.

Here is a stricter version of `points_after_roll`, along with a new function, `highest_roll`. Each one begins by checking its arguments.

~~~python { title="pig.py (checking arguments)" }
"""Scoring rules for the dice game Pig."""


def points_after_roll(turn_total: int, roll: int) -> int:
    """Return the turn total after one roll. A roll of 1 ends the turn with 0 points.

    roll must be from 1 through 6.
    """
    assert roll >= 1, "roll is less than 1"
    assert roll <= 6, "roll is greater than 6"
    if roll == 1:
        return 0
    else:
        return turn_total + roll


def highest_roll(rolls: list[int]) -> int:
    """Return the largest roll in rolls. rolls must not be empty."""
    assert len(rolls) > 0, "rolls is empty"
    highest: int = rolls[0]
    idx: int = 1
    while idx < len(rolls):
        if rolls[idx] > highest:
            highest = rolls[idx]
        idx = idx + 1
    return highest
~~~

The string after the comma in each `assert` statement is an optional **assertion message**. When the assertion evaluates to `False`, the message is included in the error report, so a reader knows which requirement was not met. For example, calling `points_after_roll(turn_total=7, roll=9)` ends with:

~~~text
AssertionError: roll is greater than 6
~~~

Without these checks, a die roll of `9` would produce a turn total of `16`, and the program would continue with a value that is impossible in the game. Raising an error at the call with the bad argument makes the mistake visible where it happens. `highest_roll` needs its check for a different reason: with an empty list, `rolls[0]` has no item to read.

### Writing a Test That Expects an Error

Raising an `AssertionError` for a bad argument is part of these functions' behavior, so it deserves tests too. But a test that simply calls `points_after_roll(turn_total=7, roll=0)` would fail, because the `AssertionError` would stop the test function itself.

pytest provides `pytest.raises` for this situation. Notice that the test module imports the `pytest` module with `import pytest`, so `raises` is accessed with dot notation, just like `pig.has_won` earlier on this page.

~~~python { title="pig_test.py (testing for errors)" }
"""Unit tests for the pig module."""

import pytest
from pig import points_after_roll, highest_roll


def test_points_after_roll_rejects_zero() -> None:
    """A roll less than 1 raises an AssertionError."""
    with pytest.raises(AssertionError):
        points_after_roll(turn_total=7, roll=0)


def test_points_after_roll_rejects_seven() -> None:
    """A roll greater than 6 raises an AssertionError."""
    with pytest.raises(AssertionError):
        points_after_roll(turn_total=7, roll=7)


def test_points_after_roll_accepts_six() -> None:
    """A roll of 6, the largest valid roll, is added to the turn total."""
    assert points_after_roll(turn_total=7, roll=6) == 13


def test_highest_roll_rejects_empty_list() -> None:
    """An empty list of rolls raises an AssertionError."""
    with pytest.raises(AssertionError):
        highest_roll(rolls=[])


def test_highest_roll_one_roll() -> None:
    """A list with one roll, the shortest valid list, returns that roll."""
    assert highest_roll(rolls=[4]) == 4
~~~

The line `with pytest.raises(AssertionError):` is followed by an indented **`with` block**. The test passes only if an `AssertionError` is raised while the `with` block is executed. If the `with` block completes without raising an `AssertionError`, the test fails. In other words, `pytest.raises` reverses the usual rule: for these tests, the error is the expected result.

Keep only one call in each `with` block. As soon as the error is raised, the rest of the `with` block is skipped, so a second call would never be executed and would never be checked.

### Test Both Sides of Each Boundary

Each requirement in a docstring creates a boundary, and the edge-case habit from earlier applies to both sides of it:

| Requirement | Raises an `AssertionError` | Does not raise an error |
|---|---|---|
| `roll` is at least 1 | `roll=0` | `roll=1` |
| `roll` is at most 6 | `roll=7` | `roll=6` |
| `rolls` is not empty | `rolls=[]` | `rolls=[4]` |

Tests for the right-hand column matter as much as tests for the left. A version of `points_after_roll` that checked `assert roll < 6` would correctly reject `7`, but it would also wrongly reject `6`. Only `test_points_after_roll_accepts_six` would catch that mistake.

### Reading a Failing Error Test

Suppose the second `assert` statement were left out of `points_after_roll`. A roll of `7` would no longer raise an error, and `points_after_roll(turn_total=7, roll=7)` would return `14`. pytest reports:

~~~text
pig_test.py .F...                                                        [100%]

=================================== FAILURES ===================================
_____________________ test_points_after_roll_rejects_seven _____________________

    def test_points_after_roll_rejects_seven() -> None:
        """A roll greater than 6 raises an AssertionError."""
>       with pytest.raises(AssertionError):
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
E       Failed: DID NOT RAISE AssertionError

pig_test.py:15: Failed
=========================== short test summary info ============================
FAILED pig_test.py::test_points_after_roll_rejects_seven - Failed: DID NOT RA...
========================= 1 failed, 4 passed in 0.02s ==========================
~~~

The message `DID NOT RAISE AssertionError` means the `with` block completed without an `AssertionError` being raised, so the requirement "roll is at most 6" is not being checked.

### Try It: A String of the Wrong Length

In Wordle, every guess and every secret word has exactly 5 letters. This function counts how many letters of a guess are in the same position as in the secret word:

~~~python { title="wordle.py" }
"""Scoring helpers for the word game Wordle."""


def count_exact_matches(guess: str, secret: str) -> int:
    """Return how many positions of guess have the same letter as secret.

    guess and secret must each be 5 letters long.
    """
    assert len(guess) == 5, "guess is not 5 letters long"
    assert len(secret) == 5, "secret is not 5 letters long"
    count: int = 0
    idx: int = 0
    while idx < 5:
        if guess[idx] == secret[idx]:
            count = count + 1
        idx = idx + 1
    return count
~~~

In `wordle_test.py`, write three tests for `count_exact_matches`: one for a guess that is too short, one for a guess that is too long, and one for a valid guess that checks the returned count.

??? note "Show a solution"

    ```python
    """Unit tests for the wordle module."""

    import pytest
    from wordle import count_exact_matches


    def test_count_exact_matches_rejects_short_guess() -> None:
        """A guess shorter than 5 letters raises an AssertionError."""
        with pytest.raises(AssertionError):
            count_exact_matches(guess="TRAP", secret="CRANE")


    def test_count_exact_matches_rejects_long_guess() -> None:
        """A guess longer than 5 letters raises an AssertionError."""
        with pytest.raises(AssertionError):
            count_exact_matches(guess="CRANES", secret="CRANE")


    def test_count_exact_matches_counts_positions() -> None:
        """Letters in the same position as the secret are counted."""
        assert count_exact_matches(guess="TRACE", secret="CRANE") == 3
    ```

    In `"TRACE"` and `"CRANE"`, the letters at indices `1`, `2`, and `4` (`R`, `A`, and `E`) match, so the expected count is `3`. For more practice, add tests for a `secret` that is too short or too long.

## Key Terminology Review

- **Modularity**: Dividing a program into separate parts, each with one clear job.
- **Module**: A Python file whose name ends in `.py`. The module's name is the file name without `.py`.
- **Module docstring**: A docstring at the top of a module that describes its purpose.
- **`import` statement**: A statement that executes a module, if it has not been imported yet, and adds names from it to the current module.
- **`import module_name`**: Adds the module's name; its definitions are used with dot notation, as in `pig.has_won`.
- **`from module_name import name`**: Adds the listed names directly, so they are used without a prefix.
- **`__name__`**: A global variable in every module. Its value is `"__main__"` when the module's file is executed directly and the module's name when it is imported.
- **Main guard**: An `if` statement with the condition `__name__ == "__main__"`, whose then block is executed only when the module's file is executed directly.
- **`ModuleNotFoundError`**: The error Python reports when it cannot find a module with the requested name.
- **`ImportError`**: The error Python reports when a module exists but does not define a requested name.
- **Unit test**: A function that calls one small unit of a program with specific arguments and checks the result against an expected value.
- **Expected value**: The value a function should return for a test's arguments, worked out from the function's description.
- **`assert` statement**: A statement that does nothing when its expression evaluates to `True` and stops with an `AssertionError` when it evaluates to `False`.
- **`AssertionError`**: The error Python reports when an `assert` statement's expression evaluates to `False`.
- **pytest**: A testing framework that finds functions whose names begin with `test_` in `_test` modules and calls them.
- **Pass / fail**: A test passes if its call completes without an error and fails if an assertion evaluates to `False` or any other error occurs.
- **Use case**: A typical input a function is meant to handle.
- **Edge case**: An input at a boundary, where a function's behavior changes or mistakes are most likely.
- **Mutate**: To change, add, or remove the items of a list. A mutation made through a parameter is visible to the caller, because the parameter and the caller's variable refer to the same list.
- **Mutation test**: A unit test that calls a function with a list argument and then compares that list with a list literal, to check whether the function mutated it as its docstring describes.
- **Raise**: To stop the current function call with an error. An `assert` statement whose expression evaluates to `False` raises an `AssertionError`.
- **Assertion message**: An optional string after a comma in an `assert` statement, included in the error report when the assertion evaluates to `False`.
- **`pytest.raises`**: A pytest function used with a `with` statement. The test passes only if the expected error is raised while the indented `with` block is executed.