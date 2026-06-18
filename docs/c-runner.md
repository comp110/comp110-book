---
title: Runnable C Demo
description: A browser-compiled C example with stdin, stdout, stderr, and compiler diagnostics.
---

# Runnable C in the browser

C examples use `stdio.h` and the standard C library through a browser-based WASI toolchain. The program is compiled with Clang, linked to WebAssembly, and then run inside the page.

```c_runner
#include <stdio.h>

int main(void) {
    for (int value = 1; value <= 4; value++) {
        printf("%d squared is %d\n", value, value * value);
    }

    return 0;
}
```

## Reading standard input

Use the stdin box when a program calls `scanf`, `fgets`, or another input function. Standard error is captured alongside standard output so diagnostics from the program are visible too.

```c_runner
#include <stdio.h>
#include <stdlib.h>

int main(void) {
    char name[64];
    int count = 0;

    if (scanf("%63s %d", name, &count) != 2) {
        fprintf(stderr, "Expected input like: Maya 3\n");
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

Compiler errors are reported in the output pane and underlined in the editor.

```c_runner
#include <stdio.h>

int main(void) {
    printf("Try editing this example.\n");
    return 0;
}
```
