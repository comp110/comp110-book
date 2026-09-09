---
title: "Practice: Conditionals and Variables"
description: Practice combining conditional control flow with initialization, scope, parameters, return values, and static variables.
---

This page focuses on how conditional paths interact with variables and functions. Complete [Practice: Conditional Statements](conditional-practice.md) first if you want more practice choosing among `if`, `else`, nested conditionals, and `elif` chains.

For the first three exercises, edit the source code at the `TODO` comments, then select **Run** to test your changes. When the program reaches an `input(...)` call, it pauses and displays a prompt in the output pane. The text in quotation marks inside `input(...)` tells you which value to enter. Type the test value in the input field and press **Enter**. If there are two prompts, answer each one in order.

Select **Run** again for each test case. Enter test values as responses to the prompts, keeping the `input(...)` calls in the code. The final exercise is a prediction task: its inputs are already written in the function calls, and you will use the memory diagram to check your answers.

## Practice Variables Across Branches

Use these references as needed:

- [Reading a variable that a branch did not initialize](control_flow/if_statements.md#reading-a-variable-that-a-branch-did-not-initialize)
- [Parameters and local variables](variable_fundamentals.md#parameters-and-local-variables)
- [Reading local and global variables](variable_fundamentals.md#reading-local-and-global-variables)
- [Assignments inside functions are local](variable_fundamentals.md#assignments-inside-functions-are-local)
- [Static variables](variable_fundamentals.md#static-variables-name-values-that-stay-the-same)
- [The difference between `print` and `return`](function_fundamentals.md#print-vs-return)

### You Try: Initialize Before Launch

A rocket-building game needs a status message whether or not the rocket has enough fuel. Its launch check currently fails below `100` units because it tries to return `message` before that variable has a value.

At the `TODO`, change `message: str` so it also assigns the default message `"Add more fuel."`. Keep the existing `if` statement, which replaces that default when there are at least `100` units of fuel. Every path should reach `return` with a message ready to display.

After editing the code, run it twice. At the **How many units of fuel are loaded?** prompt, enter `80` on the first run; the output should be `Add more fuel.`. Enter `100` on the second run; the output should be `Fuel check complete. Ready for launch!`.

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

An arcade needs to update its saved high score after a round. The function calculates which score to keep; the calling code must store its return value.

At the first `TODO`, add a one-way `if` statement that assigns `score` to `result` when `score` is greater than `current`. For a lower or equal score, keep the initial value of `current`. Use the function's parameters for this decision and keep `return result` at the end.

At the second `TODO`, change the function-call line so it assigns the returned value to `high_score`. This models saving the updated score for the rest of this run. Each new test run asks you to supply the starting high score again.

After editing the code, run it once for each row below. First enter the current high score at **What is the current high score?**, then enter the round score at **What score did you earn this round?**. These responses become the function's `current` and `score` arguments, respectively.

| Test case | First input: current high score | Second input: round score | Expected output |
| --- | --- | --- | --- |
| Higher score | `50` | `75` | `High score: 75` |
| Lower score | `50` | `40` | `High score: 50` |
| Equal score | `50` | `50` | `High score: 50` |

~~~python { runnable=true editable=true title="You Try: Return a New High Score" }
def new_high_score(score: int, current: int) -> int:
    """Return the larger of score and the current high score."""
    result: int = current

    # TODO: Reassign result when score is greater than current.

    return result


high_score: int = int(input("What is the current high score? "))
round_score: int = int(input("What score did you earn this round? "))

# TODO: Store the value returned by this call in high_score.
new_high_score(score=round_score, current=high_score)
print("High score: " + str(high_score))
~~~

### You Try: Name the Ticket Thresholds

A neighborhood cinema charges `$20` normally, `$12` for children aged `12` or younger, and `$14` for seniors aged `65` or older. Naming the age limits makes the policy easier to read and change.

At the first `TODO`, above `def ticket_price` and with no indentation, declare two static variables (named constants) with type `int`: `CHILD_MAX_AGE` with value `12` and `SENIOR_MIN_AGE` with value `65`. This places them in Globals.

At the second `TODO`, replace the age numbers in the `if` and `elif` conditions with those names, keeping the `<=` and `>=` comparisons. The `12` in `price = 12` is a ticket price, so leave that assignment and the other prices as they are.

After editing the code, run it once for each row below. Enter the age at **How old is the moviegoer?**. Check that the discounts include the exact age limits.

| Age | Expected output |
| --- | --- |
| `12` | `Ticket price: $12` |
| `13` | `Ticket price: $20` |
| `64` | `Ticket price: $20` |
| `65` | `Ticket price: $14` |

Now try a policy change: edit only the initial value of `CHILD_MAX_AGE` from `12` to `13`, then run again and enter age `13`. The ticket should now cost `$12` without any changes inside `ticket_price`. Set the constant back to `12` when finished.

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

A game's score-preview screen calculates possible round totals without changing the saved scoreboard value. Each preview starts with the base points and adds `5` bonus points for a streak of at least `3`. The global `score` holds the saved value; each call to `final_score` also has its own local variable named `score`.

Use the code as written for this prediction task. There are no `TODO` edits or input prompts. The first call supplies `base=10` and `streak=4`; the second supplies `base=10` and `streak=1`. These argument values are the inputs to the two previews.

Before using the diagram, write down:

1. What each `final_score` call returns and what the three `print` statements display, in order.
2. The values of `BONUS_POINTS` and `score` in Globals, and of `base`, `streak`, and the local `score` in each call's frame, just after the second call executes `return score`.
3. Why the second preview starts with its own base points, and why printing either preview does not update the saved global `score`.

Then select **Step Into** repeatedly to check your predictions. Each step shows the state after executing the highlighted code. Pause after each call's `return score` step to compare the frames. The diagram keeps completed calls' frames visible. Continue to the end to check the three output lines against your predictions.

~~~python_diagram_runner { editable=true title="You Try: Predict the Memory Diagram" }
BONUS_POINTS: int = 5
score: int = 0


def final_score(base: int, streak: int) -> int:
    """Preview a round's score without changing the saved score."""
    score: int = base

    if streak >= 3:
        score = score + BONUS_POINTS

    return score


print(final_score(base=10, streak=4))
print(final_score(base=10, streak=1))
print(score)
~~~

If an edit produces a syntax or indentation failure, use the [Common If Statement Errors](control_flow/if_statements.md#common-if-statement-errors) reference to diagnose it.
