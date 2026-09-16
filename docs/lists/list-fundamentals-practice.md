---
title: List Fundamentals
description: Learn how Python lists are initialized, read, changed, and shared between variables in memory.
---

## Lists Hold Many Values Under One Name

The types you have used so far, `int`, `float`, `str`, and `bool`, each hold a single value. A **list** is a value that holds a sequence of other values, called its **elements**, in a specific order. A list lets one variable refer to many values at once, such as every score in a game or every word in a sentence.

The type annotation for a list names the type of its elements inside square brackets. A `list[int]` holds integers, a `list[str]` holds strings, and so on.

## Initializing a List

### An Empty List

A list can be initialized with no elements. The **list literal** `[]` and the call `list()` both produce an empty list. Programs usually start with an empty list when elements will be added later.

~~~python { runnable=true editable=true title="Empty Lists" }
guesses: list[str] = []
scores: list[int] = list()

print(guesses)
print(scores)
print(len(guesses))
~~~

The `len` function returns the number of elements in a list. Both of these lists have a length of `0`.

### A List Populated with Values

A list literal can also include elements, separated by commas, between its square brackets. Each element should match the type in the annotation.

~~~python { runnable=true editable=true title="List Literals with Elements" }
rolls: list[int] = [4, 6, 1, 6]
names: list[str] = ["Ada", "Grace", "Alan"]
flags: list[bool] = [True, False, True]

print(rolls)
print(len(rolls))
print(names)
~~~

### You Try: Initialize Two Lists

Initialize `prices` as a `list[float]` with three values of your choosing and `empty` as an empty `list[str]`. The program should print `3` and then `0`.

~~~python { runnable=true editable=true title="You Try: Initialize Lists" }
# TODO: Initialize prices with three float elements.

# TODO: Initialize empty as an empty list of strings.

print(len(prices))
print(len(empty))
~~~

## Reading an Element with Subscription Notation

Every element in a list has an **index**, a position that counts up from `0`. The first element is at index `0`, the second at index `1`, and the last at index `len(items) - 1`.

**Subscription notation** reads a single element: write the list's name followed by an index in square brackets. The expression `rolls[0]` evaluates to the first element of `rolls`.

~~~python { runnable=true editable=true title="Reading Elements" }
rolls: list[int] = [4, 6, 1, 6]

print(rolls[0])
print(rolls[3])
print(rolls[0] + rolls[1])
~~~

A subscription expression produces a value of the element type, so `rolls[0] + rolls[1]` adds two `int` values and evaluates to `10`.

Reading an index that does not exist produces an **`IndexError`**. Try changing `rolls[3]` to `rolls[4]` and running the program again.

## Changing an Element

Subscription notation can also appear on the left-hand side of an assignment. This stores a new value at that index, replacing the element that was there.

~~~python_diagram_runner { editable=true title="Changing an Element" }
rolls: list[int] = [4, 6, 1, 6]
print(rolls)

rolls[2] = 5
print(rolls)
~~~

Step through the diagram and watch the element at index `2` change from `1` to `5`. The list still has four elements; one of them now refers to a different value.

### Lists are Mutable

A value that can be changed after it is created is **mutable**. Lists are mutable: their elements can be replaced, and elements can be added or removed, all without creating a new list.

This is different from the `int`, `float`, `str`, and `bool` values you have used so far, which are **immutable**. An operation such as `"Hi" + "!"` does not change the string `"Hi"`; it evaluates to a new string. Similarly, the reassignment `i = i + 1` does not change the value `1` in memory; it stores a new value in the variable `i`. With a list, the statement `rolls[2] = 5` changes the existing list itself.

## Appending an Element

The **`append`** method adds a new element to the end of a list. It is written with a period after the list's name, followed by the method name and the value to add in parentheses. After `append` is called, the list's length is one greater.

~~~python_diagram_runner { editable=true title="Appending Elements" }
guesses: list[str] = []
print(len(guesses))

guesses.append("e")
guesses.append("t")
print(guesses)
print(len(guesses))
~~~

Because lists are mutable, `append` changes the list that `guesses` refers to. The variable `guesses` is never reassigned, yet the list it refers to grows from zero elements to two.

### You Try: Append Three Words

Starting from an empty list, append three words of your choosing, then print the list and its last element using subscription notation.

~~~python { runnable=true editable=true title="You Try: Append Words" }
words: list[str] = []

# TODO: Append three words.

# TODO: Print the list, then print its last element.
~~~

## Removing an Element with `pop`

The **`pop`** method removes an element from a list and returns it. Called with no argument, `pop()` removes the last element. Called with an index, `pop(0)` removes the element at that index, and the elements after it shift down to fill the gap.

~~~python_diagram_runner { editable=true title="Popping Elements" }
rolls: list[int] = [4, 6, 1, 6]

last: int = rolls.pop()
print(last)
print(rolls)

first: int = rolls.pop(0)
print(first)
print(rolls)
~~~

Since `pop` returns the removed element, its result can be stored in a variable or used in an expression. Calling `pop` on an empty list produces an `IndexError` because there is nothing to remove.

### You Try: A Stack of Plates

Cafeteria plates are stacked, and the last plate placed is the first one taken. Complete the program so that it appends `"plate 3"` to the stack, then pops the top plate and stores it in `taken`. The program should print `plate 3` and then `['plate 1', 'plate 2']`.

~~~python { runnable=true editable=true title="You Try: Plate Stack" }
stack: list[str] = ["plate 1", "plate 2"]

# TODO: Append "plate 3".

# TODO: Pop the last element and store it in taken.
taken: str = ""

print(taken)
print(stack)
~~~

## Lists are Reference Types

When an `int` is assigned from one variable to another, the second variable receives its own copy of the value. Changing one variable afterward has no effect on the other.

~~~python_diagram_runner { editable=true title="Copying an int" }
a: int = 5
b: int = a

b = b + 1
print(a)
print(b)
~~~

A list is stored differently. A variable does not hold the list's elements directly. Instead, the list lives in a separate area of memory called the **heap**, and the variable holds a **reference** to it, an arrow pointing to where the list lives. Lists are **reference types**.

When a list is assigned from one variable to another, only the reference is copied. Both variables now point to the same list in memory. Mutating the list through either variable changes the one list that both refer to.

~~~python_diagram_runner { editable=true title="Two Variables, One List" }
original: list[int] = [1, 2, 3]
alias: list[int] = original

alias.append(4)
alias[0] = 100

print(original)
print(alias)
~~~

Step through the diagram. After `alias: list[int] = original`, there are two variables but still only one list. The `append` and the assignment to `alias[0]` both change that list, so printing `original` shows `[100, 2, 3, 4]` even though `original` was never used to make a change.

The same thing happens when a list is passed as an argument. The parameter receives a reference to the caller's list, so mutating the list inside the function changes the caller's list too.

~~~python_diagram_runner { editable=true title="Mutating a List Parameter" }
def add_bonus(scores: list[int]) -> None:
    """Add a bonus score to the end of the list."""
    scores.append(10)


game_scores: list[int] = [7, 3]
add_bonus(scores=game_scores)
print(game_scores)
~~~

Notice that `add_bonus` returns `None`, yet `game_scores` has three elements after the call. The function did not return a new list; it changed the list that `game_scores` refers to.

### Reassignment is Different from Mutation

Reassigning a variable makes it refer to a different list; it does not change the list it used to refer to. Compare this program with the previous one.

~~~python_diagram_runner { editable=true title="Reassigning a List Variable" }
original: list[int] = [1, 2, 3]
alias: list[int] = original

alias = [1, 2, 3, 4]

print(original)
print(alias)
~~~

Here `alias = [1, 2, 3, 4]` evaluates a new list literal and stores a reference to that new list in `alias`. Two lists now exist in memory, and `original` still refers to the first one, so it prints `[1, 2, 3]`.

### You Try: Predict the Output

Before running this program, write down what each `print` will display. Then run it to check your prediction.

~~~python { runnable=true editable=true title="You Try: Predict the Output" }
first: list[str] = ["a", "b"]
second: list[str] = first
third: list[str] = ["a", "b"]

second.append("c")
third.append("z")

print(first)
print(second)
print(third)
~~~

## Key Terminology Review

- **List**: A mutable value that holds an ordered sequence of elements.
- **Element**: One of the values held in a list.
- **List literal**: Square brackets containing zero or more comma-separated elements, such as `[]` or `[1, 2, 3]`.
- **Index**: The position of an element in a list, counting up from `0`.
- **Subscription notation**: Square brackets after a list's name, such as `rolls[2]`, used to read or assign the element at an index.
- **`len`**: The function that returns the number of elements in a list.
- **`append`**: The method that adds an element to the end of a list.
- **`pop`**: The method that removes an element from a list and returns it; the last element by default, or the element at a given index.
- **Mutable**: Able to be changed after it is created. Lists are mutable.
- **Immutable**: Not able to be changed after it is created. `int`, `float`, `str`, and `bool` values are immutable.
- **Reference**: The location in memory where a list lives, stored in a variable rather than the list's elements themselves.
- **Reference type**: A type whose values are stored on the heap and referred to by variables through references. Lists are reference types.
- **Heap**: The area of memory where lists and other reference-type values are stored.
- **`IndexError`**: The error Python reports when a subscription or `pop` uses an index that does not exist.