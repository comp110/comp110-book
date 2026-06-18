---
title: Interactive C Terminal
description: A browser-compiled C example that reads stdin interactively through a terminal.
---

# Interactive C terminal

Use `c_terminal_runner` when the program needs stdin during execution rather than a fixed input box. The terminal runner compiles C to WebAssembly, starts the program in a worker, and connects terminal input to WASI stdin.

The page must be served with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` or `require-corp` so the browser enables `SharedArrayBuffer`.

```c_terminal_runner
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char name[64];
    int count = 0;

    printf("Name: ");
    fflush(stdout);
    if (scanf("%63s", name) != 1) {
        fprintf(stderr, "Missing name\n");
        return 1;
    }

    printf("Count: ");
    fflush(stdout);
    if (scanf("%d", &count) != 1) {
        fprintf(stderr, "Missing count\n");
        return 1;
    }

    for (int index = 0; index < count; index++) {
        printf("%s #%d\n", name, index + 1);
    }

    fprintf(stderr, "processed %d item(s)\n", count);
    return EXIT_SUCCESS;
}
```

## Compiler feedback

Compiler errors still appear in the output pane and as editor diagnostics.

```c_terminal_runner
#include <stdio.h>

int main(void) {
    printf("Edit this terminal example, then run it.\n");
    return 0;
}
```
