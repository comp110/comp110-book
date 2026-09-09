---
title: Practice with Conditionals and Variables
description: Learn how Python conditionals decide which statements run, how nested conditionals can instead be written with elif, and how variables at different scopes interact with branching code.
---


## Conditional Statements and the Flow of Execution

By default, Python executes statements in the order they are written. A **conditional statement** makes the execution of a block of statements depend on the value of a **Boolean expression**, an expression that evaluates to either `True` or `False`.

Every conditional begins with the keyword `if`, followed by a boolean expression called a **condition**. Before reading about the conditional forms below, it is worth remembering that a condition is just an expression, and its value can be stored in a variable like any other value.

~~~python { runnable=true editable=true title="A Condition is a Boolean Expression" }
lives: int = 2
has_lives_left: bool = lives > 0

print(lives > 0)
print(has_lives_left)
~~~

When Python evaluates `lives > 0`, it reads `2` for `lives` and produces `True`. The variable `has_lives_left` stores that Boolean value, so both `print` calls display `True`.

## The `if` Statement

The simplest conditional is an **`if` statement**, sometimes called an **if-then** statement. When its condition evaluates to `True`, Python runs the indented **then block** of statements beneath it, then continues executing the next line of code after the block. When the condition is `False`, Python skips the then block entirely.

```python
if condition:
    # statements that run only when condition is True
```

Indentation is how Python knows which statements belong to the then block.

Step through the following diagram twice: once as written, and once after changing `score`'s value to `5`. Watch whether the assignment to `message` inside the body runs, and notice that `message` is a global variable being reassigned in Globals.

~~~python_diagram_runner { editable=true title="An if Statement Reassigning a Global Variable" }
score: int = 12
high_score: int = 10
message: str = "Thanks for playing!"

if score >= high_score:
    high_score = score
    message = "New high score: " + str(high_score) + ". " + message

print(message)
~~~

With a `score` of `12`, the condition `score >= high_score` evaluates to `True`, so the then block is executed and `high_score` and `message` are both reassigned. With a `score` of `5`, the condition is `False`, the then block is skipped, and `high_score` and `message` keep their original values. Either way, the program continues to the `print` statement after the `if` statement.

### You Try: Earn a Bonus

The final value of `points` should be `15` when `streak_bonus` is `True`. Add an `if` statement that adds `5` to `points` only when the player has earned the streak bonus, then run the program. Next, change `streak_bonus`' initialization on line 2 to `False` and re-run the program to confirm `points` remains `10` when `streak_bonus` is `False`.

~~~python { runnable=true editable=true title="You Try: Earn a Bonus" }
points: int = 10
streak_bonus: bool = True

# TODO: Add an if statement that reassigns points to points + 5
# only when streak_bonus is True. Hint: the condition can be
# the variable streak_bonus by itself.

print(points)
~~~

## The `if`-`else` Statement

An **`if`-`else` statement**, or **if-then-else** statement, has two blocks. When the condition evaluates to `True`, the then block is executed. Alternatively, when the condition evaluates to `False`, the **`else`** block is executed. Exactly one of the two blocks will be executed.

```python
if condition:
    # statements that run when condition is True
else:
    # statements that run when condition is False
```

The `else` header has no condition of its own. It is equivalent to "otherwise."

Conditionals are often found inside function bodies, where they work with parameters and local variables. Step through this diagram and watch each call create its own frame with its own `result` local variable. Only one of the two assignments to `result` runs during each call.

~~~python_diagram_runner { editable=true title="An if-else Statement in a Function" }
def coin_flip_message(is_heads: bool) -> str:
    """Describe the outcome of a coin flip."""
    result: str = "The coin landed on "

    if is_heads:
        result = result + "heads!"
    else:
        result = result + "tails!"

    return result


print(coin_flip_message(is_heads=True))
print(coin_flip_message(is_heads=False))
~~~

In the first call, `is_heads` is `True`, so Python runs the then block and skips the `else` block. In the second call, the opposite happens. After either block is executed, Python continues to the next line of code in the function body (the `return` statement). When each function call completes, the function body is exited, the computer returns the return value to the return address, and the return value of the function call is printed.

Notice that `result` is initialized _before_ the conditional and reassigned _inside_ it. This is a common pattern: initialize a variable with a starting value, then let the program update it based on some condition.

### You Try: A Roll in the dice game, Pig
 
In the dice game Pig, a player keeps rolling to build up a turn total, but rolling a `1` ends the turn and sets the turn total back to `0`. Complete the `after_roll` function definition so that it returns the new turn total: `0` when `roll` is `1`, and `turn_total + roll` otherwise.
 
The global variable `turn_total` starts at `0`. After each call, its returned value is assigned back to `turn_total` in Globals, so the next call receives the updated total. When the program is complete, the three `print` statements should display `4`, `9`, and `0`.
 
~~~python { runnable=true editable=true title="You Try: A Roll in Pig" }
turn_total: int = 0
 
def after_roll(turn_total: int, roll: int) -> int:
    """Calculate the turn total after one roll in Pig."""
    new_total: int = turn_total
 
    # TODO: Write an if-else statement that reassigns new_total
    # to 0 when roll is 1, and to turn_total + roll otherwise.
 
    return new_total
 
 
turn_total = after_roll(turn_total=turn_total, roll=4)
print(turn_total)
turn_total = after_roll(turn_total=turn_total, roll=5)
print(turn_total)
turn_total = after_roll(turn_total=turn_total, roll=1)
print(turn_total)
~~~
 
Notice that there are two variables named `turn_total`: the global variable and the parameter in each `after_roll` frame. The parameter is initialized from the global variable's value when the call begins, and the global variable is reassigned to the return value when the call ends. The function never reads or writes the global variable directly, which keeps it a black box, and is the same pattern used later on this page in the "Return the New Value Instead" example.
 

## Nested `if`-`else` Statements
 
A then block or an `else` block of a conditional can contain another conditional statement. When a conditional statement appears inside the then block or `else` block of another conditional statement, we call it a **nested conditional**.
 
Nesting is often used when a `False` condition needs to be split into further cases. Consider a number guessing game. If the guess is not correct, we want to know whether it was too low or too high. The second condition only needs to be evaluated if the first condition has evaluated to `False`.
 
~~~python_diagram_runner { editable=true title="A Nested Conditional in an else Block" }
def check_guess(guess: int, secret: int) -> str:
    """Compare a guess to the secret number."""
    feedback: str = ""
 
    if guess == secret:
        feedback = "Correct!"
    else:
        if guess < secret:
            feedback = "Too low."
        else:
            feedback = "Too high."
 
    return feedback
 
 
print(check_guess(guess=4, secret=7))
print(check_guess(guess=9, secret=7))
print(check_guess(guess=7, secret=7))
~~~
 
Follow the first call, where `guess` is `4`. The outer condition `guess == secret` evaluates to `False`, so the outer `else` block is executed. That block contains a second conditional statement, and its condition `guess < secret` evaluates to `True`, so its then block is executed and `feedback` is assigned `"Too low."`. The inner `else` block is skipped, and Python continues to the next line of code after the outer conditional statement (the `return` statement).
 
In the third call, the outer condition evaluates to `True`, so the outer then block is executed and the entire outer `else` block, including the nested conditional statement inside it, is skipped. The inner condition is never evaluated.
 
### Deeper Nesting Becomes Difficult to Parse
 
Each additional case or condition adds another level of nesting and another level of indentation. This function assigns a letter grade with four possible outcomes. Read it carefully, then step through it with a few different scores.
 
~~~python_diagram_runner { editable=true title="Letter Grades with Nested Conditionals" }
def letter_grade(score: float) -> str:
    """Convert a numeric score to a letter grade."""
    grade: str = ""
 
    if score >= 90.0:
        grade = "A"
    else:
        if score >= 80.0:
            grade = "B"
        else:
            if score >= 70.0:
                grade = "C"
            else:
                grade = "F"
 
    return grade
 
 
print(letter_grade(score=95.0))
print(letter_grade(score=85.0))
print(letter_grade(score=42.0))
~~~
 
The logic is correct, but the code drifts to the right with every case. Each `else` block exists only to hold the next conditional statement. Programs with five or six cases become a "staircase" that is difficult to read, indent correctly, and modify.
 
### You Try: Add a D Grade
 
Add a `"D"` grade for scores that are at least `60.0` but below `70.0`. You will need to replace the innermost `grade = "F"` with yet another nested `if`-`else` statement. Pay close attention to your indentation. After your change, the calls should print `C`, `D`, and `F`.
 
~~~python { runnable=true editable=true title="You Try: Add a D Grade" }
def letter_grade(score: float) -> str:
    """Convert a numeric score to a letter grade."""
    grade: str = ""
 
    if score >= 90.0:
        grade = "A"
    else:
        if score >= 80.0:
            grade = "B"
        else:
            if score >= 70.0:
                grade = "C"
            else:
                # TODO: Replace this assignment with a nested if-else
                # that assigns "D" when score >= 60.0 and "F" otherwise.
                grade = "F"
 
    return grade
 
 
print(letter_grade(score=72.0))
print(letter_grade(score=65.0))
print(letter_grade(score=30.0))
~~~
 
Did you find yourself counting spaces or indents? That is exactly the problem the next section solves!
 
## The `if`-`elif`-`else` Statement
 
Python provides the **`elif`** keyword, short for "else if," to express a sequence of one or more alternative conditions without nesting. An `elif` header has its own condition, and that condition is only evaluated when every condition above it has evaluated to `False`. The indented statements beneath an `elif` header form its own then block.
 
```python
if condition_1:
    # statements that run when condition_1 evaluates to True
elif condition_2:
    # statements that run when condition_1 evaluates to False and condition_2 evaluates to True
elif condition_3:
    # statements that run when conditions 1 and 2 evaluate to False and condition_3 evaluates to True
else:
    # statements that run when every condition above evaluates to False
```
 
An `if`-`elif`-`else` statement is a single conditional statement with several blocks. Python evaluates the conditions from top to bottom, executes the block of the **first** condition that evaluates to `True`, and skips all of the remaining conditions and blocks. If no condition evaluates to `True`, the `else` block is executed. The `else` block is optional; without it, it is possible that no block is executed at all.
 
Here is `letter_grade` rewritten with `elif`. It behaves exactly like the nested version, and every case sits at the same level of indentation. Try adding a `"D"` grade for scores that are at least `60.0` but below `70.0` to this function body; you may notice it's easier to implement here than in the previous, nested version of the same function.
 
~~~python_diagram_runner { editable=true title="Letter Grades with if-elif-else" }
def letter_grade(score: float) -> str:
    """Convert a numeric score to a letter grade."""
    grade: str = ""
 
    if score >= 90.0:
        grade = "A"
    elif score >= 80.0:
        grade = "B"
    elif score >= 70.0:
        grade = "C"
    else:
        grade = "F"
 
    return grade
 
 
print(letter_grade(score=95.0))
print(letter_grade(score=85.0))
print(letter_grade(score=42.0))
~~~
 
Step through the second call, where `score` is `85.0`. The first condition `score >= 90.0` evaluates to `False`, so Python moves to the first `elif` header. Its condition `score >= 80.0` evaluates to `True`, so its `elif` block is executed, `grade` is assigned `"B"`, and Python continues to the next line of code after the entire conditional statement (`return grade`). The condition `score >= 70.0` would also have evaluated to `True`, but it is never evaluated because an earlier condition already evaluated to `True`.
 
Compare this to the nested version: `elif score >= 80.0:` is equivalent to `else:` followed by an indented `if score >= 80.0:`. The `elif` keyword lets us write "otherwise, if" on one line at one level of indentation.
 
Notice that `grade` is still a local variable in the `letter_grade` frame, initialized before the conditional statement. Only one of the four assignments to it is executed during each call.
 
### You Try: Convert Nested Conditionals to `elif`
 
This function rates a Wordle game by the number of guesses it took. Rewrite the function body so that it uses a single `if`-`elif`-`elif`-`else` statement with no nesting. The output should not change: `Genius`, `Impressive`, `Solved`, `Better luck next time`.
 
~~~python { runnable=true editable=true title="You Try: Rate a Wordle Game" }
def wordle_rating(guesses: int) -> str:
    """Rate a Wordle game by the number of guesses it took."""
    rating: str = ""
 
    # TODO: Rewrite this nested conditional as one if-elif-elif-else statement.
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
 
 
print(wordle_rating(guesses=1))
print(wordle_rating(guesses=3))
print(wordle_rating(guesses=5))
print(wordle_rating(guesses=7))
~~~
 
### You Try: Order Matters
 
Because Python executes the block of the _first_ condition that evaluates to `True`, the order of the conditions matters. This version of `letter_grade` has a bug: every passing score is reported as `"D"`. Run it to see the problem, then fix it by reordering the conditions without changing any of the comparisons. The calls should print `A`, `B`, `D`, and `F`.
 
~~~python { runnable=true editable=true title="You Try: Fix the Order" }
def letter_grade(score: float) -> str:
    """Convert a numeric score to a letter grade."""
    grade: str = ""
 
    # TODO: Reorder these conditions so the function works correctly.
    if score >= 60.0:
        grade = "D"
    elif score >= 80.0:
        grade = "B"
    elif score >= 90.0:
        grade = "A"
    else:
        grade = "F"
 
    return grade
 
 
print(letter_grade(score=95.0))
print(letter_grade(score=85.0))
print(letter_grade(score=65.0))
print(letter_grade(score=30.0))
~~~
 
### `elif` versus Separate `if` Statements
 
A chain of `elif` headers is one conditional statement, so at most one of its blocks is executed. Several separate `if` statements are several conditional statements, so each condition is evaluated independently and several then blocks may be executed. Both programs below use the same conditions and the same reassignments of `points`, but produce different results.
 
~~~python_diagram_runner { editable=true title="Separate if Statements Each Run" }
points: int = 0
score: int = 95
 
if score >= 90:
    points = points + 3
 
if score >= 80:
    points = points + 2
 
if score >= 70:
    points = points + 1
 
print(points)
~~~
 
All three conditions evaluate to `True` for a `score` of `95`, so all three then blocks are executed and `points` is reassigned three times, ending at `6`.
 
~~~python_diagram_runner { editable=true title="An elif Chain Runs Only One Block" }
points: int = 0
score: int = 95
 
if score >= 90:
    points = points + 3
elif score >= 80:
    points = points + 2
elif score >= 70:
    points = points + 1
 
print(points)
~~~
 
Here the first condition evaluates to `True`, so its then block is executed and the remaining conditions are skipped. `points` is reassigned once, ending at `3`. This conditional statement has no `else` block, so with a `score` of `50` no block would be executed and `points` would remain `0`.
 
When you write a conditional statement, ask yourself: should exactly one of these cases apply, or could several of them apply at once? Use `elif` for the first situation and separate `if` statements for the second.
 
## Variables and Conditionals
 
Conditional statements and variables are constantly used together. The examples above already showed one important pattern: initialize a variable before the conditional statement, then reassign it inside one of the blocks. This section explores what can go wrong and how variables at different scopes interact with conditional statements.
 
### Initialize Before You Branch
 
A variable assigned only inside a then block may never be assigned at all if that block is not executed. Step through this diagram and watch what happens when Python reaches the `return` statement in the second call.
 
~~~python_diagram_runner { editable=true title="A Variable Assigned in Only One Block" }
def describe_sign(n: int) -> str:
    """Describe whether n is positive."""
    if n > 0:
        label: str = "positive"
 
    return label
 
 
print(describe_sign(n=5))
print(describe_sign(n=-3))
~~~
 
The first call works because `n > 0` evaluates to `True` and `label` is assigned. In the second call, the then block is skipped, `label` is never added to the frame, and the `return` statement tries to read a name that does not exist in the frame. Python reports an error: `label` is referenced before it was assigned. This is a specific kind of `NameError` that Python calls an `UnboundLocalError`.
 
The fix is the pattern you have already seen: initialize the variable before the conditional statement so that it exists in the frame regardless of which block is executed.
 
~~~python_diagram_runner { editable=true title="Initialize, Then Branch" }
def describe_sign(n: int) -> str:
    """Describe whether n is positive."""
    label: str = "not positive"
 
    if n > 0:
        label = "positive"
 
    return label
 
 
print(describe_sign(n=5))
print(describe_sign(n=-3))
~~~
 
Now `label` is added to the frame on the first line of every call. The `if` statement reassigns it only when its condition evaluates to `True`, and `return label` always has a value to read.
 
### Conditions Can Read Global Variables
 
Name resolution works inside conditions the same way it works everywhere else. When a condition reads a variable name, Python looks in the current frame first and then in Globals.
 
In this example, `high_score` is a global variable, and `score` and `message` are local to each `play_round` call. Step through the diagram and notice where Python finds each name when it evaluates the condition.
 
~~~python_diagram_runner { editable=true title="A Condition Reading a Global Variable" }
high_score: int = 50
 
def play_round(score: int) -> str:
    """Describe a round of a game."""
    message: str = "Nice round."
 
    if score > high_score:
        message = "New high score!"
 
    return message
 
 
print(play_round(score=30))
print(play_round(score=80))
~~~
 
Reading `high_score` from inside the function works because there is no local variable with that name, so Python resolves it in Globals. The second call prints `"New high score!"` because `80 > 50` evaluates to `True`.
 
### Assigning a Global Variable in a Then Block Does Not Work as Expected
 
Suppose we want the function to _update_ `high_score` when a new record is set. It is tempting to add an assignment inside the then block. Step through this diagram and see what happens.
 
~~~python_diagram_runner { editable=true title="Attempting to Reassign a Global in a Then Block" }
high_score: int = 50
 
def update_high_score(score: int) -> None:
    """Try to record a new high score."""
    if score > high_score:
        high_score = score
 
 
update_high_score(score=80)
print(high_score)
~~~
 
This program produces an error before the condition is even fully evaluated. Recall from the variable fundamentals lesson that an assignment inside a function creates a local variable. Because there is an assignment to `high_score` somewhere in `update_high_score`, Python treats `high_score` as a _local_ variable throughout the entire function body. When the condition tries to read `high_score`, Python looks for the local variable, finds that it has not been assigned yet, and reports an `UnboundLocalError`.
 
The preferred fix is to keep the function a black box: return the new value, and reassign the global variable in Globals.
 
~~~python_diagram_runner { editable=true title="Return the New Value Instead" }
high_score: int = 50
 
def new_high_score(score: int, current: int) -> int:
    """Return the larger of a score and the current high score."""
    result: int = current
 
    if score > current:
        result = score
 
    return result
 
 
high_score = new_high_score(score=80, current=high_score)
print(high_score)
high_score = new_high_score(score=65, current=high_score)
print(high_score)
~~~
 
Every value the function needs comes in through a parameter, and its result goes out through a return value. The reassignment of the global variable `high_score` happens in Globals, where the variable lives. Python's `global` statement would also make the earlier version work, but as discussed in the variable fundamentals lesson, changing global variables from inside functions is generally discouraged.
 
### Static Variables Name the Thresholds
 
The conditions in `letter_grade` contain numbers that should not change: `90.0`, `80.0`, and `70.0` are grade cutoffs, but nothing in the code says so. As you saw in the variable fundamentals lesson, static variables give names to values like these.

~~~python_diagram_runner { editable=true title="Static Variables as Thresholds" }
A_CUTOFF: float = 90.0
B_CUTOFF: float = 80.0
C_CUTOFF: float = 70.0
 
def letter_grade(score: float) -> str:
    """Convert a numeric score to a letter grade."""
    grade: str = ""
 
    if score >= A_CUTOFF:
        grade = "A"
    elif score >= B_CUTOFF:
        grade = "B"
    elif score >= C_CUTOFF:
        grade = "C"
    else:
        grade = "F"
 
    return grade
 
 
print(letter_grade(score=85.0))
~~~
 
Step through the diagram and notice that the three static variables live in Globals, while `score` and `grade` live in the `letter_grade` frame. When each condition is evaluated, Python reads one parameter from the frame and one static variable from Globals.
 
### You Try: Replace the `int` Literals
 
Both `1` and `6` in `wordle_rating` have meaning: one guess is a perfect game, and six guesses is the maximum a player is allowed. Declare two static variables in Globals named `PERFECT_GAME` and `MAX_GUESSES`, then use them in the conditions instead of the numbers. The output should not change.
 
~~~python { runnable=true editable=true title="You Try: Name the Thresholds" }
# TODO: Declare PERFECT_GAME (1) and MAX_GUESSES (6) here.
 
 
def wordle_rating(guesses: int) -> str:
    """Rate a Wordle game by the number of guesses it took."""
    rating: str = ""
 
    # TODO: Use your static variables in place of 1 and 6.
    if guesses == 1:
        rating = "Genius"
    elif guesses <= 3:
        rating = "Impressive"
    elif guesses <= 6:
        rating = "Solved"
    else:
        rating = "Better luck next time"
 
    return rating
 
 
print(wordle_rating(guesses=1))
print(wordle_rating(guesses=6))
print(wordle_rating(guesses=7))
~~~
 
### You Try: Predict the Memory Diagram
 
Before running this program, write down what you expect to be printed and what each frame contains when the `return` statement in the second call is reached. Then step through the diagram to check your prediction.
 
Questions to answer as you go:
 
1. Which frame does `bonus` live in? Which frame does `BONUS_POINTS` live in?
2. In the second call, which block is executed, and which assignment to `bonus` is never executed?
3. Why does the final `print` still display `0` for `bonus`?
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
 
There are two different variables named `bonus`: one in Globals and one in each `final_score` frame. The assignments inside the function body always update the local variable, so the global variable `bonus` remains `0`.
 
## Common Errors
 
### Using `=` Instead of `==` in a Condition
 
A condition must be a Boolean expression, so a comparison of two values needs the equality operator `==`. The assignment operator `=` does not form an expression and is not allowed in an `if` header. Python reports a `SyntaxError` before the program runs.
 
~~~python_diagram_runner { editable=true title="Assignment in a Condition" }
answer: int = 4
 
if answer = 4:
    print("Correct!")
~~~
 
### A Then Block That Is Not Indented
 
Every conditional header must be followed by an indented block. Python reports an `IndentationError` when the statement after the header is not indented.
 
~~~python_diagram_runner { editable=true title="Missing Indentation" }
answer: int = 4
 
if answer == 4:
print("Correct!")
~~~
 
### A Missing Colon
 
Every conditional header, including `elif` and `else` headers, must end with a colon. Leaving it out produces a `SyntaxError`.
 
~~~python_diagram_runner { editable=true title="Missing Colon" }
answer: int = 4
 
if answer == 4
    print("Correct!")
~~~
 
### `elif` After `else`
 
The `else` block is executed for every remaining case, so its header must come last. Placing an `elif` header after an `else` header is a `SyntaxError`.
 
~~~python_diagram_runner { editable=true title="elif Following else" }
score: int = 85
 
if score >= 90:
    print("A")
else:
    print("F")
elif score >= 80:
    print("B")
~~~
 
### An `else` With a Condition
 
An `else` header never has a condition. If you find yourself wanting to write `else score >= 80:`, the keyword you want is `elif`.
 
~~~python_diagram_runner { editable=true title="else With a Condition" }
score: int = 85
 
if score >= 90:
    print("A")
else score >= 80:
    print("B")
~~~
 
## Key Terminology Review
 
- **Conditional statement**: A statement that makes the execution of a block of statements depend on the value of a condition.
- **Boolean expression**: An expression that evaluates to `True` or `False`.
- **Condition**: The Boolean expression in an `if` or `elif` header.
- **Header**: The line of a conditional statement that ends with a colon, such as `if x > 0:`.
- **Block**: The indented statements beneath a header.
- **Then block**: The block beneath an `if` header; executed when the condition evaluates to `True`.
- **`else` block**: The block beneath an `else` header; executed when every condition above it evaluates to `False`.
- **`elif` block**: The block beneath an `elif` header; executed when every condition above it evaluates to `False` and its own condition evaluates to `True`.
- **`if` statement**: A conditional statement whose then block is executed only when its condition evaluates to `True`.
- **`if`-`else` statement**: A conditional statement with a then block and an `else` block; exactly one is executed.
- **Nested conditional**: A conditional statement written inside the block of another conditional statement.
- **`elif`**: Short for "else if"; a header with its own condition that is evaluated only when every condition above it has evaluated to `False`.
- **`if`-`elif`-`else` statement**: A single conditional statement with several conditions; the block of the first condition that evaluates to `True` is executed and the rest are skipped.
- **Initialize-then-branch**: The pattern of initializing a variable before a conditional statement so that it exists regardless of which block is executed.
- **`UnboundLocalError`**: A kind of `NameError` reported when a local variable is read before it has been assigned in its frame.
- **Static variable**: A variable, named in all capital letters, whose value is intended to stay the same; often used to name the thresholds in conditions.
- **`SyntaxError`**: The error Python reports when code is not written in a form Python can read, such as a header missing its colon.
- **`IndentationError`**: The error Python reports when a block is not indented correctly beneath its header.
