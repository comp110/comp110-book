---
title: "for Loops and range"
description: Repeat a block of code once for each item in a list, and use range to loop over sequences of integers, including a list's indices.
---

## Repeating Once per Item

With a `while` loop, you can process every item in a list by managing an index variable yourself. This function totals a list of floats:

~~~python { runnable=true editable=true title="Totaling a List with a while Loop" }
def total(values: list[float]) -> float:
    """Return the sum of the values in a list."""
    result: float = 0.0
    i: int = 0
    while i < len(values):
        result = result + values[i]
        i = i + 1
    return result


print(total(values=[4.0, 2.5, 3.5]))
~~~

Only one statement in the repeat block, `result = result + values[i]`, does the work the function exists for. Everything involving `i` manages the index: initializing it to `0`, checking `i < len(values)` before each repeat, and adding `1` to it at the end of each repeat. Each of those is a place for a bug. Leaving out `i = i + 1` produces an infinite loop, and writing `i <= len(values)` raises an `IndexError`.

Processing every item in a list, in order, is common enough that Python has a statement for exactly that: the **`for` loop**. Here is the same function written with one:

~~~python { runnable=true editable=true title="Totaling a List with a for Loop" }
def total(values: list[float]) -> float:
    """Return the sum of the values in a list."""
    result: float = 0.0
    for value in values:
        result = result + value
    return result


print(total(values=[4.0, 2.5, 3.5]))
~~~

Both versions print `10.0`. The `for` loop version has no index variable to initialize, check, or update.

## The Parts of a `for` Loop

~~~text
for <loop variable> in <sequence>:
    <repeat block>
~~~

- The **sequence** is an expression that evaluates to a sequence of items, such as a list.
- The **loop variable** is a variable name you choose. Python assigns it each item of the sequence, one at a time.
- The **repeat block** is the indented block of statements after the colon, just as in a `while` loop.

Python executes a `for` loop in these steps:

1. Evaluate the sequence expression.
2. If the sequence has a next item, assign that item to the loop variable. If there are no items left, the loop is complete: skip the repeat block and continue with the first statement after the loop.
3. Execute the repeat block, then return to step 2.

Each execution of the repeat block is called an **iteration**. Items are assigned to the loop variable in order, from index `0` through the last index, so the repeat block is executed once per item.

Notice that a `for` loop has no condition. A `while` loop's repeat block is executed as long as its condition evaluates to `True`. A `for` loop's repeat block is executed once for each item in the sequence.

### Tracing the Loop

Here is how the variables change when `total(values=[4.0, 2.5, 3.5])` is called:

| Iteration | `value` | `result` after the repeat block |
|---|---|---|
| (before the loop) | (not yet assigned) | `0.0` |
| 1 | `4.0` | `4.0` |
| 2 | `2.5` | `6.5` |
| 3 | `3.5` | `10.0` |

After the third iteration, the list has no items left, so the loop is complete and Python executes `return result`. Step through the diagram and watch `value` and `result` change in the `total` frame.

~~~python_diagram_runner { editable=true title="Stepping Through a for Loop" }
def total(values: list[float]) -> float:
    """Return the sum of the values in a list."""
    result: float = 0.0
    for value in values:
        result = result + value
    return result


print(total(values=[4.0, 2.5, 3.5]))
~~~

### The Loop Variable

- **It has no type annotation.** Python does not allow one in a `for` statement. The loop variable's type is the type of the list's items: looping over a `list[float]` assigns the loop variable a `float` each iteration.
- **Its name is for the reader.** A common convention is to name the loop variable with the singular form of the list's name, as in `for score in scores` or `for name in names`. Python does not use the names to connect the two; `for x in scores` behaves the same way, but it is harder to read.
- **It is an ordinary variable.** The loop variable is created in the frame where the loop is executed, and Python reassigns it at the start of each iteration. After the loop is complete, it still holds the last item it was assigned.

### Looping over an Empty List

If the list has no items, step 2 finds no next item the first time it is checked. The repeat block is never executed, and the loop variable is never assigned. Calling `total(values=[])` returns `0.0`, the value `result` was initialized with.

## Common Patterns

Most `for` loops that process a list follow one of a few patterns. In each one, a variable is initialized _before_ the loop, updated in the repeat block, and used _after_ the loop.

### Counting

A walker's goal is 10,000 steps a day. This function counts how many days in a list met the goal:

~~~python { runnable=true editable=true title="Counting Days That Met a Goal" }
def count_at_least(daily_steps: list[int], goal: int) -> int:
    """Return the number of step counts that are at least goal."""
    count: int = 0
    for steps in daily_steps:
        if steps >= goal:
            count = count + 1
    return count


week: list[int] = [8200, 10450, 12000, 6100, 10000, 9800, 11250]
print(count_at_least(daily_steps=week, goal=10000))
~~~

The repeat block is executed seven times, once per day. The then block, `count = count + 1`, is executed only in the iterations where `steps >= goal` evaluates to `True`, so the program prints `4`.

### Finding the Largest Item

This function finds the warmest temperature in a list of daily highs, in degrees Celsius:

~~~python { runnable=true editable=true title="Finding the Warmest Day" }
def warmest(temps: list[float]) -> float:
    """Return the largest temperature in a non-empty list."""
    best: float = temps[0]
    for temp in temps:
        if temp > best:
            best = temp
    return best


winter_week: list[float] = [-3.5, -8.0, -1.5, -6.0]
print(warmest(temps=winter_week))
~~~

The program prints `-1.5`. `best` is initialized with the list's first item, not with `0.0`. If it were initialized with `0.0`, no temperature in `winter_week` would be greater than it, and the function would return `0.0`, a temperature that is not in the list. Initializing with an item from the list guarantees the result is one of the list's items.

Because the function evaluates `temps[0]`, calling it with an empty list raises an `IndexError`. The docstring states that the list must be non-empty.

### Building a New List

This function returns a new list of temperatures converted from Fahrenheit to Celsius:

~~~python { runnable=true editable=true title="Converting Every Item" }
def to_celsius(temps_f: list[float]) -> list[float]:
    """Return a new list of temperatures converted from Fahrenheit to Celsius."""
    result: list[float] = []
    for temp in temps_f:
        result.append((temp - 32.0) * 5.0 / 9.0)
    return result


readings: list[float] = [32.0, 50.0, 212.0]
converted: list[float] = to_celsius(temps_f=readings)
print(converted)
print(readings)
~~~

The program prints `[0.0, 10.0, 100.0]` and then `[32.0, 50.0, 212.0]`. Each iteration appends one item to `result`, so the new list has the same number of items as `temps_f`. The original list is not changed. Placing the `append` call inside an `if` statement instead would build a list of only the items that meet a condition.

### Searching and Returning Early

This function determines whether a name appears in a list:

~~~python { runnable=true editable=true title="Searching a List" }
def contains(names: list[str], target: str) -> bool:
    """Return whether target is one of the items in names."""
    for name in names:
        if name == target:
            return True
    return False


roster: list[str] = ["Ada", "Grace", "Alan"]
print(contains(names=roster, target="Grace"))
print(contains(names=roster, target="Linus"))
~~~

The program prints `True` and then `False`.

- When `target` is `"Grace"`, `name == target` evaluates to `True` in the second iteration. Executing `return True` completes the function call, and with it the loop, so `"Alan"` is never assigned to `name`.
- When `target` is `"Linus"`, `name == target` evaluates to `False` in all three iterations. The loop completes, and Python executes the statement after it, `return False`.

The function can return `True` as soon as it finds a match, but it can only conclude `False` after every item has been checked. That is why `return False` is placed _after_ the loop, not inside the repeat block. Common Errors, below, shows what happens when it is placed inside.

## `range`: Sequences of Integers

A `for` loop works with any sequence, not only a list. The built-in function **`range`** evaluates to a sequence of integers. Run this program:

~~~python { runnable=true editable=true title="Looping over a range" }
for i in range(5):
    print(i)
~~~

The program prints `0`, `1`, `2`, `3`, and `4`, each on its own line. `range(5)` is the sequence of integers starting at `0` and going up to, **but not including**, `5`.

### Three Ways to Call `range`

| Call | Sequence of integers | Example | Values in the example |
|---|---|---|---|
| `range(stop)` | From `0` up to but not including `stop` | `range(5)` | `0, 1, 2, 3, 4` |
| `range(start, stop)` | From `start` up to but not including `stop` | `range(2, 6)` | `2, 3, 4, 5` |
| `range(start, stop, step)` | From `start`, adding `step` each time, ending before `stop` is reached | `range(0, 10, 3)` | `0, 3, 6, 9` |

A negative `step` produces a sequence that counts down. `range(5, 0, -1)` is the sequence `5, 4, 3, 2, 1`. The `stop` value is still excluded.

Some rules worth remembering:

- **`stop` is never included.** `range(n)` has exactly `n` integers, `0` through `n - 1`. These are exactly the valid indices of a list with `n` items, which is the reason `range` is so often used with lists.
- **A `range` can be empty.** If `start` has already reached or passed `stop`, the range has no integers. `range(0)`, `range(3, 3)`, and `range(5, 2)` are all empty, and a `for` loop over an empty range executes its repeat block zero times.
- **The arguments are `int`s, given by position.** `range(5.0)` and `range(stop=5)` both raise a `TypeError`.

### A `range` Is Not a List

Run this program:

~~~python { runnable=true editable=true title="Printing a range" }
print(range(5))
print(range(2, 6))
~~~

It prints `range(0, 5)` and `range(2, 6)`, not lists of integers. A range object stores only its start, stop, and step. It does not store each integer the way a list stores each item. In a `for` loop, Python computes each integer of the range when it is assigned to the loop variable.

### Example: The Integers Themselves

Sometimes the integers are what a program needs, with no list to start from. This function builds one row of a multiplication table:

~~~python { runnable=true editable=true title="A Row of the Times Table" }
def times_row(base: int, count: int) -> list[int]:
    """Return the first count multiples of base, starting with base itself."""
    result: list[int] = []
    for n in range(1, count + 1):
        result.append(base * n)
    return result


print(times_row(base=7, count=5))
~~~

The program prints `[7, 14, 21, 28, 35]`. The range starts at `1` because the first multiple is `7 * 1`. It stops at `count + 1` so that `count` itself is included, since `stop` is excluded.

## Looping over a List's Indices

`range(len(values))` is the sequence of every valid index of `values`, in order. Looping over it assigns the loop variable an _index_ each iteration, not an item. The item at that index is `values[i]`.

The loop variable for an index is often named `i`, for _index_. Use this form when a loop needs to know _where_ an item is, not only _what_ it is. Three situations call for it.

### Changing the Items of a List

To change an item of a list, a program must assign to an index of that list, as in `scores[i] = ...`. Assigning a new value to a loop variable does not change the list (see Common Errors, below). This function adds bonus points to each score in a list:

~~~python { runnable=true editable=true title="Changing Every Item" }
def add_bonus(scores: list[int], bonus: int) -> None:
    """Add bonus points to every score in scores."""
    for i in range(len(scores)):
        scores[i] = scores[i] + bonus


quiz_scores: list[int] = [72, 88, 91]
add_bonus(scores=quiz_scores, bonus=5)
print(quiz_scores)
~~~

The program prints `[77, 93, 96]`. Step through the diagram. The parameter `scores` and the global variable `quiz_scores` refer to the same list on the heap, so the assignments to `scores[i]` change the list that `quiz_scores` refers to. This is why `add_bonus` returns `None`: it changes the list it is given rather than building a new one.

~~~python_diagram_runner { editable=true title="Stepping Through add_bonus" }
def add_bonus(scores: list[int], bonus: int) -> None:
    """Add bonus points to every score in scores."""
    for i in range(len(scores)):
        scores[i] = scores[i] + bonus


quiz_scores: list[int] = [72, 88, 91]
add_bonus(scores=quiz_scores, bonus=5)
print(quiz_scores)
~~~

### Comparing an Item with Its Neighbor

This function counts how many days had more steps than the day before:

~~~python { runnable=true editable=true title="Comparing Neighboring Items" }
def count_increases(daily_steps: list[int]) -> int:
    """Return the number of days whose step count was higher than the previous day's."""
    count: int = 0
    for i in range(1, len(daily_steps)):
        if daily_steps[i] > daily_steps[i - 1]:
            count = count + 1
    return count


week: list[int] = [8200, 10450, 12000, 6100, 10000, 9800, 11250]
print(count_increases(daily_steps=week))
~~~

The program prints `4`. The range starts at `1` because the first day has no previous day to compare with. Starting at `0` would not raise an error: in the first iteration, `daily_steps[i - 1]` would be `daily_steps[-1]`, the _last_ item in the list, and the function would compare the first day with the last day.

### Matching Items Across Two Lists

When two lists store related information at matching indices, an index lets a loop read from both. Here, `scores[i]` is the score of the player whose name is `names[i]`:

~~~python { runnable=true editable=true title="Matching Items Across Two Lists" }
def top_scorer(names: list[str], scores: list[int]) -> str:
    """Return the name matching the highest score; names and scores are non-empty and the same length."""
    best_index: int = 0
    for i in range(1, len(scores)):
        if scores[i] > scores[best_index]:
            best_index = i
    return names[best_index]


players: list[str] = ["Ada", "Grace", "Alan"]
points: list[int] = [12, 20, 15]
print(top_scorer(names=players, scores=points))
~~~

The program prints `Grace`. A loop over the items of `scores` would know each score but not which position it came from, so it could not find the matching name. The function remembers the best _index_, which works for both lists.

## Choosing Between the Two Forms

| A loop needs to... | Use |
|---|---|
| Read each item's value, in order | `for item in items:` |
| Assign new values to a list's items | `for i in range(len(items)):` |
| Know an item's position, or compare it with a neighbor | `for i in range(...):` with indices |
| Read matching items from two lists | `for i in range(len(items)):` |
| Repeat with integers that do not come from a list | `for n in range(...):` |

When either form works, prefer looping over the items. It has fewer places for mistakes: no index arithmetic, and no chance of an `IndexError`.

## Common Errors

### Assigning to the Loop Variable

This version of `add_bonus` assigns the loop variable instead of an index of the list. Predict what it prints, then step through it.

~~~python_diagram_runner { editable=true title="Assigning to the Loop Variable" }
def add_bonus(scores: list[int], bonus: int) -> None:
    """Add bonus points to every score in scores."""
    for score in scores:
        score = score + bonus


quiz_scores: list[int] = [72, 88, 91]
add_bonus(scores=quiz_scores, bonus=5)
print(quiz_scores)
~~~

The program prints `[72, 88, 91]`, and no error is raised. At the start of each iteration, Python assigns `score` the `int` stored at the next index of the list. `score = score + bonus` then assigns the variable `score` in the `add_bonus` frame a new value. No statement assigns to an index of the list, so the list never changes. At the start of the next iteration, `score` is reassigned the next item, and the value it held is discarded.

To change the items of a list, loop over its indices and assign to `scores[i]`, as in the earlier version.

### Using an Item as an Index

~~~python { runnable=true editable=true title="Using an Item as an Index" }
quiz_scores: list[int] = [72, 88, 91]
total: int = 0
for score in quiz_scores:
    total = total + quiz_scores[score]
print(total)
~~~

This program mixes the two forms. `score` is assigned an _item_, `72`, but the repeat block uses it as an _index_. Python raises an `IndexError` in the first iteration, because `quiz_scores` has no index `72`. If a list's items happen to be small integers, the same mistake raises no error and silently produces a wrong result. Use the item directly, `total = total + score`, or loop over `range(len(quiz_scores))` and use `quiz_scores[i]`.

### Being Off by One with `range`

`range(len(values))` already ends at the last valid index. Changing either end of it is a common source of errors:

- `range(len(values) + 1)` includes `len(values)`, which is not a valid index. Python raises an `IndexError` in the last iteration.
- `range(1, len(values))` skips index `0`. No error is raised, but the first item is never processed.
- A repeat block that evaluates `values[i + 1]` raises an `IndexError` in the last iteration of `range(len(values))`, when `i + 1` is `len(values)`. Use `range(len(values) - 1)` with `values[i + 1]`, or `range(1, len(values))` with `values[i - 1]`.

### Returning Too Early

This version of `contains` places `return False` inside the repeat block:

~~~python { runnable=true editable=true title="Returning Too Early" }
def contains(names: list[str], target: str) -> bool:
    """Return whether target is one of the items in names."""
    for name in names:
        if name == target:
            return True
        else:
            return False


roster: list[str] = ["Ada", "Grace", "Alan"]
print(contains(names=roster, target="Ada"))
print(contains(names=roster, target="Grace"))
~~~

The program prints `True` and then `False`, even though `"Grace"` is in the list. In the first iteration, `name` is `"Ada"`. Either the then block or the `else` block is executed, and both contain a `return` statement, so the function call completes during the first iteration no matter what. Only the first item is ever checked. Move `return False` out of the repeat block, after the loop, so that it is executed only once every item has been checked.

### Passing Keyword Arguments to `range`

~~~python
for i in range(stop=5):  # TypeError: range() takes no keyword arguments
    print(i)
~~~

`range` accepts its arguments only by position. Write `range(5)`, `range(2, 6)`, or `range(0, 10, 2)`.

### Annotating the Loop Variable

~~~python
for value: float in values:  # SyntaxError
    print(value)
~~~

Python does not allow a type annotation on a loop variable. Write `for value in values:`.

## Key Terminology Review

- **`for` loop**: A statement that executes its repeat block once for each item in a sequence, assigning each item to the loop variable in turn.
- **Loop variable**: The variable named between `for` and `in`. Python assigns it the next item of the sequence at the start of each iteration. It has no type annotation.
- **Sequence**: The expression after `in`, which evaluates to a sequence of items, such as a list or a range.
- **Repeat block**: The indented block of statements in a loop, which is executed once per iteration.
- **Iteration**: One execution of a loop's repeat block.
- **`range`**: A built-in function that evaluates to a sequence of integers, from `start` up to but not including `stop`, counting by `step`. `start` defaults to `0` and `step` defaults to `1`.
- **`range(len(values))`**: The sequence of every valid index of `values`, from `0` through `len(values) - 1`. Looping over it assigns the loop variable an index rather than an item.
- **`IndexError`**: The error Python reports when a program evaluates an index that is not valid for a list, such as `values[len(values)]`.