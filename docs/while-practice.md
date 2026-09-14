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

### You Try: Print a Seating Grid

Complete `print_grid` so it prints `rows` lines, each containing `columns` copies of `#`. The outer loop is already written. Inside its repeat block, initialize an inner counter and a `line` accumulator, write an inner loop that appends one `#` per column, and then print the completed line. Try `2` rows and `3` columns; the program should print `###` twice.

~~~python { runnable=true editable=true title="You Try: Print a Seating Grid" }
def print_grid(rows: int, columns: int) -> None:
    """Print a grid of # characters with the given dimensions."""
    row: int = 0

    while row < rows:
        # TODO: Initialize an inner counter and an empty line, write an
        # inner while loop that appends "#" once per column, then print line.
        pass
        row = row + 1


rows: int = int(input("How many rows? "))
columns: int = int(input("How many columns? "))
print_grid(rows=rows, columns=columns)
~~~

After it works, predict how many times the inner repeat block is executed for `2` rows and `3` columns, then for `4` rows and `5` columns.


### You Try: Count a DNA Motif
 
A DNA sequence is a string of the letters `A`, `C`, `G`, and `T`. A **motif** is a short pattern that biologists search for within a longer sequence. Complete `count_motif` so it returns how many times `motif` appears in `sequence`, counting overlapping appearances.
 
The outer loop should try every starting index where the motif could fit. For each starting index, the inner loop should compare characters of `motif` against `sequence` for as long as they continue to match. After the inner loop, if every character matched, add `1` to `count`.
 
Try `GATTACAGATCAT` with motif `GAT`; the program should report `2`. Try `AAAA` with motif `AA`; because appearances may overlap, the program should report `3`.
 
~~~python { runnable=true editable=true title="You Try: Count a DNA Motif" }
def count_motif(sequence: str, motif: str) -> int:
    """Count the appearances of motif in sequence, including overlaps."""
    count: int = 0
    start: int = 0
 
    while start + len(motif) <= len(sequence):
        offset: int = 0
 
        # TODO: Write an inner while loop that continues while offset is less
        # than len(motif) and sequence[start + offset] equals motif[offset].
        # Then, if offset reached len(motif), add 1 to count.
 
        start = start + 1
 
    return count
 
 
sequence: str = input("Enter a DNA sequence: ")
motif: str = input("Enter a motif to search for: ")
print("Appearances: " + str(count_motif(sequence=sequence, motif=motif)))
~~~
 
The outer condition `start + len(motif) <= len(sequence)` stops the search before a starting index where the motif would run past the end of the sequence. In the inner condition, the length check comes first: once `offset` reaches `len(motif)`, the `and` expression evaluates to `False` without reading `motif[offset]` at an invalid index. Trace `GATTACAGATCAT` with `GAT` and notice that the inner loop ends after its first comparison at most starting indices, but reaches `offset == 3` at indices `0` and `7`.
 
Use the tracer below to follow the completed search one comparison at a time. The shaded window is the span of `sequence` the outer loop is currently testing, and the motif sits directly beneath it so you can see which characters `sequence[start + offset]` and `motif[offset]` refer to. Enter your own sequence and motif to trace other cases, such as `AAAA` with `AA`.
 
<div id="motif-tracer" style="font-family: system-ui, sans-serif; max-width: 680px; margin: 1rem 0;">
<style>
#motif-tracer .mt-cell{width:36px;height:36px;border:1px solid #c9c7bf;border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,Menlo,monospace;font-size:16px;color:#222;background:#fff;flex:none}
#motif-tracer .mt-win{background:#f1efe8;border-color:#888780}
#motif-tracer .mt-ok{background:#e1f5ee;border-color:#1d9e75;color:#085041}
#motif-tracer .mt-bad{background:#fcebeb;border-color:#e24b4a;color:#791f1f}
#motif-tracer .mt-cur{outline:2px solid #7f77dd;outline-offset:-1px}
#motif-tracer .mt-idx{width:36px;text-align:center;font-size:11px;color:#888;flex:none}
#motif-tracer .mt-var{background:#f1efe8;border-radius:6px;padding:8px 12px}
#motif-tracer .mt-var .mt-l{font-size:12px;color:#5f5e5a}
#motif-tracer .mt-var .mt-v{font-family:ui-monospace,Menlo,monospace;font-size:20px;font-weight:500;color:#222}
#motif-tracer button{font:inherit;padding:6px 12px;border:1px solid #888780;border-radius:6px;background:#fff;cursor:pointer}
#motif-tracer input{font:inherit;padding:6px 8px;border:1px solid #c9c7bf;border-radius:6px}
</style>
<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
  <label style="font-size:14px">sequence</label>
  <input id="mt-seq" value="GATTACAGATCAT" style="width:170px;font-family:ui-monospace,Menlo,monospace">
  <label style="font-size:14px">motif</label>
  <input id="mt-mot" value="GAT" style="width:80px;font-family:ui-monospace,Menlo,monospace">
  <button id="mt-trace">Trace</button>
  <span id="mt-err" style="font-size:13px;color:#a32d2d"></span>
</div>
<div id="mt-idxrow" style="display:flex;gap:4px"></div>
<div id="mt-seqrow" style="display:flex;gap:4px;margin:2px 0 6px"></div>
<div id="mt-motrow" style="display:flex;gap:4px;height:36px;margin-bottom:12px"></div>
<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px">
  <div class="mt-var"><div class="mt-l">start</div><div class="mt-v" id="mt-vstart">0</div></div>
  <div class="mt-var"><div class="mt-l">offset</div><div class="mt-v" id="mt-voff">0</div></div>
  <div class="mt-var"><div class="mt-l">count</div><div class="mt-v" id="mt-vcount">0</div></div>
</div>
<p id="mt-msg" style="font-size:15px;line-height:1.5;margin:0 0 12px;min-height:3em"></p>
<div style="display:flex;gap:8px;align-items:center">
  <button id="mt-prev">Back</button>
  <button id="mt-next">Next</button>
  <button id="mt-reset">Reset</button>
  <span id="mt-pos" style="font-size:13px;color:#5f5e5a;margin-left:auto"></span>
</div>
<script>
(function(){
var steps=[],i=0,S="",M="";
var $=function(id){return document.getElementById(id);};
function build(){
  steps=[];var start=0,count=0,offset=0,n=S.length,m=M.length;
  steps.push({start:start,offset:offset,count:count,cmp:null,msg:"Test the outer condition: start + "+m+" <= "+n+" evaluates to True, so the outer repeat block is executed."});
  while(start+m<=n){
    offset=0;
    steps.push({start:start,offset:offset,count:count,cmp:null,msg:"Reset offset to 0 for this starting index."});
    while(true){
      if(offset>=m){steps.push({start:start,offset:offset,count:count,cmp:null,msg:"offset < "+m+" evaluates to False, so the and expression evaluates to False without reading motif["+offset+"]. The inner loop ends."});break;}
      var a=S[start+offset],b=M[offset];
      if(a===b){
        steps.push({start:start,offset:offset,count:count,cmp:offset,cls:"mt-ok",msg:"sequence["+(start+offset)+"] is "+a+" and motif["+offset+"] is "+b+". Both operands evaluate to True, so the inner repeat block is executed."});
        offset++;
        steps.push({start:start,offset:offset,count:count,cmp:offset-1,cls:"mt-ok",msg:"Add 1 to offset. It is now "+offset+"."});
      } else {
        steps.push({start:start,offset:offset,count:count,cmp:offset,cls:"mt-bad",msg:"sequence["+(start+offset)+"] is "+a+" but motif["+offset+"] is "+b+". The comparison evaluates to False, so the inner loop ends early."});
        break;
      }
    }
    if(offset===m){count++;steps.push({start:start,offset:offset,count:count,cmp:null,msg:"offset == "+m+" evaluates to True: every character matched. Add 1 to count."});}
    else steps.push({start:start,offset:offset,count:count,cmp:null,msg:"offset == "+m+" evaluates to False, so the then block is skipped."});
    start++;
    steps.push({start:start,offset:offset,count:count,cmp:null,msg:"Add 1 to start. It is now "+start+"."});
    if(start+m<=n) steps.push({start:start,offset:offset,count:count,cmp:null,msg:"Test the outer condition: "+start+" + "+m+" <= "+n+" evaluates to True."});
  }
  steps.push({start:start,offset:offset,count:count,cmp:null,done:true,msg:"Test the outer condition: "+start+" + "+m+" <= "+n+" evaluates to False. The motif can no longer fit, so the outer loop ends."});
  steps.push({start:start,offset:offset,count:count,cmp:null,done:true,msg:"Return count, which is "+count+"."});
  i=0;render();
}
function render(){
  var s=steps[i],m=M.length;
  var ir=$("mt-idxrow"),sr=$("mt-seqrow"),mr=$("mt-motrow");
  ir.innerHTML="";sr.innerHTML="";mr.innerHTML="";
  for(var k=0;k<S.length;k++){
    var d=document.createElement("div");d.className="mt-idx";d.textContent=k;ir.appendChild(d);
    var c=document.createElement("div");c.className="mt-cell";c.textContent=S[k];
    var inWin=!s.done&&k>=s.start&&k<s.start+m;
    if(inWin){c.classList.add("mt-win");var o=k-s.start;if(o<s.offset||(s.cmp===o&&s.cls==="mt-ok"))c.classList.add("mt-ok");if(s.cmp===o&&s.cls==="mt-bad")c.classList.add("mt-bad");if(s.cmp===o)c.classList.add("mt-cur");}
    sr.appendChild(c);
  }
  if(!s.done){
    for(var k2=0;k2<s.start;k2++){var g=document.createElement("div");g.style.width="36px";g.style.flex="none";mr.appendChild(g);}
    for(var j=0;j<m;j++){var mc=document.createElement("div");mc.className="mt-cell";mc.textContent=M[j];if(j<s.offset||(s.cmp===j&&s.cls==="mt-ok"))mc.classList.add("mt-ok");if(s.cmp===j&&s.cls==="mt-bad")mc.classList.add("mt-bad");if(s.cmp===j)mc.classList.add("mt-cur");mr.appendChild(mc);}
  }
  $("mt-vstart").textContent=s.start;
  $("mt-voff").textContent=s.offset;
  $("mt-vcount").textContent=s.count;
  $("mt-msg").textContent=s.msg;
  $("mt-pos").textContent="Step "+(i+1)+" of "+steps.length;
}
$("mt-trace").onclick=function(){
  var sv=$("mt-seq").value.trim().toUpperCase(),mv=$("mt-mot").value.trim().toUpperCase(),e=$("mt-err");
  if(!sv||!mv){e.textContent="Enter both a sequence and a motif";return;}
  if(sv.length>16){e.textContent="Keep the sequence to 16 characters";return;}
  e.textContent="";S=sv;M=mv;build();
};
$("mt-next").onclick=function(){if(i<steps.length-1){i++;render();}};
$("mt-prev").onclick=function(){if(i>0){i--;render();}};
$("mt-reset").onclick=function(){i=0;render();};
S="GATTACAGATCAT";M="GAT";build();
})();
</script>
</div>


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

### You Try: Reset the Inner Counter

This procedure should print `rows` lines of two stars each, but only the first line is correct. Find the statement that should be executed once per outer iteration and move it into the outer repeat block. Try `3` rows; the program should print `**` three times.

~~~python { runnable=true editable=true title="You Try: Reset the Inner Counter" }
def print_star_rows(rows: int) -> None:
    """Print the requested number of two-star rows."""
    row: int = 0
    column: int = 0

    # TODO: Move the initialization of column so each row starts a fresh count.
    while row < rows:
        line: str = ""

        while column < 2:
            line = line + "*"
            column = column + 1

        print(line)
        row = row + 1


rows: int = int(input("How many rows of stars? "))
print_star_rows(rows=rows)
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