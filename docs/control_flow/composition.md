---
title: Composing If and While
description: Learn how Python combines conditional statements and while loops through nested control flow.
---

Conditional statements and while loops become more expressive when their blocks contain other control flow statements. Their indentation reveals which statement owns each nested block.

This page composes `if` and `while`, develops nested loops, reviews common control flow errors, and concludes the terminology review for all three control flow pages.

## Composing Conditions and Loops

### Conditional Statements and Loops Can Contain One Another

The body of an `if`, `else`, or `while` statement is a block of statements. Any of these blocks can contain another control flow statement.

An `if` inside a `while` can choose what happens during each iteration. Step through this function: the while loop visits every integer from `0` through `limit`, and the nested conditional adds only the even values to `total`.

~~~python_diagram_runner { editable=true title="A Conditional Inside a Loop" }
def sum_even_up_to(limit: int) -> int:
    """Sum the even integers from zero through limit."""
    current: int = 0
    total: int = 0

    while current <= limit:
        if current % 2 == 0:
            total = total + current
        current = current + 1

    return total


print(sum_even_up_to(limit=6))
~~~

The inner `if` does not change the loop's repetition rule. Whether the branch runs or is skipped, Python continues with `current = current + 1` and then returns to the while condition.

A while loop can also be placed inside a conditional branch. In this example, the countdown exists only on the `ready` path.

~~~python { runnable=true editable=true title="A Loop Inside a Conditional Branch" }
def launch_if_ready(ready: bool, seconds: int) -> None:
    """Count down and launch only when ready is true."""
    if ready:
        while seconds > 0:
            print(seconds)
            seconds = seconds - 1
        print("Launch!")
    else:
        print("Not ready.")


launch_if_ready(ready=True, seconds=3)
launch_if_ready(ready=False, seconds=3)
~~~

For each nested statement, first ask how control reaches it. Then trace that statement to completion before returning to the next step of the enclosing block.

### Nested Loops Complete the Inner Loop for Each Outer Iteration

A **nested loop** places one while loop inside another. When Python reaches the inner loop, that loop completes all its iterations before execution continues with the statements that follow it in the outer body.

Step through this example and watch where each counter is initialized and updated. Also watch `row_text` accumulate one row of a multiplication table.

~~~python_diagram_runner { editable=true title="Fixed-Size Nested Loops" }
row: int = 1

while row < 4:
    row_text: str = ""
    column: int = 1

    while column < 4:
        row_text = row_text + " " + str(row * column)
        column = column + 1

    print(row_text)
    row = row + 1
~~~

The outer loop runs three times, with `row` equal to `1`, `2`, and `3`. At the start of each outer iteration, `row_text` is reset to an empty string and `column` is reset to `1`. The inner loop then runs three times, appending each product to `row_text`. Once the inner loop finishes, the completed row is printed. The inner body therefore runs `3 * 3`, or `9`, times.

Notice the order of events:

1. Test the outer condition.
2. Reset the row text and inner counter.
3. Complete the inner loop while accumulating products.
4. Print the completed row.
5. Update the outer counter.
6. Return to the outer condition.

If the outer loop always runs `10` times and the inner loop always runs `6` times per outer iteration, the inner body runs `10 * 6`, or `60`, times. This product rule applies when the inner count is fixed and independent of the outer counter.

### An Outer Loop Can Control an Inner Loop's Work

An inner loop does not have to perform the same number of iterations each time. Its condition can depend on the current outer counter.

This procedure builds a growing character pyramid. On row `1`, the inner loop appends one star. On row `2`, it appends two stars, and so on.

~~~python { runnable=true editable=true title="A Nested-Loop Pyramid" }
def print_pyramid(height: int) -> None:
    """Print a pyramid with the requested number of rows."""
    row: int = 1

    while row <= height:
        column: int = 0
        line: str = ""

        while column < row:
            line = line + "*"
            column = column + 1

        print(line)
        row = row + 1


print_pyramid(height=5)
~~~

The inner loop's limit is `row`, so its work grows as the outer loop advances. With a height of `5`, the inner body runs `1 + 2 + 3 + 4 + 5`, or `15`, times. Because the inner count changes, there is no single fixed inner count to multiply by the number of outer iterations.

## Common Composition Errors

### Confusing `if` with `while`

Use `if` to make a one-time decision and `while` to repeat. Both statements test a condition before entering their bodies, but only a while loop returns to its condition after reaching the body's end.

When tracing code, imagine a back arrow from the end of a while body to its header. No such arrow exists for an if body.

### Forgetting to Reset an Inner Counter

An inner counter usually belongs to one outer iteration and must be reset inside the outer body. In this incorrect version, `column` is initialized only once. After the first row, its value is already `2`, so later outer iterations immediately skip the inner body.

~~~python { runnable=true editable=true title="An Inner Counter that Is Not Reset" }
row: int = 0
column: int = 0

while row < 3:
    print("Starting row " + str(row))

    while column < 2:
        print("*")
        column = column + 1

    row = row + 1
~~~

Move `column: int = 0` into the outer body, immediately before the inner `while`, to give each row a fresh inner counter.

## Key Terminology Review

- **Control flow**: The order in which Python executes statements.
- **Conditional statement**: A statement that chooses a path based on a condition.
- **Condition**: A Boolean expression that controls whether a branch or loop body runs.
- **Branch**: One possible path through a conditional statement.
- **Block**: One or more statements grouped together by indentation.
- **If body / then block**: The block selected when an `if` condition is true.
- **Else body / else block**: The block selected when the preceding `if` and `elif` conditions are false.
- **Nested control flow**: A conditional statement or loop placed inside another control flow block.
- **`elif`**: A clause that tests another condition after preceding conditions in the same chain are false.
- **Loop**: A control flow statement that can repeat a block of code.
- **While condition**: The Boolean expression tested before every potential while loop iteration.
- **Loop body / repeat block**: The block repeated while a loop's condition remains true.
- **Iteration**: One complete execution of a loop body.
- **Counter**: A variable updated to track progress through a loop.
- **Counter-controlled loop**: A loop whose repetitions are bounded by a counter.
- **Condition-controlled loop**: A loop that continues until program state or external input changes its condition.
- **Accumulator**: A variable that stores a result built across multiple iterations.
- **Infinite loop**: A loop whose condition never becomes false.
- **Event loop**: A loop that waits for events and responds to them as they arrive.
- **Nested loop**: A loop contained in another loop's body.
- **Off-by-one error**: A boundary mistake that causes one too many or one too few iterations.
