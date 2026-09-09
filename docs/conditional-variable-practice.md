---
title: "Practice: Conditionals and Variables"
description: Practice combining conditional control flow with initialization, scope, parameters, return values, and static variables.
---

This page focuses on how conditional paths interact with variables and functions. Complete [Practice: Conditional Statements](conditional-practice.md) first if you want more practice choosing among `if`, `else`, nested conditionals, and `elif` chains.

The runnable exercises pause when they call `input`. Enter a response below the output pane and press **Enter**. Run each exercise more than once with inputs that take different paths. The memory diagram uses fixed values because memory diagrams do not support `input`.

## Practice Variables Across Branches

Use these references as needed:

- [Reading a variable that a branch did not initialize](control_flow/if_statements.md#reading-a-variable-that-a-branch-did-not-initialize)
- [Parameters and local variables](variable_fundamentals.md#parameters-and-local-variables)
- [Reading local and global variables](variable_fundamentals.md#reading-local-and-global-variables)
- [Assignments inside functions are local](variable_fundamentals.md#assignments-inside-functions-are-local)
- [Static variables](variable_fundamentals.md#static-variables-name-values-that-stay-the-same)
- [The difference between `print` and `return`](function_fundamentals.md#print-vs-return)

### You Try: Initialize Before Launch

For less than `100` units of fuel, this function tries to return `message` before it has a value. Replace the declaration with an initialization that uses the default message `"Add more fuel."`; keep the conditional reassignment for a full tank. Try `80` and `100` units.

~~~python { runnable=true editable=true title="You Try: Initialize Before Launch" }
def launch_message(fuel: int) -> str:
    """Report whether the rocket has enough fuel."""
    # TODO: Initialize message to "Add more fuel." here.
    message: str

    if fuel >= 100:
        message = "Fuel check complete. Ready for launch!"

    return message


fuel: int = int(input("How many units of fuel are loaded? "))
print(launch_message(fuel=fuel))
~~~

### You Try: Return a New High Score

Keep `new_high_score` a black box: it receives every value through parameters and returns its result. Add a one-way `if` statement that reassigns `result` when `score` exceeds `current`. The global `high_score` is updated only after the call returns.

~~~python { runnable=true editable=true title="You Try: Record a High Score" }
def new_high_score(score: int, current: int) -> int:
    """Return the larger of score and the current high score."""
    result: int = current

    # TODO: Reassign result when score is greater than current.

    return result


high_score: int = int(input("What is the current high score? "))
round_score: int = int(input("What score did you earn this round? "))
high_score = new_high_score(score=round_score, current=high_score)
print("High score: " + str(high_score))
~~~

### You Try: Name the Ticket Thresholds

The numbers `12` and `65` describe meaningful age boundaries. Declare `CHILD_MAX_AGE` and `SENIOR_MIN_AGE` in Globals, then use those static variables in the conditions instead of number literals. Try ages `10`, `30`, and `70`.

~~~python { runnable=true editable=true title="You Try: Name the Ticket Thresholds" }
# TODO: Declare CHILD_MAX_AGE as 12 and SENIOR_MIN_AGE as 65.


def ticket_price(age: int) -> int:
    """Return a ticket price based on age."""
    price: int = 20

    # TODO: Replace the threshold literals with the static variables.
    if age <= 12:
        price = 12
    elif age >= 65:
        price = 14

    return price


age: int = int(input("How old is the moviegoer? "))
print("Ticket price: $" + str(ticket_price(age=age)))
~~~

### You Try: Predict the Memory Diagram

Before running this fixed-input example, write down what each call returns and what each frame contains when the second call reaches `return`. Then use the diagram to check:

1. Which frame contains each variable named `bonus`?
2. Which assignment to the local `bonus` runs during each call?
3. Why does the final `print` still display `0`?

~~~python_diagram_runner { editable=true title="You Try: Predict the Frames" }
BONUS_POINTS: int = 5
bonus: int = 0


def final_score(base: int, streak: int) -> int:
    """Add a bonus to the base score for long streaks."""
    bonus: int = 0

    if streak >= 3:
        bonus = BONUS_POINTS
    elif streak == 2:
        bonus = 1

    return base + bonus


print(final_score(base=10, streak=4))
print(final_score(base=10, streak=2))
print(bonus)
~~~

If an edit produces a syntax or indentation failure, use the [Common If Statement Errors](control_flow/if_statements.md#common-if-statement-errors) reference to diagnose it.
