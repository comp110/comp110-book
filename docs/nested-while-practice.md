---
title: "Practice: Nested While Loops"
description: Practice writing counter-controlled and condition-controlled nested while loops, and repairing common loop errors.
---

This page focuses on choosing and writing _nested_ while loops (a while loop that is inside another while loop's repeat block). Use [While Loops](control_flow/while_loops.md) and [Composing If and While](control_flow/composition.md) as the primary references, and [Practice: while Loops](while-practice.md) for practice with non-nested while loops before practicing nested loops.

The runnable exercises pause when they call `input`. When prompted, enter a response and press **Enter**. Run each exercise more than once with inputs that produce different numbers of iterations (including inputs that produce zero iterations!).

## Practice Composing Nested While Loops

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
 
A DNA sequence is a string of the letters `A`, `C`, `G`, and `T`. A **motif** is a short pattern that biologists search for within a longer sequence. Complete `count_motif` so it returns the number of times `motif` appears in `sequence`, including overlapping appearances.
 
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


If you are not sure where to start, open the hints one at a time and try again after each.
 
??? tip "Hint 1: What does each variable keep track of?"
 
    `start` is the index in `sequence` where the current attempt begins, and it is already handled by the outer loop. `offset` is how many characters of `motif` have matched so far during this attempt. The character of `sequence` being compared is at index `start + offset`, and the character of `motif` being compared is at index `offset`.
 
??? tip "Hint 2: Trace one attempt by hand"
 
    Take `sequence = "GATTACAGATCAT"`, `motif = "GAT"`, and `start = 0`. Compare `sequence[0]` with `motif[0]`, then `sequence[1]` with `motif[1]`, then `sequence[2]` with `motif[2]`. All three match, so `offset` should end at `3`. Now try `start = 3`: `sequence[3]` is `T` and `motif[0]` is `G`, so the very first comparison fails and `offset` should stay at `0`.
 
??? tip "Hint 3: Write the inner while condition"
 
    The inner loop should continue while two things are both true: there is still a character of `motif` left to compare, and the current pair of characters is equal. Combine those two comparisons with `and`. Put the length check first so that `motif[offset]` is never read once `offset` reaches `len(motif)`.
 
??? tip "Hint 4: Write the inner repeat block and the check afterward"
 
    The only statement the inner repeat block needs is `offset = offset + 1`. After the inner loop, `offset` equals `len(motif)` exactly when every character matched. Use an `if` statement with that comparison to decide whether to add `1` to `count`.
 
 
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

