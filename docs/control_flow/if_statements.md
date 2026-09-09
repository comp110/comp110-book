---
title: If Statements
description: Learn how Python uses if, else, and elif to choose which blocks of code run.
---

Variables let a program remember what is happening. **Conditional statements** let it respond. A game can unlock an achievement when a player reaches a target score, a streaming app can adjust video quality when a connection slows down, and a weather app can turn a precipitation percentage into a message such as “Rain is unlikely” or “Rain is likely.” Without conditional control flow, a program would take the same actions no matter what data it received.

Python normally executes statements in order from top to bottom. **Control flow** statements can change that path. Each condition becomes a decision point where the program can choose whether a **block** of code should run. We will begin with decisions in Globals, then use parameters and local variables to guide decisions inside functions.

After studying each form, apply it in [Practice: Conditional Statements](../conditional-practice.md). Then use [Practice: Conditionals and Variables](../conditional-variable-practice.md) to work with initialization, scope, parameters, and return values across conditional paths.

## Conditional Control Flow

### Boolean Conditions Decide Whether a Block Runs

An `if` statement begins with the keyword `if`, followed by a **condition** and a colon. Conditions are Boolean expressions that evaluate to either `True` or `False`.[^truth-value-rules]

The indented statements below the header form the **if body**, also known as the **then block**.

- When the condition evaluates to `True`, Python enters the body and runs every statement in it from top to bottom.
- When the condition evaluates to `False`, Python skips the entire body.
- After either path, Python continues with the first statement following the body.

Step through this program twice. First observe how `points` changes when `earned_bonus` is `True`. Then change it to `False`, reset the diagram, and notice that Python skips both statements in the if body.

~~~python_diagram_runner { editable=true title="A One-Way Decision" }
points: int = 8
earned_bonus: bool = True

if earned_bonus:
    points = points + 2
    print("Bonus awarded!")

print(points)
~~~

```mermaid
flowchart LR
    Start["Read current state<br/>earned_bonus = True"] --> Test{"Test the condition<br/>if earned_bonus:"}
    Test -->|True| IfBody["Run the if body<br/>points = points + 2<br/>print(&quot;Bonus awarded!&quot;)"]
    Test -->|False| Continue["Continue after the if statement<br/>print(points)"]
    IfBody --> Continue
```

The decision diamond represents `if earned_bonus:`. The `True` arrow enters the indented block containing both `points = points + 2` and `print("Bonus awarded!")`, while the `False` arrow bypasses both statements. The paths meet at `print(points)`, the first statement after the conditional.

The colon after `if earned_bonus` announces that an indented block follows. Both the assignment and the first `print` are part of that block because they have the same indentation. The final `print` is not indented, so it runs regardless of the condition.

A condition can be a Boolean variable such as `earned_bonus`, or an expression that produces a Boolean value. Comparisons such as `temperature >= 80`, `name == "Ada"`, and `attempts < 3` all evaluate to `True` or `False`.

Practice this idea in [Earn a Streak Bonus](../conditional-practice.md#you-try-earn-a-streak-bonus).

### `else` Provides a Second Branch

Add an `else` **branch** when a program should choose exactly one of two blocks. The indented block after its header is the **else body**, also known as the **else block**. The `else` header has no condition: it runs precisely when the preceding `if` condition is false.

~~~python_diagram_runner { editable=true title="Choosing Between Two Branches" }
temperature_fahrenheit: int = 55
outfit: str = ""

if temperature_fahrenheit >= 65:
    outfit = "short sleeves"
    print("It is warm.")
else:
    outfit = "a jacket"
    print("It is cool.")

print(outfit)
~~~

```mermaid
flowchart LR
    Start["Read current state<br/>temperature_fahrenheit = 55"] --> Test{"Test the condition<br/>if temperature_fahrenheit >= 65:"}
    Test -->|True| IfBody["Run the if body<br/>outfit = &quot;short sleeves&quot;<br/>print(&quot;It is warm.&quot;)"]
    Test -->|False| ElseBody["Run the else block<br/>outfit = &quot;a jacket&quot;<br/>print(&quot;It is cool.&quot;)"]
    IfBody --> Continue["Continue after if / else<br/>print(outfit)"]
    ElseBody --> Continue
```

The expression in `if temperature_fahrenheit >= 65:` controls both branches. Each branch box includes both indented statements: it assigns an outfit and prints the matching description. Both paths meet at `print(outfit)`.

Python evaluates `temperature_fahrenheit >= 65` only once during this encounter with the conditional statement. If the result is `True`, Python runs the if body and skips the else body. If it is `False`, Python skips the if body and runs the else body. It never runs both branches during the same encounter.

After the selected branch finishes, the two possible paths meet at `print(outfit)`. Try temperatures on both sides of the boundary, including exactly `65` degrees Fahrenheit.

Practice this idea in [Take a Turn in Pig](../conditional-practice.md#you-try-take-a-turn-in-pig).

### Conditional Statements Can Be Nested

A control flow statement can appear anywhere a regular statement can appear, including inside another block. This is **nested control flow**.

The outer condition in the following function separates A grades from all other grades. Python reaches the inner condition only when the outer condition is false and it enters the outer else body.

~~~python { runnable=true editable=true title="Nested Conditional Statements" }
def grade_label(score: int) -> str:
    """Return a label for one of three score ranges."""
    result: str = ""

    if score >= 90:
        result = "A"
    else:
        if score >= 80:
            result = "B"
        else:
            result = "below B"

    return result


print(grade_label(score=95))
print(grade_label(score=85))
print(grade_label(score=75))
~~~

```mermaid
flowchart LR
    subgraph Tests["Test nested conditions"]
        direction TB
        Outer{"Outer condition<br/>if score >= 90:"}
        Inner{"Nested condition<br/>if score >= 80:"}
        Outer -->|False| Inner
    end
    subgraph Assignments["Run one assignment block"]
        direction TB
        A["Outer if body<br/>result = &quot;A&quot;"]
        B["Inner if body<br/>result = &quot;B&quot;"]
        Below["Inner else block<br/>result = &quot;below B&quot;"]
    end
    Outer -->|True| A
    Inner -->|True| B
    Inner -->|False| Below
    A --> Continue["Finish the function<br/>return result"]
    B --> Continue
    Below --> Continue
```

The second diamond represents the `if score >= 80:` statement nested inside the outer `else:` block. Its position in the flow matches its additional level of indentation in the syntax. Each action box shows the `result` assignment made by that path before all three paths meet at `return result`.

For `95`, the first condition is true, so the entire outer else body, including its inner `if` statement, is skipped. For `85` and `75`, the outer condition is false, so Python enters the else body and evaluates the inner condition.

Indentation reveals the structure. The inner `if` is indented because it belongs to the outer else body. Its two assignment statements are indented again because they belong to its branches.

Practice this idea in [Escape the Puzzle Room](../conditional-practice.md#you-try-escape-the-puzzle-room).

### `elif` Expresses a Multiway Choice More Clearly

A chain of nested else and if statements can become difficult to scan. Python's **`elif`** keyword is short for “else if” and expresses the same kind of multiway decision with less indentation. It does not add a new branching capability; it gives an equivalent decision chain a clearer shape.

Python checks an `if`/`elif` chain from top to bottom:

1. Evaluate the `if` condition.
2. If it is false, evaluate the first `elif` condition.
3. Continue until a condition is true.
4. Run that branch and skip every remaining branch.
5. Run the optional final `else` only if all preceding conditions are false.

Here is the preceding `grade_label` function rewritten as an `elif` chain. It makes the same decision and produces the same results as the nested version.

~~~python { runnable=true editable=true title="The Same Choice with an elif Chain" }
def grade_label(score: int) -> str:
    """Return a label for one of three score ranges."""
    result: str = ""

    if score >= 90:
        result = "A"
    elif score >= 80:
        result = "B"
    else:
        result = "below B"

    return result


print(grade_label(score=95))
print(grade_label(score=85))
print(grade_label(score=75))
~~~

```mermaid
flowchart LR
    subgraph Tests["Check conditions from top to bottom"]
        direction TB
        IfTest{"First condition<br/>if score >= 90:"}
        ElifTest{"Next condition<br/>elif score >= 80:"}
        IfTest -->|False| ElifTest
    end
    subgraph Labels["Assign the first matching label"]
        direction TB
        A["If body<br/>result = &quot;A&quot;"]
        B["Elif body<br/>result = &quot;B&quot;"]
        Below["Else block<br/>result = &quot;below B&quot;"]
    end
    IfTest -->|True| A
    ElifTest -->|True| B
    ElifTest -->|False| Below
    A --> Continue["Finish the function<br/>return result"]
    B --> Continue
    Below --> Continue
```

Each diamond corresponds to one condition. Python follows the first `True` arrow it reaches, assigns the matching label, and skips the remaining branches. The final `else` assigns the label used when both conditions are false.

The `elif` version makes the single chain of choices visible. Because Python stops after the first true condition, order matters whenever conditions overlap.

For example, a test for `score >= 80` must come after a test for `score >= 90`. Reversing them would cause a score of `95` to take the `score >= 80` branch before Python ever reached the more specific condition.

Practice these ideas in [Flatten a Nested Rating](../conditional-practice.md#you-try-flatten-a-nested-rating) and [Put the Thresholds in Order](../conditional-practice.md#you-try-put-the-thresholds-in-order).

### Separate `if` Statements and an `elif` Chain Answer Different Questions

An `if`/`elif` chain represents one multiway choice. Python runs at most one branch in the chain because it skips the remaining conditions after finding the first true one. Several separate `if` statements represent several independent choices. Python evaluates every `if` condition, so any number of their bodies may run.

Suppose a walking app announces every distance milestone a person has reached. The milestones are independent: walking `12` kilometers reaches the `1`, `5`, and `10` kilometer milestones. Separate `if` statements allow all three messages to appear.

~~~python_diagram_runner { editable=true title="Separate if Statements Report Every Milestone" }
distance_km: int = 12

if distance_km >= 1:
    print("Milestone reached: 1 km")

if distance_km >= 5:
    print("Milestone reached: 5 km")

if distance_km >= 10:
    print("Milestone reached: 10 km")
~~~

A different part of the app might need only the person's highest milestone. Those labels are alternatives, so an `elif` chain is appropriate.

~~~python_diagram_runner { editable=true title="An elif Chain Selects the Highest Milestone" }
distance_km: int = 12
highest_milestone: str = "Less than 1 km"

if distance_km >= 10:
    highest_milestone = "10 km"
elif distance_km >= 5:
    highest_milestone = "5 km"
elif distance_km >= 1:
    highest_milestone = "1 km"

print("Highest milestone: " + highest_milestone)
~~~

The first program reports every true condition. The second stops at the first true condition and reports one label. Choose the structure based on the question the program is asking:

- Use an `if`/`elif` chain when the cases are alternatives and at most one should apply.
- Use separate `if` statements when each condition is independent and several bodies may need to run.

Practice choosing the correct structure in [Unlock Every Achievement](../conditional-practice.md#you-try-unlock-every-achievement).

## Common If Statement Errors

### Misreading Indentation

Indentation determines which block owns a statement. These two procedures differ only in the indentation of `print("Checked.")`.

~~~python { runnable=true editable=true title="Indentation Changes Control Flow" }
def report_only_positive(value: int) -> None:
    if value > 0:
        print("Positive.")
        print("Checked.")


def always_report_check(value: int) -> None:
    if value > 0:
        print("Positive.")
    print("Checked.")


report_only_positive(value=-1)
always_report_check(value=-1)
~~~

The first call prints nothing because both statements belong to its if body. The second call prints `Checked.` because that statement is outside the if body and runs after the conditional for either Boolean result.

### Reading a Variable That a Branch Did Not Initialize

A function must initialize a local variable before any path tries to read it. An assignment inside an `if` body may not run, so it cannot initialize a variable for every possible path.

~~~python_diagram_runner { editable=true title="A Branch May Skip Initialization" }
def describe_sign(n: int) -> str:
    """Describe whether n is positive."""
    if n > 0:
        label: str = "positive"

    return label


print(describe_sign(n=5))
print(describe_sign(n=-3))
~~~

The first call initializes `label` and returns normally. In the second call, the condition is false, the assignment is skipped, and `return label` tries to read a local variable that has no value. Python reports an **`UnboundLocalError`**, a specific kind of `NameError` for a local variable that is read before it is assigned.

The **initialize-then-branch** pattern prevents this error. Initialize the variable to a meaningful default before the conditional, then reassign it in any branch that needs a different value.

~~~python_diagram_runner { editable=true title="Initialize Before Branching" }
def describe_sign(n: int) -> str:
    """Describe whether n is positive."""
    label: str = "not positive"

    if n > 0:
        label = "positive"

    return label


print(describe_sign(n=5))
print(describe_sign(n=-3))
~~~

Now every call initializes `label` before Python decides whether to reassign it. An `if`/`else` that assigns `label` in both branches would also ensure that every path gives it a value.

An assignment to a name anywhere in a function makes that name local to the function by default. A global variable with the same name does not provide a fallback value for an uninitialized local variable.

Practice this pattern in [Initialize Before Launch](../conditional-variable-practice.md#you-try-initialize-before-launch), then continue with the other [Variables Across Branches](../conditional-variable-practice.md#practice-variables-across-branches) exercises.

### Using `=` Instead of `==` in a Condition

The assignment operator `=` stores a value; the equality operator `==` compares two values. An `if` condition that uses `=` where it needs `==` is invalid syntax, so Python reports a `SyntaxError` before running the program.

~~~python_diagram_runner { editable=true title="Assignment Is Not an Equality Test" }
answer: int = 4

if answer = 4:
    print("Correct!")
~~~

### Omitting the Indented Block

Every conditional header must be followed by an indented block. Python reports an `IndentationError` when the statement after a header is not indented.

~~~python_diagram_runner { editable=true title="A Conditional Body Must Be Indented" }
answer: int = 4

if answer == 4:
print("Correct!")
~~~

### Omitting the Colon

Every `if`, `elif`, and `else` header must end with a colon. Leaving it out produces a `SyntaxError`.

~~~python_diagram_runner { editable=true title="A Conditional Header Needs a Colon" }
answer: int = 4

if answer == 4
    print("Correct!")
~~~

### Placing `elif` After `else`

An `else` handles every case not matched above it, so it must be the final branch. Placing an `elif` after `else` produces a `SyntaxError`.

~~~python_diagram_runner { editable=true title="else Must Be the Final Branch" }
score: int = 85

if score >= 90:
    print("A")
else:
    print("F")
elif score >= 80:
    print("B")
~~~

### Giving `else` a Condition

An `else` header never has a condition. Use `elif` when a remaining branch needs its own condition.

~~~python_diagram_runner { editable=true title="Use elif for Another Condition" }
score: int = 85

if score >= 90:
    print("A")
else score >= 80:
    print("B")
~~~

[^truth-value-rules]: Python can also test non-Boolean values using truth-value testing, also known as truthiness. These rules are more complex: for example, zero and empty values are falsy, while many other values are truthy. Some truth-value tests are concise and idiomatic in Python, but using implicit truthiness in ways that hide a value's type or intent is poor practice. Prefer conditions designed to produce an actual `bool`; explicit Boolean expressions are easier to read, type-check, and reason about.
