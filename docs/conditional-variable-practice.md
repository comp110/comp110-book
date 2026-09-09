---
title: Practice with Conditionals and Variables
description: Practice applying Python conditionals with variables and functions through interactive programs.
---

This page is for practice. Keep these reference pages nearby and follow their links whenever you need more than the brief reminders below:

- [If Statements](control_flow/if_statements.md) reviews conditional syntax, branching behavior, nested conditionals, `elif` chains, and common errors.
- [Variable Fundamentals](variable_fundamentals.md) reviews initialization, reassignment, static variables, and local and global scope.
- [Function Fundamentals](function_fundamentals.md) reviews parameters, return values, and conditional logic inside functions.

The runnable exercises pause when they call `input`. Enter a response below the output pane and press **Enter**. Run each exercise more than once with inputs that take different paths. Memory diagrams use fixed values because they do not support `input`.

## Practice One-Way Decisions

Reminder: an [`if` statement](control_flow/if_statements.md#boolean-conditions-decide-whether-a-block-runs) runs its body only when its condition is true.

### You Try: Earn a Streak Bonus

A player earns five bonus points after at least three consecutive wins. Add an `if` statement that updates `points` only when `earned_bonus` is `True`. Try streaks of `2` and `3`; the program should report `10` and `15` points.

~~~python { runnable=true editable=true title="You Try: Earn a Streak Bonus" }
streak: int = int(input("How many games have you won in a row? "))
points: int = 10
earned_bonus: bool = streak >= 3

# TODO: When earned_bonus is True, add 5 to points.

print("You earned " + str(points) + " points.")
~~~

## Practice Two-Way Decisions

Reminder: an [`if`/`else` statement](control_flow/if_statements.md#else-provides-a-second-branch) chooses exactly one of two branches. When you put that decision in a function, review [function calls and return values](function_fundamentals.md#function-definitions-and-calls) as needed.

### You Try: Take a Turn in Pig

In the dice game Pig, rolling `1` loses the points collected during the turn. Complete `after_roll` so it returns `0` when `roll` is `1` and `turn_total + roll` otherwise. Try a total of `9` with rolls of `5` and `1`; the program should report new totals of `14` and `0`.

~~~python { runnable=true editable=true title="You Try: Take a Turn in Pig" }
def after_roll(turn_total: int, roll: int) -> int:
    """Calculate the turn total after one roll in Pig."""
    new_total: int = turn_total

    # TODO: Use if/else to assign the correct value to new_total.

    return new_total


turn_total: int = int(input("What is your current turn total? "))
roll: int = int(input("What did you roll? "))
turn_total = after_roll(turn_total=turn_total, roll=roll)
print("Your new turn total is " + str(turn_total) + ".")
~~~

## Practice Nested Decisions

Reminder: a [nested conditional](control_flow/if_statements.md#conditional-statements-can-be-nested) is useful when Python should ask a second question only after taking a particular outer path.

### You Try: Escape the Puzzle Room

The keypad opens the exit when its code is `110`. If the code is wrong, a player with a key can use the backup lock; otherwise, the exit stays shut. Add a nested `if`/`else` inside the outer `else` to assign the two missing messages.

~~~python { runnable=true editable=true title="You Try: Escape the Puzzle Room" }
def exit_message(code: int, has_key: bool) -> str:
    """Describe whether the player can leave the puzzle room."""
    message: str = ""

    if code == 110:
        message = "The keypad flashes green. You escaped!"
    else:
        # TODO: If has_key is True, assign "The backup key opens the exit."
        # Otherwise, assign "The exit is still locked."
        pass

    return message


code: int = int(input("Enter the three-digit door code: "))
key_response: str = input("Do you have the backup key? (yes/no) ")
has_key: bool = key_response == "yes"
print(exit_message(code=code, has_key=has_key))
~~~

## Practice Multiway Decisions

Reminder: an [`elif` chain](control_flow/if_statements.md#elif-expresses-a-multiway-choice-more-clearly) checks conditions from top to bottom and runs the first matching branch. Order overlapping conditions from the most specific or restrictive to the least.

### You Try: Flatten a Nested Rating

Rewrite the function body as one `if`/`elif`/`elif`/`else` statement with no nesting. Try `1`, `3`, `5`, and `7` guesses to reach every result.

~~~python { runnable=true editable=true title="You Try: Rate a Word Puzzle" }
def puzzle_rating(guesses: int) -> str:
    """Rate a word puzzle by the number of guesses used."""
    rating: str = ""

    # TODO: Rewrite this as one if/elif/elif/else statement.
    if guesses == 1:
        rating = "Genius"
    else:
        if guesses <= 3:
            rating = "Impressive"
        else:
            if guesses <= 6:
                rating = "Solved"
            else:
                rating = "Better luck next time"

    return rating


guesses: int = int(input("How many guesses did you use? "))
print(puzzle_rating(guesses=guesses))
~~~

### You Try: Put the Thresholds in Order

This chain has a bug: every passing score receives a `D`. Reorder its conditions without changing the comparisons. Try scores of `95`, `85`, `65`, and `30`; they should produce `A`, `B`, `D`, and `F`.

~~~python { runnable=true editable=true title="You Try: Fix the Grade Order" }
def letter_grade(score: float) -> str:
    """Convert a numeric score to a letter grade."""
    grade: str = ""

    # TODO: Reorder these branches from the highest threshold to the lowest.
    if score >= 60.0:
        grade = "D"
    elif score >= 80.0:
        grade = "B"
    elif score >= 90.0:
        grade = "A"
    else:
        grade = "F"

    return grade


score: float = float(input("Enter a numeric score: "))
print("Letter grade: " + letter_grade(score=score))
~~~

## Practice Independent Decisions

Reminder: [separate `if` statements and an `elif` chain](control_flow/if_statements.md#separate-if-statements-and-an-elif-chain-answer-different-questions) behave differently. Separate statements may run several bodies; a chain runs at most one branch.

### You Try: Unlock Every Achievement

A player should see every achievement whose threshold they reached. The current `elif` chain displays only the highest one. Change the structure so a player with `12` wins sees all three messages, while a player with `6` sees the first two.

~~~python { runnable=true editable=true title="You Try: Unlock Every Achievement" }
wins: int = int(input("How many games have you won? "))

# TODO: Change the structure so every earned achievement is displayed.
if wins >= 10:
    print("Achievement unlocked: Tenacious Ten")
elif wins >= 5:
    print("Achievement unlocked: High Five")
elif wins >= 1:
    print("Achievement unlocked: First Win")
~~~

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
