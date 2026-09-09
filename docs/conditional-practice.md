---
title: "Practice: Conditional Statements"
description: Practice choosing and writing one-way, two-way, nested, multiway, and independent conditional statements.
---

This page focuses on choosing and writing conditional control-flow structures. Use [If Statements](control_flow/if_statements.md) as the primary reference. The exercises also use previously introduced [variables](variable_fundamentals.md) and [functions](function_fundamentals.md), but their unfinished work focuses on conditionals.

Each runnable exercise has two steps. First, edit the source code where you see a `TODO`. Then select **Run** to test your changes. Whenever the program reaches an `input(...)` call, it pauses and shows a prompt in the output pane. The text inside `input(...)` identifies the value to enter. Type your response in the input field and press **Enter**. If the program asks another question, answer that prompt next. A conditional can cause the program to skip an `input(...)` call.

To test another case, select **Run** again and enter the next test value or set of values. The test values in the instructions below are responses to the program's prompts; do not replace the `input(...)` calls with them.

## Practice One-Way Decisions

Reminder: an [`if` statement](control_flow/if_statements.md#boolean-conditions-decide-whether-a-block-runs) runs its body only when its condition is true.

### You Try: Earn a Streak Bonus

A game awards `10` points for each win, plus `5` extra points when that win brings the player's streak to at least `3`. This program calculates the points for one just-completed win. Add an `if` statement at the `TODO` that adds the bonus to `points` when `earned_bonus` is `True`.

After editing the code, run it twice. At the **How many games have you won in a row?** prompt, enter `2` on the first run and `3` on the second. The program should report `10` points for `2` and `15` points for `3`.

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

In the dice game Pig, rolling `1` loses the points collected during the current turn; any other roll adds to that turn's total. This function handles one roll of a six-sided die, so enter a roll from `1` to `6`. At the `TODO`, use `if`/`else` to assign `0` to `new_total` when `roll` is `1`, or `turn_total + roll` otherwise. The existing `return` sends the new total back to the game.

After editing the code, run it twice. On the first run, enter `9` at the **What is your current turn total?** prompt, then enter `5` at the **What did you roll?** prompt; the new total should be `14`. On the second run, enter `9` and then `1`; the new total should be `0`.

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

Reminder: a [nested conditional](control_flow/if_statements.md#conditional-statements-can-be-nested) is useful when Python should make a second decision only after taking a particular outer path.

### You Try: Escape the Puzzle Room

An escape-room game tries the keypad first. If the player enters `110`, the exit opens immediately. Only a wrong code leads to the backup-key question. Nesting lets that outer path contain both the question and the decision about its answer.

At the `TODO`, add an `if`/`else` inside the existing outer `else`. Assign `"The backup key opens the exit."` to `message` when `has_key` is `True`, or `"The exit is still locked."` otherwise.

After editing the code, run it once for each row below. First answer **Enter the three-digit door code:**. Answer **Do you have the backup key? (yes/no)** only if it appears, using lowercase `yes` or `no`.

| Door code | Backup-key response | Expected result |
| --- | --- | --- |
| `110` | No second prompt | `The keypad flashes green. You escaped!` |
| `111` | `yes` | `The backup key opens the exit.` |
| `111` | `no` | `The exit is still locked.` |

~~~python { runnable=true editable=true title="You Try: Escape the Puzzle Room" }
code: str = input("Enter the three-digit door code: ")
message: str = ""

if code == "110":
    message = "The keypad flashes green. You escaped!"
else:
    key_response: str = input("Do you have the backup key? (yes/no) ")
    has_key: bool = key_response == "yes"

    # TODO: Use a nested if/else to assign the backup-key or locked message.

print(message)
~~~

## Practice Multiway Decisions

Reminder: an [`elif` chain](control_flow/if_statements.md#elif-expresses-a-multiway-choice-more-clearly) checks conditions from top to bottom and runs the first matching branch. Order overlapping conditions from the most specific or restrictive to the least.

### You Try: Flatten a Nested Rating

A word-puzzle game lets players keep guessing until they solve it. Each completed puzzle earns exactly one rating based on the number of guesses used: **Genius** for `1`, **Impressive** for `2`–`3`, **Solved** for `4`–`6`, and **Persistent** for `7` or more.

The nested code already produces those ratings, but the decision is hard to scan. Replace its nested conditional with one unnested `if`/`elif`/`elif`/`else` statement, preserving the results.

After editing the code, run it four times. At the **How many guesses did you use?** prompt, enter `1`, `3`, `6`, and `7`, one value per run. The results should be **Genius**, **Impressive**, **Solved**, and **Persistent**, respectively. Use positive whole numbers because the puzzle has been solved.

~~~python { runnable=true editable=true title="You Try: Flatten a Nested Rating" }
def puzzle_rating(guesses: int) -> str:
    """Rate a solved word puzzle by the number of guesses used."""
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
                rating = "Persistent"

    return rating


guesses: int = int(input("How many guesses did you use? "))
print(puzzle_rating(guesses=guesses))
~~~

### You Try: Put the Thresholds in Order

An arcade awards only the highest medal earned in a round: **Gold** for at least `90` points, **Silver** for at least `60`, or **Bronze** for at least `30`. Below `30`, the player receives no medal. The current chain has a bug: every score of `30` or more gets Bronze, even when it qualifies for a better medal.

Reorder the complete condition-and-assignment branches from the highest threshold to the lowest. Keep each comparison paired with its medal, and keep the final `else` last.

After editing the code, run it once for each row below. Enter the score at **How many points did you score?**. These cases test each threshold and the score immediately below it.

| Score | Expected output |
| --- | --- |
| `29` | `Medal: No medal yet` |
| `30` | `Medal: Bronze` |
| `59` | `Medal: Bronze` |
| `60` | `Medal: Silver` |
| `89` | `Medal: Silver` |
| `90` | `Medal: Gold` |

~~~python { runnable=true editable=true title="You Try: Put the Thresholds in Order" }
def round_medal(score: int) -> str:
    """Return the highest medal earned in an arcade round."""
    medal: str = ""

    # TODO: Reorder these branches from the highest threshold to the lowest.
    if score >= 30:
        medal = "Bronze"
    elif score >= 60:
        medal = "Silver"
    elif score >= 90:
        medal = "Gold"
    else:
        medal = "No medal yet"

    return medal


score: int = int(input("How many points did you score? "))
print("Medal: " + round_medal(score=score))
~~~

## Practice Independent Decisions

Reminder: [separate `if` statements and an `elif` chain](control_flow/if_statements.md#separate-if-statements-and-an-elif-chain-answer-different-questions) behave differently. Separate statements may run several bodies; a chain runs at most one branch.

### You Try: Unlock Every Achievement

A player's profile lists all achievements unlocked so far: **First Win** at `1` win, **High Five** at `5`, and **Tenacious Ten** at `10`. A player can earn several of these, so the current `elif` chain hides achievements they should see. Change both `elif` branches to separate `if` statements so every earned achievement is printed. Keep the comparisons and messages as they are.

After editing the code, run it once for each row below. Enter the number of wins at **How many games have you won?**. Check which achievement names appear in the output.

| Wins | Expected achievements |
| --- | --- |
| `0` | No achievement messages |
| `1` | First Win |
| `6` | High Five and First Win |
| `12` | Tenacious Ten, High Five, and First Win |

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
