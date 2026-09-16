---
title: "Practice: While Loops"
description: Practice writing counter-controlled and condition-controlled while loops, combining conditions with Boolean operators, composing loops with conditionals, and repairing common loop errors.
---

This page focuses on choosing and writing while loops. Use [While Loops](control_flow/while_loops.md) and [Composing If and While](control_flow/composition.md) as the primary references. The exercises also use previously introduced [variables](variable_fundamentals.md), [functions](function_fundamentals.md), and [conditional statements](control_flow/if_statements.md).

The runnable exercises pause when they call `input`. When prompted, enter a response and press **Enter**. Run each exercise more than once with inputs that produce different numbers of iterations (including inputs that produce zero iterations!).

## Practice Counter-Controlled Loops

Reminder: a [counter-controlled loop](control_flow/while_loops.md#counter-controlled-loops-repeat-a-known-number-of-times) coordinates three pieces: a counter is initialized before the loop, tested in the while condition, and updated inside the repeat block.


### You Try: Repeat the Message
 
Complete `love_bomb` so it prints `I love you` exactly `times` times. Initialize a counter, test it in the while condition, and update it inside the repeat block. Try `3`; the program should print the message three times. Try `0`; the repeat block should be skipped, and nothing should be printed.
 
~~~python { runnable=true editable=true title="You Try: Repeat the Message" }
def love_bomb(times: int) -> None:
    """Print 'I love you' the requested number of times."""
    # TODO: Write a counter-controlled while loop that prints "I love you" times times.
    return None
 
 
times: int = int(input("How many times should the message be printed? "))
love_bomb(times=times)
~~~

### You Try: Count Down to Launch

Write a while loop that prints the literal value of `seconds`, then `seconds - 1`, and so on, down to `1`. Try `3`; the program should print `3`, `2`, `1`, and then `Launch!`. Try `0`; the repeat block should be skipped entirely, and only `Launch!` should be printed.

~~~python { runnable=true editable=true title="You Try: Count Down to Launch" }
seconds: int = int(input("How many seconds until launch? "))

# TODO: Write a while loop that prints each value from seconds down to 1.

print("Launch!")
~~~

### You Try: Total the Points Earned

In a bonus round, a player earns `1` point in round `1`, `2` points in round `2`, and so on. Complete `points_earned` so it adds every round's points to the accumulator `total`. The counter `current_round` should take the values `1` through `rounds`. Try `4` rounds and `1` round; the program should report `10` and `1` points.

~~~python { runnable=true editable=true title="You Try: Total the Points Earned" }
def points_earned(rounds: int) -> int:
    """Calculate the total points earned across the bonus rounds."""
    current_round: int = 1
    total: int = 0

    # TODO: Write a while loop that adds each round's points to total.

    return total


rounds: int = int(input("How many bonus rounds were played? "))
print("You earned " + str(points_earned(rounds=rounds)) + " points.")
~~~

## Boolean Operators Combine Conditions

A while condition or `if` condition is often a single comparison, such as `index < len(word)`. Python's **Boolean operators** combine or modify Boolean values so that one condition can express more than one requirement.

- `and` evaluates to `True` only when both of its operands evaluate to `True`.
- `or` evaluates to `True` when at least one of its operands evaluates to `True`.
- `not` evaluates to the opposite of its single operand.

~~~python { runnable=true editable=true title="Boolean Operators" }
roll: int = 4
turn_total: int = 12

print(roll != 1 and turn_total < 20)
print(roll == 6 or turn_total >= 20)
print(not roll == 1)
~~~

The first expression evaluates to `True` because both comparisons evaluate to `True`. The second evaluates to `False` because neither comparison evaluates to `True`. The third evaluates to `True` because `roll == 1` evaluates to `False`, and `not` flips it. Try changing `roll` to `1` and predict each line before running the program again.

### You Try: Keep Rolling in Pig

In this version of the dice game Pig, a turn continues until the player rolls a `1` or the turn total reaches `20`. Replace the placeholder condition with a condition that uses `and`. Enter rolls of `5`, `6`, and `1`; the program should report turn totals of `5` and `11` before the turn ends with `11` points. Enter four rolls of `6`; the turn should end with `24` points without asking for a fifth roll.

~~~python { runnable=true editable=true title="You Try: Keep Rolling in Pig" }
turn_total: int = 0
roll: int = int(input("What did you roll? "))

# TODO: Replace False with a condition that evaluates to True while
# roll is not 1 and turn_total is less than 20.
while False:
    turn_total = turn_total + roll
    print("Turn total: " + str(turn_total))
    if turn_total < 20:
        roll = int(input("What did you roll? "))

print("Your turn ends with " + str(turn_total) + " points.")
~~~

### You Try: Count the Lowercase Vowels

Complete the `if` condition so that `count_vowels` counts every lowercase vowel. The condition already checks for `"a"` and `"e"`; extend it with `or` so that it also matches `"i"`, `"o"`, and `"u"`. Try `programming` and `loop`; the program should report `3` and `2` vowels.

~~~python { runnable=true editable=true title="You Try: Count the Vowels" }
def count_vowels(text: str) -> int:
    """Count the lowercase vowels in text."""
    count: int = 0
    index: int = 0

    while index < len(text):
        letter: str = text[index]
        # TODO: Extend this condition so it also matches "i", "o", and "u".
        if letter == "a" or letter == "e":
            count = count + 1
        index = index + 1

    return count


text: str = input("Enter a word: ")
print("Lowercase vowels: " + str(count_vowels(text=text)))
~~~

## Practice Condition-Controlled Loops

Reminder: a [condition-controlled loop](control_flow/while_loops.md#condition-controlled-loops-can-wait-for-a-signal-to-stop) continues until program state or external input changes its condition. The number of iterations is not known before the loop begins.

### You Try: Guess the Secret Number

The loop should continue while the player has not yet guessed the secret number. Replace the placeholder condition with a condition that uses `not` and the variable `guessed_correctly`. Try guessing `3`, `9`, and then `7`; the program should report that the number was found in `3` attempts.

~~~python { runnable=true editable=true title="You Try: Guess the Secret Number" }
secret: int = 7
attempts: int = 0
guessed_correctly: bool = False

# TODO: Replace False with a condition using not and guessed_correctly.
while False:
    guess: int = int(input("Guess the secret number: "))
    attempts = attempts + 1
    guessed_correctly = guess == secret

print("You found it in " + str(attempts) + " attempts.")
~~~

Notice that `guessed_correctly` is reassigned at the end of every iteration. A Boolean variable does not update on its own; the assignment inside the repeat block is what gives the condition a path toward evaluating to `False`.

### You Try: Average the Scores Entered

The program should read scores until the user enters `done`, then report the average. Complete the repeat block so that it adds each score to `total`, adds `1` to `count`, and reads the next response. Enter `90`, `80`, `70`, and `done`; the program should report an average of `80.0`.

~~~python { runnable=true editable=true title="You Try: Average the Scores Entered" }
total: float = 0.0
count: int = 0
response: str = input("Enter a score, or enter done to finish: ")

while response != "done":
    # TODO: Add float(response) to total, add 1 to count,
    # and read the next response.
    pass

if count > 0:
    print("Average score: " + str(total / count))
else:
    print("No scores were entered.")
~~~

## Practice Composing Conditions and Loops

Reminder: the repeat block of a while loop can contain an [`if` statement or another while loop](control_flow/composition.md#composing-conditions-and-loops). When tracing, first ask how control reaches each nested statement, then trace that statement to completion before returning to the enclosing block.

### You Try: Count the Matching Letters

Complete `count_matches` so it counts how many characters of `text` are equal to `target`. The while loop should visit every index of `text`, and an `if` statement inside the repeat block should add `1` to `count` only when the character at that index matches. Try `banana` with target `a`; the program should report `3`.

~~~python { runnable=true editable=true title="You Try: Count the Matching Letters" }
def count_matches(text: str, target: str) -> int:
    """Count the characters in text that are equal to target."""
    count: int = 0
    index: int = 0

    # TODO: Write a while loop with a nested if statement that counts matches.

    return count


text: str = input("Enter a word: ")
target: str = input("Enter one character to count: ")
print("Matches: " + str(count_matches(text=text, target=target)))
~~~

## Practice Finding Loop Errors

Reminder: before running any while loop, identify which statement changes the values used by its condition and check that the change moves toward termination. Also check that the [loop's boundary](control_flow/while_loops.md#off-by-one-bounds) is not one step too early or too late.

### You Try: Fix the Off-by-One Bound

This loop should print each character of `word` on its own line, but it reports an `IndexError` after printing the last character. Change the while condition so the loop visits every valid index exactly once. Try `loop`; the program should print four lines and finish without an error.

~~~python { runnable=true editable=true title="You Try: Fix the Off-by-One Bound" }
word: str = input("Enter a word to print one character per line: ")
index: int = 0

# TODO: Change the condition so index never reaches len(word).
while index <= len(word):
    print(word[index])
    index = index + 1
~~~

### You Try: Make Progress Toward Termination

!!! warning "Do not run this program until you have fixed it"

    As written, this loop is an infinite loop. The while condition tests `current`, but no statement in the repeat block changes `current`, so the condition evaluates to `True` forever. Add the missing update before running.

The program should add every integer from `1` through `5` and report `15`. Add one statement to the repeat block so that `current` moves toward a value that makes the condition evaluate to `False`.

~~~python { runnable=true editable=true title="You Try: Make Progress Toward Termination" }
current: int = 1
total: int = 0

while current <= 5:
    total = total + current
    # TODO: Add a statement that updates current so the loop makes progress.

print("Sum from 1 through 5: " + str(total))
~~~

Once it works, change `5` to `110_000` and observe how quickly the program completes more than one hundred thousand iterations.