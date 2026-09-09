---
title: "Practice: Conditional Statements"
description: Practice choosing and writing one-way, two-way, nested, multiway, and independent conditional statements.
---

This page focuses on choosing and writing conditional control-flow structures. Use [If Statements](control_flow/if_statements.md) as the primary reference. The exercises also use previously introduced [variables](variable_fundamentals.md) and [functions](function_fundamentals.md), but their unfinished work focuses on conditionals.

The runnable exercises pause when they call `input`. Enter a response below the output pane and press **Enter**. Run each exercise more than once with inputs that take different paths.

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

Next, practice how conditional paths interact with initialization, scope, and return values in [Practice: Conditionals and Variables](conditional-variable-practice.md).
