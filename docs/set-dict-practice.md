---
title: "Practice: Sets and Dictionaries"
description: Predict how sets and dictionaries are mutated, trace loops over them, find intersections and unions, and write functions that use add, remove, pop, len, in, and for loops.
---

## How to Use This Page

Most exercises ask you to **predict first**. Before you run a program or step through a diagram, write down what you expect each line to print. Then run it and compare. The places where your prediction and the output disagree are the places worth studying.

A set has no order, so when an exercise builds a set, its tests compare the result with an expected set using `==` and print `True` or `False`, rather than printing the set itself.

Each code block runs on its own, so functions are defined again in each exercise that uses them.

## Part 1: Sets

### Predict: A Set of Guesses

Predict each line this program prints, then run it.

~~~python { runnable=true editable=true title="Predict: A Set of Guesses" }
guessed: set[str] = {"s", "t", "s"}
print(len(guessed))
guessed.add("a")
guessed.add("t")
print(len(guessed))
guessed.remove("s")
print("s" in guessed)
print("t" in guessed)
print(len(guessed))
print(guessed == {"t", "a"})
~~~

1. What six lines are printed?
2. If one more line, `guessed.remove("s")`, were added at the end, what would happen?
3. If that line were `guessed.add("t")` instead, what would happen?

??? note "Check your answers"

    1. `2`, `3`, `False`, `True`, `2`, and `True`.
        - The literal lists `"s"` twice, so the set starts with 2 items.
        - `"a"` is new and `"t"` is already present, so after both calls the set has 3 items.
        - After `"s"` is removed, the set holds `"t"` and `"a"`, which equals `{"t", "a"}` regardless of order.
    2. Python raises a `KeyError`, because `"s"` is no longer in the set.
    3. Nothing visible: `"t"` is already in the set, so `add` does not mutate it, and no error is raised.

### You Try: How Many Different Words?

Players in a word game each choose a starting word. Complete `count_unique`, which returns how many _different_ words are in the list.

~~~python { runnable=true editable=true title="You Try: count_unique" }
def count_unique(words: list[str]) -> int:
    """Return the number of different words in words."""
    # TODO: Replace return 0 with your implementation.
    return 0


print(count_unique(words=["crane", "slate", "crane", "adieu", "slate"]))  # Expected: 3
print(count_unique(words=["crane"]))  # Expected: 1
print(count_unique(words=[]))  # Expected: 0
~~~

??? note "Show a solution"

    ```python
    def count_unique(words: list[str]) -> int:
        """Return the number of different words in words."""
        seen: set[str] = set()
        for word in words:
            seen.add(word)
        return len(seen)
    ```

    There is no need to check `word in seen` before calling `add`. Adding a word that is already in the set does not mutate the set, which is exactly the behavior this function relies on.

### You Try: The First Repeat

Complete `first_repeat`, which returns the first die roll in the list that matches an _earlier_ roll, or `-1` if no roll repeats. Return as soon as the answer is known.

~~~python { runnable=true editable=true title="You Try: first_repeat" }
def first_repeat(rolls: list[int]) -> int:
    """Return the first roll that matches an earlier roll, or -1 if there is none."""
    # TODO: Replace return -1 with your implementation.
    return -1


print(first_repeat(rolls=[4, 2, 6, 2, 4]))  # Expected: 2
print(first_repeat(rolls=[5, 5, 1]))  # Expected: 5
print(first_repeat(rolls=[1, 2, 3, 4]))  # Expected: -1
~~~

??? note "Show a solution"

    ```python
    def first_repeat(rolls: list[int]) -> int:
        """Return the first roll that matches an earlier roll, or -1 if there is none."""
        seen: set[int] = set()
        for roll in rolls:
            if roll in seen:
                return roll
            seen.add(roll)
        return -1
    ```

    The loop is over the _list_, not the set, because the order of the rolls determines which repeat is first. The set only answers "has this roll appeared already?" In the first test, `4` also repeats, but `2` repeats first, at index `3`.

    The check must come before the `add`. If the roll were added first, `roll in seen` would evaluate to `True` in every iteration, and the function would return the first roll.

### Predict: Two Guesses

In a word game, a player's first two guesses are `crane` and `slate`. Each guess's letters are stored as a set.

~~~python { runnable=true editable=true title="Predict: Two Guesses" }
crane: set[str] = {"c", "r", "a", "n", "e"}
slate: set[str] = {"s", "l", "a", "t", "e"}

print(len(crane & slate))
print(len(crane | slate))
print((crane & slate) == {"a", "e"})
print((slate | crane) == (crane | slate))
print(len(crane & {"x", "y"}))
print(len(crane))
~~~

1. Before running anything, sort the letters into three groups, as if drawing a Venn diagram with one circle per guess: letters only in `crane`, letters in both, and letters only in `slate`.
2. Which of your groups make up `crane & slate`? Which make up `crane | slate`?
3. Predict the six lines printed, then run the program.

??? note "Check your answers"

    1. Only in `crane`: `c`, `r`, `n`. In both: `a`, `e`. Only in `slate`: `s`, `l`, `t`.
    2. `crane & slate` is the middle group alone, `{"a", "e"}`. `crane | slate` is all three groups together: 8 letters.
    3. `2`, `8`, `True`, `True`, `0`, and `5`.
        - `len(crane | slate)` is `5 + 5 - 2`. The two shared letters would be counted twice by `len(crane) + len(slate)`, but a set stores each only once.
        - The order of the operands does not matter for `|` (or for `&`).
        - `crane` and `{"x", "y"}` have no letters in common, so their intersection is the empty set.
        - `len(crane)` is still `5`. Neither operator mutates the sets it is applied to.

### You Try: Songs on Both Playlists (Intersection)

Complete `shared`, which returns a **new** set of the songs that are in both `playlist_a` and `playlist_b`: their intersection. Neither set passed in should be mutated. Use a loop, not the `&` operator.

~~~python { runnable=true editable=true title="You Try: shared" }
def shared(playlist_a: set[str], playlist_b: set[str]) -> set[str]:
    """Return a new set of the songs in both playlist_a and playlist_b."""
    # TODO: Replace return set() with your implementation.
    return set()


mine: set[str] = {"Sunrise", "Static", "Paper Boats", "Tidal"}
yours: set[str] = {"Tidal", "Overpass", "Sunrise"}
print(shared(playlist_a=mine, playlist_b=yours) == {"Sunrise", "Tidal"})  # Expected: True
print(shared(playlist_a=mine, playlist_b={"Overpass"}) == set())  # Expected: True
print(len(mine))  # Expected: 4
~~~

??? note "Show a solution"

    ```python
    def shared(playlist_a: set[str], playlist_b: set[str]) -> set[str]:
        """Return a new set of the songs in both playlist_a and playlist_b."""
        result: set[str] = set()
        for song in playlist_a:
            if song in playlist_b:
                result.add(song)
        return result
    ```

    Looping over `playlist_b` and checking `song in playlist_a` produces an equal set. The songs may be added to `result` in a different order, but a set has no order, so the two results are equal.

### You Try: The Combined Playlist (Union)

Complete `combined`, which returns a **new** set of every song that is in `playlist_a`, `playlist_b`, or both: their union. Neither set passed in should be mutated. Use loops, not the `|` operator.

~~~python { runnable=true editable=true title="You Try: combined" }
def combined(playlist_a: set[str], playlist_b: set[str]) -> set[str]:
    """Return a new set of the songs in playlist_a, playlist_b, or both."""
    # TODO: Replace return set() with your implementation.
    return set()


mine: set[str] = {"Sunrise", "Static", "Paper Boats", "Tidal"}
yours: set[str] = {"Tidal", "Overpass", "Sunrise"}
party: set[str] = combined(playlist_a=mine, playlist_b=yours)
print(len(party))  # Expected: 5
print(party == {"Sunrise", "Static", "Paper Boats", "Tidal", "Overpass"})  # Expected: True
print(combined(playlist_a=mine, playlist_b=set()) == mine)  # Expected: True
print(len(mine))  # Expected: 4
~~~

??? note "Show a solution"

    ```python
    def combined(playlist_a: set[str], playlist_b: set[str]) -> set[str]:
        """Return a new set of the songs in playlist_a, playlist_b, or both."""
        result: set[str] = set()
        for song in playlist_a:
            result.add(song)
        for song in playlist_b:
            result.add(song)
        return result
    ```

    `"Sunrise"` and `"Tidal"` are added twice, but the second `add` of each does not mutate `result`, so no `in` check is needed.

    Adding the songs of `playlist_b` to `playlist_a` directly, with `playlist_a.add(song)`, and returning `playlist_a` would return a set with the right songs, but it would mutate the caller's set: the last test would print `5`, not `4`.

### Check with the Operators

Once both of your functions pass their tests, use Python's operators to check them. Paste your `shared` and `combined` into this block and run it. Every line should print `True`.

~~~python { runnable=true editable=true title="Check: Loops vs. Operators" }
def shared(playlist_a: set[str], playlist_b: set[str]) -> set[str]:
    """Return a new set of the songs in both playlist_a and playlist_b."""
    # TODO: Paste your implementation.
    return set()


def combined(playlist_a: set[str], playlist_b: set[str]) -> set[str]:
    """Return a new set of the songs in playlist_a, playlist_b, or both."""
    # TODO: Paste your implementation.
    return set()


mine: set[str] = {"Sunrise", "Static", "Paper Boats", "Tidal"}
yours: set[str] = {"Tidal", "Overpass", "Sunrise"}
print(shared(playlist_a=mine, playlist_b=yours) == mine & yours)
print(combined(playlist_a=mine, playlist_b=yours) == mine | yours)
print(shared(playlist_a=yours, playlist_b=mine) == shared(playlist_a=mine, playlist_b=yours))
print(len(combined(playlist_a=mine, playlist_b=yours)) == len(mine) + len(yours) - len(shared(playlist_a=mine, playlist_b=yours)))
~~~

Then answer: now that you know `&` and `|`, how could each function's body be rewritten as a single `return` statement?

??? note "Check your answers"

    With correct functions, all four lines print `True`. The third line checks that the order of the arguments does not matter. The fourth checks that the union counts each shared song only once.

    ```python
    def shared(playlist_a: set[str], playlist_b: set[str]) -> set[str]:
        """Return a new set of the songs in both playlist_a and playlist_b."""
        return playlist_a & playlist_b


    def combined(playlist_a: set[str], playlist_b: set[str]) -> set[str]:
        """Return a new set of the songs in playlist_a, playlist_b, or both."""
        return playlist_a | playlist_b
    ```

    Both operators evaluate to a new set, so these versions also do not mutate the arguments.

    The `intersection` and `union` methods from the reference page would work too: `return playlist_a.intersection(playlist_b)` and `return playlist_a.union(playlist_b)`.

### You Try: Checking Off Tasks

`todo` is a set of tasks not yet done. `finished` is a list of tasks completed today, which may include tasks that were never on the to-do set. Complete `check_off`, which removes each finished task from `todo` if it is there, and returns how many tasks it removed.

~~~python { runnable=true editable=true title="You Try: check_off" }
def check_off(todo: set[str], finished: list[str]) -> int:
    """Remove each task in finished from todo, and return how many were removed."""
    # TODO: Replace return 0 with your implementation.
    return 0


tasks: set[str] = {"laundry", "dishes", "email"}
print(check_off(todo=tasks, finished=["email", "gym", "dishes"]))  # Expected: 2
print(tasks == {"laundry"})  # Expected: True
print(check_off(todo=tasks, finished=[]))  # Expected: 0
~~~

??? note "Show a solution"

    ```python
    def check_off(todo: set[str], finished: list[str]) -> int:
        """Remove each task in finished from todo, and return how many were removed."""
        count: int = 0
        for task in finished:
            if task in todo:
                todo.remove(task)
                count = count + 1
        return count
    ```

    Without the `if` statement, the call to `remove` would raise a `KeyError` for `"gym"`. The loop is over `finished`, not `todo`, so removing items from `todo` during the loop does not raise a `RuntimeError`.

## Part 2: Dictionaries

### Predict: The Bakery Case

Predict each line this program prints, then run it.

~~~python { runnable=true editable=true title="Predict: The Bakery Case" }
stock: dict[str, int] = {"bagel": 12, "muffin": 8}
stock["scone"] = 6
stock["bagel"] = stock["bagel"] - 5
removed: int = stock.pop("muffin")
stock["muffin"] = 0
print(stock)
print(removed)
print(len(stock))
print(6 in stock)
print("scone" in stock)
~~~

1. What five lines are printed?
2. In the dictionary that is printed, in what order do the keys appear? Why is `"muffin"` where it is?

??? note "Check your answers"

    1. `{'bagel': 7, 'scone': 6, 'muffin': 0}`, `8`, `3`, `False`, and `True`. `6 in stock` evaluates to `False` because `in` checks keys, and `6` is only a value.
    2. `"bagel"`, `"scone"`, `"muffin"`. Assigning `stock["bagel"]` a new value keeps `"bagel"` in its position. But popping `"muffin"` removed it entirely, so assigning `stock["muffin"] = 0` adds it as a new key, at the end.

### Trace: A Points Bonus

Before stepping through the diagram, answer the questions below.

~~~python_diagram_runner { editable=true title="Trace: A Points Bonus" }
points: dict[str, int] = {"Ada": 12, "Grace": 20, "Alan": 15}
bonus_count: int = 0

for name in points:
    if points[name] < 16:
        points[name] = points[name] + 3
        bonus_count = bonus_count + 1

print(points)
print(bonus_count)
print(name)
~~~

1. Copy and complete this table, showing the values at the end of each iteration.

    | Iteration | `name` | `points[name]` | `bonus_count` |
    |---|---|---|---|
    | 1 | | | |
    | 2 | | | |
    | 3 | | | |

2. What three lines are printed?
3. The repeat block assigns to `points[name]` while the loop is over `points`. Why does this not raise a `RuntimeError`?

??? note "Check your answers"

    1. The completed table:

        | Iteration | `name` | `points[name]` | `bonus_count` |
        |---|---|---|---|
        | 1 | `"Ada"` | `15` | `1` |
        | 2 | `"Grace"` | `20` | `1` |
        | 3 | `"Alan"` | `18` | `2` |

    2. `{'Ada': 15, 'Grace': 20, 'Alan': 18}`, `2`, and `Alan`.
    3. Every key the repeat block assigns to is already in the dictionary, so each assignment replaces a value and no key is added or removed. Only a change in the dictionary's size during the loop raises a `RuntimeError`.

### You Try: Tallying Votes

A class is voting on which food truck to bring to an event. Complete `tally`, which returns a dictionary of how many votes each choice received, with the choices in the order they first appear.

~~~python { runnable=true editable=true title="You Try: tally" }
def tally(votes: list[str]) -> dict[str, int]:
    """Return a dictionary of how many times each choice appears in votes."""
    # TODO: Replace return {} with your implementation.
    return {}


ballots: list[str] = ["pizza", "tacos", "pizza", "sushi", "pizza", "tacos"]
print(tally(votes=ballots))  # Expected: {'pizza': 3, 'tacos': 2, 'sushi': 1}
print(tally(votes=[]))  # Expected: {}
~~~

??? note "Show a solution"

    ```python
    def tally(votes: list[str]) -> dict[str, int]:
        """Return a dictionary of how many times each choice appears in votes."""
        counts: dict[str, int] = {}
        for vote in votes:
            if vote in counts:
                counts[vote] = counts[vote] + 1
            else:
                counts[vote] = 1
        return counts
    ```

### You Try: The Winner

Complete `winner`, which returns the choice with the most votes. If choices are tied, return the one that comes first in the dictionary. Every count is at least `1`, and the dictionary is not empty.

~~~python { runnable=true editable=true title="You Try: winner" }
def winner(counts: dict[str, int]) -> str:
    """Return the choice with the most votes, or the first one if there is a tie."""
    # TODO: Replace return "" with your implementation.
    return ""


print(winner(counts={"pizza": 3, "tacos": 2, "sushi": 1}))  # Expected: pizza
print(winner(counts={"pizza": 2, "tacos": 4, "sushi": 4}))  # Expected: tacos
print(winner(counts={"sushi": 1}))  # Expected: sushi
~~~

??? note "Show a solution"

    ```python
    def winner(counts: dict[str, int]) -> str:
        """Return the choice with the most votes, or the first one if there is a tie."""
        best: str = ""
        best_count: int = 0
        for choice in counts:
            if counts[choice] > best_count:
                best = choice
                best_count = counts[choice]
        return best
    ```

    Initializing `best_count` with `0` works because every count is at least `1`, so the first choice always replaces it. Comparing with `>` rather than `>=` keeps the _first_ of several tied choices, as in `longest` from the for loops practice.

### You Try: Ringing Up an Order

`cart` maps each item to the quantity ordered. `prices` maps each item the bakery sells to its price. Every item in `cart` is a key in `prices`, but `prices` may have items that are not in `cart`. Complete `order_total`.

~~~python { runnable=true editable=true title="You Try: order_total" }
def order_total(cart: dict[str, int], prices: dict[str, float]) -> float:
    """Return the total cost of the items in cart."""
    # TODO: Replace return 0.0 with your implementation.
    return 0.0


menu: dict[str, float] = {"bagel": 2.5, "muffin": 3.0, "coffee": 2.0}
print(order_total(cart={"bagel": 2, "coffee": 1}, prices=menu))  # Expected: 7.0
print(order_total(cart={"muffin": 4}, prices=menu))  # Expected: 12.0
print(order_total(cart={}, prices=menu))  # Expected: 0.0
~~~

??? note "Show a solution"

    ```python
    def order_total(cart: dict[str, int], prices: dict[str, float]) -> float:
        """Return the total cost of the items in cart."""
        total: float = 0.0
        for item in cart:
            total = total + cart[item] * prices[item]
        return total
    ```

    The same key, `item`, reads from both dictionaries. This is the dictionary version of looping over the indices of two matching lists, but the key keeps the quantity and the price connected by name rather than by position.

    Looping over `prices` instead would raise a `KeyError` for `"muffin"` in the first test, because evaluating `cart["muffin"]` reads a key that is not in `cart`.

### You Try: Running Low

Complete `low_stock`, which returns a new list of the items whose counts are less than `threshold`, in the dictionary's order.

~~~python { runnable=true editable=true title="You Try: low_stock" }
def low_stock(stock: dict[str, int], threshold: int) -> list[str]:
    """Return a new list of the items whose counts are below threshold."""
    # TODO: Replace return [] with your implementation.
    return []


case: dict[str, int] = {"bagel": 3, "muffin": 10, "scone": 0, "croissant": 6}
print(low_stock(stock=case, threshold=5))  # Expected: ['bagel', 'scone']
print(low_stock(stock=case, threshold=0))  # Expected: []
~~~

??? note "Show a solution"

    ```python
    def low_stock(stock: dict[str, int], threshold: int) -> list[str]:
        """Return a new list of the items whose counts are below threshold."""
        result: list[str] = []
        for item in stock:
            if stock[item] < threshold:
                result.append(item)
        return result
    ```

    The result is a list, not a set, because the docstring promises the dictionary's order.

### You Try: A Sale

Complete `apply_discount`, which lowers every price in the dictionary by `percent` percent. It mutates the dictionary it is given and returns `None`.

~~~python { runnable=true editable=true title="You Try: apply_discount" }
def apply_discount(prices: dict[str, float], percent: float) -> None:
    """Lower every price in prices by the given percent."""
    # TODO: Replace return None with your implementation.
    return None


menu: dict[str, float] = {"bagel": 2.5, "muffin": 3.0, "coffee": 2.0}
apply_discount(prices=menu, percent=50.0)
print(menu)  # Expected: {'bagel': 1.25, 'muffin': 1.5, 'coffee': 1.0}
~~~

Once your output matches, paste your completed function into the diagram below and step through it. Watch which dictionary `prices` refers to, and how each value on the heap changes.

~~~python_diagram_runner { editable=true title="Step Through Your apply_discount" }
def apply_discount(prices: dict[str, float], percent: float) -> None:
    """Lower every price in prices by the given percent."""
    # TODO: Paste your implementation.
    return None


menu: dict[str, float] = {"bagel": 2.5, "muffin": 3.0, "coffee": 2.0}
apply_discount(prices=menu, percent=50.0)
print(menu)  # Expected: {'bagel': 1.25, 'muffin': 1.5, 'coffee': 1.0}
~~~

??? note "Show a solution"

    ```python
    def apply_discount(prices: dict[str, float], percent: float) -> None:
        """Lower every price in prices by the given percent."""
        for item in prices:
            prices[item] = prices[item] * (1.0 - percent / 100.0)
    ```

    Compare this with `scale_recipe` from the for loops practice, which needed `range(len(amounts))` to mutate a list's items. Here, the loop variable is a key, and assigning to `prices[item]` mutates the dictionary directly.

## Part 3: Evaluating and Fixing

### Evaluate: Which Versions of `tally` Are Correct?

`tally` should return a dictionary of how many times each choice appears in `votes`. Here are four implementations. For each one, decide whether it behaves correctly for **every** list, not only one test.

**Version A**

~~~python
def tally(votes: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for vote in votes:
        if vote in counts:
            counts[vote] = counts[vote] + 1
        else:
            counts[vote] = 1
    return counts
~~~

**Version B**

~~~python
def tally(votes: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for vote in votes:
        counts[vote] = counts[vote] + 1
    return counts
~~~

**Version C**

~~~python
def tally(votes: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for vote in votes:
        if vote in counts:
            counts[vote] = counts[vote] + 1
        counts[vote] = 1
    return counts
~~~

**Version D**

~~~python
def tally(votes: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    seen: set[str] = set()
    for vote in votes:
        if vote not in seen:
            seen.add(vote)
            counts[vote] = 0
        counts[vote] = counts[vote] + 1
    return counts
~~~

1. Which versions are correct? For each incorrect version, give a list for which it returns the wrong result or raises an error.
2. Of the correct versions, which would you rather read and maintain? Why?

Use this block to test a version: replace the body of `tally` and run it.

~~~python { runnable=true editable=true title="Test a Version of tally" }
def tally(votes: list[str]) -> dict[str, int]:
    """Return a dictionary of how many times each choice appears in votes."""
    counts: dict[str, int] = {}
    for vote in votes:
        if vote in counts:
            counts[vote] = counts[vote] + 1
        else:
            counts[vote] = 1
    return counts


print(tally(votes=["pizza", "tacos", "pizza"]))  # Expected: {'pizza': 2, 'tacos': 1}
print(tally(votes=[]))  # Expected: {}
~~~

??? note "Check your answers"

    1. Versions A and D are correct.
        - Version B raises a `KeyError` for any non-empty list. In the first iteration, `counts` is empty, so evaluating `counts[vote]` reads a key that is not there. (It returns `{}` for an empty list, so a test with only `[]` would not catch the error.)
        - Version C has no `else`. `counts[vote] = 1` is not in the then block, so it is executed in every iteration, and it replaces whatever count the then block just stored. With `["pizza", "tacos", "pizza"]`, it returns `{'pizza': 1, 'tacos': 1}`.
    2. Version A. Version D is correct, but its set duplicates information the dictionary already has: a choice is in `seen` exactly when it is a key in `counts`. A reader has to confirm the two always agree. `vote not in counts` would answer the same question without a second collection.

### Find the Error: A Score Search

This function is supposed to return whether any player has exactly `target` points. Predict what it prints, then fix it.

~~~python { runnable=true editable=true title="Find the Error: has_score" }
def has_score(scores: dict[str, int], target: int) -> bool:
    """Return whether any player has exactly target points."""
    return target in scores


standings: dict[str, int] = {"Ada": 12, "Grace": 20, "Alan": 15}
print(has_score(scores=standings, target=20))  # Expected: True
print(has_score(scores=standings, target=18))  # Expected: False
~~~

??? note "Check your answer"

    The program prints `False` twice, and no error is raised. `in` checks a dictionary's keys, and the keys of `scores` are names, so no `int` is ever found. Loop over the keys and compare each value:

    ```python
    def has_score(scores: dict[str, int], target: int) -> bool:
        """Return whether any player has exactly target points."""
        for name in scores:
            if scores[name] == target:
                return True
        return False
    ```

### Find the Error: Tracking Visits

This program is supposed to track which campus buildings a student has visited. Predict what happens when it runs, then fix it.

~~~python { runnable=true editable=true title="Find the Error: Tracking Visits" }
visited: set[str] = {}
visited.add("Sitterson Hall")
visited.add("Davis Library")
print(len(visited))  # Expected: 2
~~~

??? note "Check your answer"

    Python raises an `AttributeError` on the second line: `'dict' object has no attribute 'add'`. `{}` evaluates to an empty dictionary, not an empty set, and the `set[str]` annotation does not change that. Write `visited: set[str] = set()`.

### Find the Error: Clearing Out a Roster

This function is supposed to remove every student who has no check-ins from an office hours roster. Predict what happens when it runs, then fix it.

~~~python { runnable=true editable=true title="Find the Error: drop_inactive" }
def drop_inactive(check_ins: dict[str, int]) -> int:
    """Remove every student with 0 check-ins, and return how many were removed."""
    removed: int = 0
    for student in check_ins:
        if check_ins[student] == 0:
            check_ins.pop(student)
            removed = removed + 1
    return removed


roster: dict[str, int] = {"Ada": 3, "Grace": 0, "Alan": 0, "Barbara": 1}
print(drop_inactive(check_ins=roster))  # Expected: 2
print(roster)  # Expected: {'Ada': 3, 'Barbara': 1}
~~~

??? note "Check your answer"

    Python raises a `RuntimeError` in the iteration after `"Grace"` is popped: `dictionary changed size during iteration`. A loop over a dictionary cannot remove its keys. Record the keys to remove in a list during the first loop, then pop them in a second loop over that list:

    ```python
    def drop_inactive(check_ins: dict[str, int]) -> int:
        """Remove every student with 0 check-ins, and return how many were removed."""
        to_remove: list[str] = []
        for student in check_ins:
            if check_ins[student] == 0:
                to_remove.append(student)
        for student in to_remove:
            check_ins.pop(student)
        return len(to_remove)
    ```

    The number removed is `len(to_remove)`, so a separate counter is no longer needed.

## Part 4: Putting It Together

### Draw the Memory Diagram

On paper, draw the complete memory diagram for this program as it would look just before it finishes: Globals, any remaining frames, every dictionary and set on the heap, and every arrow. Also write down its printed output. Then step through the diagram and compare it with your drawing.

~~~python_diagram_runner { editable=true title="Draw It: Selling Out" }
def sell(stock: dict[str, int], sold_out: set[str], item: str, quantity: int) -> None:
    """Subtract quantity from item's count; once none are left, move item to sold_out."""
    stock[item] = stock[item] - quantity
    if stock[item] == 0:
        stock.pop(item)
        sold_out.add(item)


case: dict[str, int] = {"bagel": 4, "muffin": 2, "scone": 3}
display: dict[str, int] = case
gone: set[str] = set()
sell(stock=case, sold_out=gone, item="muffin", quantity=2)
sell(stock=case, sold_out=gone, item="bagel", quantity=1)

print(display)
print(len(display))
print(gone)
~~~

??? note "Check your answers"

    - There is one dictionary on the heap, holding `"bagel": 3` and `"scone": 3`. `case` and `display` both have arrows to it, so they are aliases. The program has only one dictionary literal, so it creates only one dictionary.
    - There is one set on the heap, holding `"muffin"`. `gone` has an arrow to it.
    - No `sell` frame remains. Each call's frame, with its `stock`, `sold_out`, `item`, and `quantity`, is gone once the call completes.
    - The output is `{'bagel': 3, 'scone': 3}`, `2`, and `{'muffin'}`. Because `display` refers to the dictionary that `sell` mutated, printing `display` shows that `"muffin"` was popped and `"bagel"` went from `4` to `3`. The second call left `"bagel"` in the dictionary, because its count was `3`, not `0`.