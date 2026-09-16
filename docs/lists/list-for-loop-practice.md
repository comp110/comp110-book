---
title: Lists and for Loops
description: Use for loops to visit every element of a list, and learn when a for loop or a while loop is the better fit.
---

In [Lists and While Loops Practice](list-while-practice.md), every loop followed the same three steps: initialize an index to `0`, check that the index is less than the list's length, and increase the index at the end of the repeat block. Python's **`for` loop** performs those steps automatically, which makes visiting every element of a list shorter to write and harder to get wrong.

## A `for` Loop Visits Each Element

A `for` loop is written with the keyword `for`, a **loop variable**, the keyword `in`, and a list. Its repeat block is executed once for each element of the list. Before each execution, Python assigns the next element to the loop variable. This is often called a **for-each** loop, since the repeat block is executed once *for each* element.

Compare these two programs. They print the same output.

~~~python_diagram_runner { editable=true title="Printing Elements with a while Loop" }
words: list[str] = ["apple", "banana", "cherry"]

i: int = 0
while i < len(words):
    print(words[i])
    i = i + 1
~~~

~~~python_diagram_runner { editable=true title="Printing Elements with a for Loop" }
words: list[str] = ["apple", "banana", "cherry"]

for word in words:
    print(word)
~~~

Step through the `for` loop diagram and watch the loop variable `word`. It is assigned `"apple"`, then `"banana"`, then `"cherry"`, without any index or condition in the program. The loop ends after the repeat block has been executed for the last element.

The loop variable is a variable like any other. It is added to the current frame the first time the repeat block begins, and it can be given any name. Choosing a singular noun for the loop variable and a plural noun for the list, such as `word` and `words`, communicates that each iteration works with one element of the list.

### You Try: Print Each Score

Rewrite this `while` loop as a `for` loop that prints the same output. The loop variable should be named `score`.

~~~python { runnable=true editable=true title="You Try: Rewrite with for" }
scores: list[int] = [88, 92, 75]

# TODO: Replace the while loop with a for loop.
i: int = 0
while i < len(scores):
    print(scores[i])
    i = i + 1
~~~

## The Same Patterns with `for` Loops

Each pattern from the previous page can be written with a `for` loop. The accumulator, counter, or result list is still initialized before the loop, and the repeat block still updates it. The difference is that the element is read from the loop variable rather than through subscription notation.

### Accumulating a Total

~~~python { runnable=true editable=true title="Total Points with a for Loop" }
def total_points(turns: list[int]) -> int:
    """Add up the points earned across every turn."""
    total: int = 0
    for points in turns:
        total = total + points
    return total


print(total_points(turns=[8, 0, 15, 6]))
~~~

### Counting with a Condition

~~~python { runnable=true editable=true title="Counting Sixes with a for Loop" }
def count_sixes(rolls: list[int]) -> int:
    """Count how many rolls landed on six."""
    count: int = 0
    for roll in rolls:
        if roll == 6:
            count = count + 1
    return count


print(count_sixes(rolls=[6, 2, 6, 6, 1, 4]))
~~~

### Searching and Returning Early

A `return` statement inside a `for` loop's repeat block ends the function call immediately, just as it does inside a `while` loop.

~~~python_diagram_runner { editable=true title="Searching with a for Loop" }
def already_guessed(letter: str, guesses: list[str]) -> bool:
    """Check whether letter appears in guesses."""
    for guess in guesses:
        if guess == letter:
            return True
    return False


print(already_guessed(letter="e", guesses=["a", "e", "t"]))
print(already_guessed(letter="s", guesses=["a", "e", "t"]))
~~~

### Building a New List

~~~python { runnable=true editable=true title="Scoring Rolls with a for Loop" }
def scoring_rolls(rolls: list[int]) -> list[int]:
    """Build a list of the rolls that are not ones."""
    result: list[int] = []
    for roll in rolls:
        if roll != 1:
            result.append(roll)
    return result


print(scoring_rolls(rolls=[5, 1, 3, 6, 1, 2]))
~~~

### You Try: High Score with a `for` Loop

Write `high_score` using a `for` loop. Initialize `best` to the first element, then let the loop compare every element to `best`. Comparing the first element to itself is harmless, since `scores[0] > scores[0]` evaluates to `False`.

~~~python { runnable=true editable=true title="You Try: High Score" }
def high_score(scores: list[int]) -> int:
    """Find the largest score in a non-empty list."""
    # TODO: Track the largest score seen so far using a for loop.
    return 0


print(high_score(scores=[42, 87, 61, 87, 15]))
~~~

The call above should print `87`.

## When the Index is Needed: `range`

A for-each loop gives the repeat block each element, but not that element's index. Some tasks need the index, such as printing `0: apple` or changing an element in place. For these, a `for` loop can walk through a list of indices instead.

The **`range`** function produces the sequence of integers from `0` up to, but not including, its argument. The loop `for i in range(len(words))` assigns `i` the values `0`, `1`, and `2` for a three-element list, which are exactly the valid indices.

~~~python { runnable=true editable=true title="Index and Element with range" }
words: list[str] = ["apple", "banana", "cherry"]

for i in range(len(words)):
    print(str(i) + ": " + words[i])
~~~

### Changing Elements Requires an Index

Assigning to the loop variable of a for-each loop does not change the list. The loop variable refers to the element's value, and reassigning the variable only makes it refer to something else.

~~~python_diagram_runner { editable=true title="Reassigning the Loop Variable" }
prices: list[float] = [2.0, 4.0]

for price in prices:
    price = price * 2.0

print(prices)
~~~

The list still prints `[2.0, 4.0]`. To change the elements themselves, assign through subscription notation using an index.

~~~python_diagram_runner { editable=true title="Changing Elements with an Index" }
prices: list[float] = [2.0, 4.0]

for i in range(len(prices)):
    prices[i] = prices[i] * 2.0

print(prices)
~~~

### You Try: Add a Bonus to Every Score

Write `add_bonus`, which adds `bonus` to every element of `scores` in place. The function returns `None`; because lists are reference types, the caller's list is changed.

~~~python { runnable=true editable=true title="You Try: Add Bonus In Place" }
def add_bonus(scores: list[int], bonus: int) -> None:
    """Add bonus to every element of scores."""
    # TODO: Use range and subscription notation to change each element.


game_scores: list[int] = [7, 3, 12]
add_bonus(scores=game_scores, bonus=5)
print(game_scores)
~~~

The program should print `[12, 8, 17]`.

## Nested `for` Loops and 2D Lists

For a `list[list[int]]`, a for-each loop over the outer list assigns each row to the loop variable. A second `for` loop nested inside then visits the values in that row. There is no inner index to reset, because the inner loop starts over automatically for each row.

~~~python { runnable=true editable=true title="Total of a 2D List with for Loops" }
def grand_total(table: list[list[int]]) -> int:
    """Add up every value in a 2D list."""
    total: int = 0
    for row in table:
        for value in row:
            total = total + value
    return total


points: list[list[int]] = [
    [8, 0, 15],
    [12, 4, 0],
]
print(grand_total(table=points))
~~~

The loop variable `row` has type `list[int]`, and the loop variable `value` has type `int`.

### You Try: Print a Board

Write `show_board` using nested `for` loops. For each row, build a string of its cells separated by spaces, then print it.

~~~python { runnable=true editable=true title="You Try: Show Board" }
def show_board(board: list[list[str]]) -> None:
    """Print each row of the board on its own line."""
    # TODO: Use a for loop over rows and a nested for loop over cells.


game: list[list[str]] = [
    ["X", "O", "X"],
    ["_", "X", "O"],
    ["O", "_", "X"],
]
show_board(board=game)
~~~

## Comparing `while` and `for` Loops

Both kinds of loop execute a repeat block more than once. They differ in what decides when the loop ends.

- A **`for` loop** ends after the repeat block has been executed once for each element of a list, or once for each integer produced by `range`. The number of iterations is known from the list's length before the loop begins.
- A **`while` loop** ends when its condition evaluates to `False`. The number of iterations depends on how the values in the condition change, and it may not be known before the loop begins.

### Choose `for` When Every Element is Visited

When a task visits every element of a list once, in order, a `for` loop expresses that directly. The index, the condition, and the `i = i + 1` statement are all handled by Python, which removes three common opportunities for mistakes: forgetting to initialize the index, writing `<=` instead of `<`, and forgetting to increase the index.

Both of these functions calculate the same average. The `for` version has less to keep track of.

~~~python { runnable=true editable=true title="Average with a while Loop" }
def average(values: list[float]) -> float:
    """Calculate the average of a non-empty list."""
    total: float = 0.0
    i: int = 0
    while i < len(values):
        total = total + values[i]
        i = i + 1
    return total / len(values)


print(average(values=[90.0, 85.5, 100.0]))
~~~

~~~python { runnable=true editable=true title="Average with a for Loop" }
def average(values: list[float]) -> float:
    """Calculate the average of a non-empty list."""
    total: float = 0.0
    for value in values:
        total = total + value
    return total / len(values)


print(average(values=[90.0, 85.5, 100.0]))
~~~

### Choose `while` When the Stopping Condition is Not a Count

Some loops do not visit each element of a list. They repeat until something becomes true, and there may not be a list at all. A `while` loop is the right fit for these.

In Pig, a player keeps rolling until a `1` is rolled. The number of rolls is not known in advance, so a `for` loop over a fixed list cannot express this.

~~~python { runnable=true editable=true title="Rolling Until a One" }
def roll_die() -> int:
    """Simulate a six-sided die."""
    from random import randint
    return randint(1, 6)


rolls: list[int] = []
latest: int = roll_die()
while latest != 1:
    rolls.append(latest)
    latest = roll_die()

print(rolls)
~~~

Run the program several times. The list is a different length each time, because the loop ends only when `latest != 1` evaluates to `False`.

A `while` loop is also the right choice when the index should change by something other than `1`, or when the loop should move through a list backwards.

~~~python { runnable=true editable=true title="Every Other Element" }
values: list[int] = [3, 1, 4, 1, 5, 9]

i: int = 0
while i < len(values):
    print(values[i])
    i = i + 2
~~~

### Summary of Differences

| Question | `for` loop | `while` loop |
| --- | --- | --- |
| What decides when it ends? | Reaching the end of the list or `range` | A condition evaluating to `False` |
| Is the number of iterations known in advance? | Yes, the length of the list | Not necessarily |
| Who updates the loop variable? | Python, before each iteration | The program, inside the repeat block |
| Can the repeat block reach an element by index? | Only when looping over `range(len(items))` | Yes, using the index variable |
| Typical use | Visit every element of a list | Repeat until a condition changes; unusual steps through a list |

Anything a `for` loop can do, a `while` loop can also do with an index. The reverse is not true: a `for` loop over a list cannot repeat an unknown number of times. Prefer a `for` loop when it fits, and use a `while` loop when it does not.

## Trace These Programs

Predict the output of each program before running it.

~~~python { runnable=true editable=true title="Trace 1" }
letters: list[str] = ["a", "b", "c"]
result: str = ""
for letter in letters:
    result = letter + result
print(result)
~~~

~~~python { runnable=true editable=true title="Trace 2" }
count: int = 0
for i in range(5):
    if i % 2 == 0:
        count = count + 1
print(count)
~~~

~~~python { runnable=true editable=true title="Trace 3" }
numbers: list[int] = [1, 2, 3]
for n in numbers:
    n = n * 10
print(numbers)

for i in range(len(numbers)):
    numbers[i] = numbers[i] * 10
print(numbers)
~~~

## Key Terminology Review

- **`for` loop**: A loop whose repeat block is executed once for each element of a list or each integer produced by `range`.
- **Loop variable**: The variable a `for` loop assigns before each iteration, holding the current element or index.
- **For-each loop**: A `for` loop written as `for item in items`, which assigns each element to the loop variable in order.
- **`range`**: A function that produces the integers from `0` up to, but not including, its argument; `range(len(items))` produces every valid index of `items`.
- **`while` loop**: A loop whose repeat block is executed as long as its condition evaluates to `True`.
- **Repeat block**: The indented statements executed on each iteration of a `for` or `while` loop.
- **Iteration**: One execution of a loop's repeat block.