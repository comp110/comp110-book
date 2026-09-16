---
title: Lists and while Loops Practice
description: Practice using while loops to read, count, search, and build lists, including nested loops over 2D lists.
---

<!-- In [List Fundamentals](list-fundamentals-practice.md), you learned to initialize a list, read and change an element with subscription notation, and add or remove elements with `append` and `pop`. Each of those examples worked with one element at a time. This page combines lists with `while` loops so that a program can visit every element of a list, no matter how many it holds. -->

<!-- ## Walking Through a List with an Index

A `while` loop and an index variable let us visit every element of a list, one at a time. The index starts at `0`, the repeat block reads the element at that index, and the index is increased by `1` at the end of each iteration. The loop ends when the condition `i < len(items)` evaluates to `False`, which happens as soon as `i` reaches the number of elements.

Step through this diagram and watch `i` change while `words` stays the same.

~~~python_diagram_runner { editable=true title="Printing Each Element" }
words: list[str] = ["apple", "banana", "cherry"]

i: int = 0
while i < len(words):
    print(words[i])
    i = i + 1
~~~

As in List Fundamentals, `words[i]` is subscription notation, and `len(words)` evaluates to the number of elements. Notice that the last valid index is `2` even though the list has `3` elements. Using `i <= len(words)` as the condition would cause the repeat block to be executed one extra time with `i` equal to `3`, and reading `words[3]` would produce an `IndexError`. -->

### You Try: Print Each Element with Its Index

Edit the program so that each line of output shows the index followed by the element, such as `0: apple`. Remember that `i` is an `int`, so it must be converted with `str` before it is joined with the other strings.

~~~python { runnable=true editable=true title="You Try: Index and Element" }
words: list[str] = ["apple", "banana", "cherry"]

i: int = 0
while i < len(words):
    # TODO: Print the index, a colon and a space, then the element.
    print(words[i])
    i = i + 1
~~~

## Accumulating a Total

A list of numbers can be combined into a single result by keeping a running total in a variable. Each iteration of the loop reads one element and adds it to the total.

In the dice game Pig, a player earns points across several turns. This function adds up the points from every turn.

~~~python { runnable=true editable=true title="Total Points Across Turns" }
def total_points(turns: list[int]) -> int:
    """Add up the points earned across every turn."""
    total: int = 0
    i: int = 0
    while i < len(turns):
        total = total + turns[i]
        i = i + 1
    return total


print(total_points(turns=[8, 0, 15, 6]))
~~~

The variable `total` is initialized to `0` before the loop begins. After the first iteration its value is `8`, after the second it is still `8`, and after all four iterations it is `29`, which is then returned.

### You Try: Average Score

Write the function `average_score`, which returns the average of the floats in `scores`. Reuse the accumulating pattern from `total_points`, then divide by the number of elements after the loop ends. You may assume the list has at least one element.

~~~python { runnable=true editable=true title="You Try: Average Score" }
def average_score(scores: list[float]) -> float:
    """Calculate the average of a list of scores."""
    # TODO: Accumulate the total, then divide by len(scores).
    return 0.0


print(average_score(scores=[90.0, 85.5, 100.0]))
~~~

The call above should print `91.83333333333333`.

## Counting Elements that Satisfy a Condition

Instead of adding each element to a total, we can add `1` to a counter only when a condition about the element evaluates to `True`. The `if` statement inside the repeat block decides which iterations update the counter.

~~~python { runnable=true editable=true title="Counting Sixes" }
def count_sixes(rolls: list[int]) -> int:
    """Count how many rolls landed on six."""
    count: int = 0
    i: int = 0
    while i < len(rolls):
        if rolls[i] == 6:
            count = count + 1
        i = i + 1
    return count


print(count_sixes(rolls=[6, 2, 6, 6, 1, 4]))
~~~

Notice that `i = i + 1` is indented under the repeat block but not under the `if` statement. If it were placed inside the then block, `i` would stop increasing as soon as `rolls[i] == 6` evaluated to `False`, and the loop would never end.

### You Try: Count Passing Scores

Write `count_passing`, which returns how many elements of `scores` are greater than or equal to `threshold`.

~~~python { runnable=true editable=true title="You Try: Count Passing Scores" }
def count_passing(scores: list[float], threshold: float) -> int:
    """Count the scores that are at or above the threshold."""
    # TODO: Count the elements greater than or equal to threshold.
    return 0


print(count_passing(scores=[72.0, 88.5, 64.0, 95.0], threshold=70.0))
~~~

The call above should print `3`.
<!-- 
## Finding a Maximum

To find the largest value in a list, keep track of the largest value seen so far. The tracking variable is initialized to the first element, and the loop begins at index `1`. Whenever an element is greater than the value seen so far, that element replaces it.

~~~python_diagram_runner { editable=true title="High Score" }
def high_score(scores: list[int]) -> int:
    """Find the largest score in a non-empty list."""
    best: int = scores[0]
    i: int = 1
    while i < len(scores):
        if scores[i] > best:
            best = scores[i]
        i = i + 1
    return best


print(high_score(scores=[42, 87, 61, 87, 15]))
~~~

Step through the diagram and count how many times the assignment `best = scores[i]` is executed. The second `87` does not cause an assignment because `87 > 87` evaluates to `False`. -->

### You Try: Index of the Longest Word

Write `longest_word_index`, which returns the index of the longest string in `words`. If two words are tied for longest, return the index of the first one. This time, track the index of the best element rather than the element itself, and use `len(words[i])` to compare lengths.

~~~python { runnable=true editable=true title="You Try: Longest Word" }
def longest_word_index(words: list[str]) -> int:
    """Find the index of the longest word in a non-empty list."""
    # TODO: Track the index of the longest word seen so far.
    return 0


print(longest_word_index(words=["hi", "hello", "hey", "howdy"]))
~~~

The call above should print `1`.
<!-- 
## Searching a List

Sometimes we need to know whether a list contains a particular value. The loop compares each element to the value being searched for. As soon as a match is found, the function can `return True` immediately; there is no need to look at the rest of the list. If the loop ends without a match, the function returns `False` after the loop.

In Hangman, a player should not be charged for guessing a letter they have already tried. This function checks a list of previous guesses.

~~~python_diagram_runner { editable=true title="Already Guessed?" }
def already_guessed(letter: str, guesses: list[str]) -> bool:
    """Check whether letter appears in guesses."""
    i: int = 0
    while i < len(guesses):
        if guesses[i] == letter:
            return True
        i = i + 1
    return False


print(already_guessed(letter="e", guesses=["a", "e", "t"]))
print(already_guessed(letter="s", guesses=["a", "e", "t"]))
~~~

Step through the first call. The `return True` statement ends the function call during the second iteration, so the third element is never read. Then step through the second call and notice that `return False` is reached only after the condition `i < len(guesses)` evaluates to `False`. -->

### You Try: Find the Index of a Value

Write `index_of`, which returns the index of the first element equal to `target`. If `target` is not in `items`, return `-1`.

~~~python { runnable=true editable=true title="You Try: Index Of" }
def index_of(target: str, items: list[str]) -> int:
    """Find the index of target in items, or -1 if it is absent."""
    # TODO: Return the index of the first match, or -1 after the loop.
    return -1


print(index_of(target="cherry", items=["apple", "banana", "cherry"]))
print(index_of(target="grape", items=["apple", "banana", "cherry"]))
~~~

The calls above should print `2` and then `-1`.

## Building a New List

A loop can also produce a new list. The result list is initialized as an empty list literal `[]` before the loop, and the `append` method from List Fundamentals adds an element to it during some or all iterations. Because `append` mutates the list that `result` refers to, the variable never needs to be reassigned. The original list is not changed.

This function keeps only the rolls that count as scoring rolls in Pig, where rolling a `1` ends the turn with no points.

~~~python { runnable=true editable=true title="Keeping Scoring Rolls" }
def scoring_rolls(rolls: list[int]) -> list[int]:
    """Build a list of the rolls that are not ones."""
    result: list[int] = []
    i: int = 0
    while i < len(rolls):
        if rolls[i] != 1:
            result.append(rolls[i])
        i = i + 1
    return result


print(scoring_rolls(rolls=[5, 1, 3, 6, 1, 2]))
~~~

### You Try: Doubled Values

Write `doubled`, which returns a new list where each element is twice the corresponding element of `values`. Every element should be appended, so no `if` statement is needed.

~~~python { runnable=true editable=true title="You Try: Doubled" }
def doubled(values: list[int]) -> list[int]:
    """Build a list with each value doubled."""
    # TODO: Append values[i] * 2 for every index.
    return []


print(doubled(values=[1, 4, 10]))
~~~

The call above should print `[2, 8, 20]`.
<!-- 
## Nested While Loops and 2D Lists

A list can contain other lists. A `list[list[int]]` is often called a **2D list** because it can be pictured as a grid with rows and columns. The outer list holds the rows, and each row is itself a list of values.

To visit every value, one loop walks through the rows and a second loop, nested inside the first, walks through the values in the current row. The inner index must be reset to `0` each time the outer loop moves to a new row.

Recall from List Fundamentals that a list is a reference type: each element of the outer list is a reference to a row that lives elsewhere in memory. Here, each row records one player's points across three rounds of Pig.

~~~python_diagram_runner { editable=true title="Total of a 2D List" }
def grand_total(table: list[list[int]]) -> int:
    """Add up every value in a 2D list."""
    total: int = 0
    row: int = 0
    while row < len(table):
        col: int = 0
        while col < len(table[row]):
            total = total + table[row][col]
            col = col + 1
        row = row + 1
    return total


points: list[list[int]] = [
    [8, 0, 15],
    [12, 4, 0],
]
print(grand_total(table=points))
~~~

The expression `table[row]` uses subscription notation to read one row, which is a `list[int]`. The expression `table[row][col]` then reads a single `int` from that row. Step through the diagram and notice how `col` returns to `0` when `row` becomes `1`. -->

### You Try: Total for Each Player

Write `row_totals`, which returns a new list containing the total of each row. For the `points` list below, the result should be `[23, 16]`. Use the inner loop to accumulate one row's total, then append that total to the result after the inner loop ends.

~~~python { runnable=true editable=true title="You Try: Row Totals" }
def row_totals(table: list[list[int]]) -> list[int]:
    """Build a list holding the total of each row."""
    # TODO: For each row, accumulate its total and append it to result.
    return []


points: list[list[int]] = [
    [8, 0, 15],
    [12, 4, 0],
]
print(row_totals(table=points))
~~~

### Displaying a Grid

Nested loops are also useful for displaying a grid one row per line. This function builds a string for each row of a tic-tac-toe board and prints it.

~~~python { runnable=true editable=true title="Printing a Board" }
def show_board(board: list[list[str]]) -> None:
    """Print each row of the board on its own line."""
    row: int = 0
    while row < len(board):
        line: str = ""
        col: int = 0
        while col < len(board[row]):
            line = line + board[row][col] + " "
            col = col + 1
        print(line)
        row = row + 1


game: list[list[str]] = [
    ["X", "O", "X"],
    ["_", "X", "O"],
    ["O", "_", "X"],
]
show_board(board=game)
~~~

The variable `line` is initialized to `""` inside the outer repeat block so that each row starts from an empty string.

### You Try: Count a Player's Marks

Write `count_marks`, which returns how many cells of `board` are equal to `mark`. For the `game` board above, `count_marks(board=game, mark="X")` should return `4`.

~~~python { runnable=true editable=true title="You Try: Count Marks" }
def count_marks(board: list[list[str]], mark: str) -> int:
    """Count how many cells contain mark."""
    # TODO: Use nested loops and add 1 to a counter for each match.
    return 0


game: list[list[str]] = [
    ["X", "O", "X"],
    ["_", "X", "O"],
    ["O", "_", "X"],
]
print(count_marks(board=game, mark="X"))
print(count_marks(board=game, mark="_"))
~~~

The calls above should print `4` and then `2`.

### Challenge: Is a Row Full?

Write `row_is_full`, which returns `True` when every cell in row `row_index` of `board` is equal to `mark`. Return `False` as soon as one cell in that row does not match, and return `True` only after the loop has checked every cell. Only one loop is needed, because `row_index` already identifies the row.

~~~python { runnable=true editable=true title="Challenge: Row Is Full" }
def row_is_full(board: list[list[str]], row_index: int, mark: str) -> bool:
    """Check whether every cell in one row contains mark."""
    # TODO: Return False on the first mismatch; return True after the loop.
    return False


game: list[list[str]] = [
    ["X", "X", "X"],
    ["_", "O", "O"],
    ["O", "_", "X"],
]
print(row_is_full(board=game, row_index=0, mark="X"))
print(row_is_full(board=game, row_index=1, mark="O"))
~~~

The calls above should print `True` and then `False`. Once this works, consider how you could call it from another loop to check every row of the board.

## Trace These Programs

For each program, predict the output before running it.

~~~python { runnable=true editable=true title="Trace 1" }
values: list[int] = [3, 1, 4, 1, 5]
i: int = 0
count: int = 0
while i < len(values):
    if values[i] > 2:
        count = count + 1
    i = i + 2
print(count)
~~~

~~~python { runnable=true editable=true title="Trace 2" }
grid: list[list[int]] = [[1, 2], [3, 4], [5, 6]]
r: int = 0
total: int = 0
while r < len(grid):
    total = total + grid[r][0]
    r = r + 1
print(total)
~~~

~~~python { runnable=true editable=true title="Trace 3" }
letters: list[str] = ["a", "b", "c"]
result: list[str] = []
i: int = len(letters) - 1
while i >= 0:
    result.append(letters[i])
    i = i - 1
print(result)
~~~

## Key Patterns Review

- **Walk with an index**: Initialize `i` to `0`, loop while `i < len(items)`, and increase `i` at the end of the repeat block.
- **Accumulate**: Initialize a total before the loop and update it in every iteration.
- **Count**: Initialize a counter before the loop and add `1` only when a condition evaluates to `True`.
- **Track the best so far**: Initialize the tracking variable to the first element and replace it whenever a better element is found.
- **Search**: Return as soon as a match is found; return the "not found" result after the loop.
- **Build a new list**: Initialize an empty list before the loop and `append` to it during the loop.
- **Nested loops for 2D lists**: The outer loop walks the rows; the inner loop walks the values in `table[row]`, and its index is reset to `0` for every row.

Every pattern above relies on the list operations from List Fundamentals: `len` to bound the loop, subscription notation to read one element, and `append` to build a result. Notice that none of the functions on this page mutate the list they receive as a parameter; they read from it and return a new value. Because lists are reference types, a function that did call `append` or assign to an index of its parameter would change the caller's list as well.