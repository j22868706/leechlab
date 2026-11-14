---
title: 'File Operations and Cross Compilation — Assignment 2 Learning Record'
description: 'Learning C file I/O, syslog, GNU Make, ARM64 cross compilation, and GitHub Actions through AELD Assignment 2.'
pubDate: 'Nov 13 2026'
tags: ['linux']
heroImage: '../../assets/blog-bash.jpeg'
---

**Topics:** C Programming, Linux File Operations, Syslog, GNU Make, ARM64 Cross Compilation, Git, GitHub Actions

[Assignment 2 Repository](https://github.com/j22868706/aeld-assignment-2)

## 1. The Complete Learning Path for This Assignment

Assignment 2 builds on the Bash utilities from Assignment 1. This time, I replaced the shell-based writer with a C program and learned how to build the same source code for different CPU architectures.

1. Prepare the Assignment 2 Repository

   Reuse the Assignment 1 Git history, update the remote, merge the course's Assignment 2 starter branch, and initialize the updated test submodule.
2. Configure GitHub SSH Authentication

   Understand the difference between verifying GitHub's host key and authenticating with my own SSH key.
3. Install an ARM Cross Compiler

   Set up the Arm GNU Toolchain and record its version, configuration, and sysroot.
4. Implement File Operations in C

   Write `writer.c` with argument validation, standard C file I/O, syslog messages, and failure exit codes.
5. Create a Makefile

   Support native compilation, ARM64 cross compilation, and cleanup through one build configuration.
6. Integrate and Test the C Writer

   Update `finder-test.sh`, verify the generated binary architecture, and run the complete assignment tests.
7. Review the Self-hosted Runner Configuration

   Identify the runner's repository registration and understand how a systemd service keeps it running after SSH disconnects.

## 2. Set Up the Linux and GitHub Development Environment

Working environment:

```text
Google Cloud Ubuntu VM (x86-64)
└── Linux user: username
    ├── ~/aeld-assignment-1/
    │   ├── assignment-autotest/
    │   ├── assignments/assignment2/
    │   │   ├── cross-compile.txt
    │   │   └── fileresult.txt
    │   ├── finder-app/
    │   │   ├── finder.sh
    │   │   ├── writer.sh
    │   │   ├── writer.c
    │   │   ├── Makefile
    │   │   └── finder-test.sh
    │   └── full-test.sh
    ├── ~/arm-cross-compiler/
    └── ~/actions-runner/
```

The local directory retained the name `aeld-assignment-1`. The Git remote determines where commits are pushed, so renaming the working directory was unnecessary.

I kept the compiler toolchain and Actions runner outside the assignment repository. Only the source code, build configuration, test changes, and required evidence files belonged in the submission.

## 4. Install and Verify the ARM Cross Compiler

Native compilation builds a program for the development machine. Cross compilation uses a toolchain that targets another architecture.

| Build Type | Compiler | Target Architecture |
| --- | --- | --- |
| Native | `gcc` | x86-64 Linux in this VM |
| Cross | `aarch64-none-linux-gnu-gcc` | AArch64 Linux |

I used Arm GNU Toolchain **13.3.Rel1**, with GCC **13.3.1**. After downloading and extracting it into `~/arm-cross-compiler/`, I added its `bin` directory to the shell path:

```bash
export PATH="$HOME/arm-cross-compiler/arm-gnu-toolchain-13.3.rel1-x86_64-aarch64-none-linux-gnu/bin:$PATH"
aarch64-none-linux-gnu-gcc --version
```

To make the path available in future Bash sessions, the same export can be added to `~/.bashrc`.

The recorded version was:

```text
aarch64-none-linux-gnu-gcc (Arm GNU Toolchain 13.3.Rel1 (Build arm-13.24)) 13.3.1 20240614
```

From the repository root, I generated the required compiler report:

```bash
cd ~/aeld-assignment-1
mkdir -p assignments/assignment2
{
    aarch64-none-linux-gnu-gcc -v
    aarch64-none-linux-gnu-gcc -print-sysroot
} > assignments/assignment2/cross-compile.txt 2>&1
```

### Key Concepts

| Item | Purpose |
| --- | --- |
| `--version` | Identify the compiler release |
| `-v` | Display compiler configuration and target information |
| `-print-sysroot` | Display the target system root used by the toolchain |
| Sysroot | Provide target headers and libraries for compilation and linking |
| `2>&1` | Capture standard error together with standard output |

The redirection matters because GCC writes much of its verbose information to standard error.


## 5. C File Operations — writer.c

The C writer accepts a file path and a string:

```bash
./writer /tmp/test.txt "Hello World"
```

It creates or overwrites the file and writes the string without appending a newline. Unlike the Bash writer from Assignment 1, this implementation does not create missing parent directories.

Reference implementation used in this assignment:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <syslog.h>

int main(int argc, char *argv[])
{
    openlog("writer", LOG_PID, LOG_USER);

    // Check the number of arguments
    if (argc != 3) {
        syslog(LOG_ERR, "Invalid number of arguments");
        fprintf(stderr, "Usage: %s <writefile> <writestr>\n", argv[0]);
        closelog();
        return EXIT_FAILURE;
    }

    const char *writefile = argv[1];
    const char *writestr = argv[2];

    // Open the file for writing
    FILE *fp = fopen(writefile, "w");

    if (fp == NULL) {
        syslog(LOG_ERR, "Failed to open %s: %s",
               writefile, strerror(errno));
        closelog();
        return EXIT_FAILURE;
    }

    // Log the writing operation
    syslog(LOG_DEBUG, "Writing %s to %s",
           writestr, writefile);

    // Write the string
    size_t len = strlen(writestr);

    if (fwrite(writestr, 1, len, fp) != len) {
        syslog(LOG_ERR, "Failed to write to %s: %s",
               writefile, strerror(errno));
        fclose(fp);
        closelog();
        return EXIT_FAILURE;
    }

    // Close the file
    if (fclose(fp) != 0) {
        syslog(LOG_ERR, "Failed to close %s: %s",
               writefile, strerror(errno));
        closelog();
        return EXIT_FAILURE;
    }

    closelog();
    return EXIT_SUCCESS;
}
```

### Key Concepts

| Function or Value | Purpose |
| --- | --- |
| `argc == 3` | Require the program name and two user arguments |
| `argv[1]`, `argv[2]` | Access the destination path and text |
| `openlog()` | Configure the identifier, options, and syslog facility |
| `LOG_USER` | Select the user-level message facility |
| `LOG_DEBUG` | Record the write operation at debug severity |
| `LOG_ERR` | Record a failure at error severity |
| `fopen(path, "w")` | Create a file or truncate an existing file |
| `strlen()` | Measure the string length in bytes, excluding the null terminator |
| `fwrite()` | Write bytes and check the number written |
| `fclose()` | Flush buffered output and close the stream |
| `strerror(errno)` | Describe a library error |
| `EXIT_SUCCESS`, `EXIT_FAILURE` | Report success or failure to the calling process |

Checking `fclose()` is important because buffered writes can fail when the stream is flushed. Logging the operation does not by itself prove that all data reached the file.

This version passed the recorded assignment tests. Further error-handling improvements could preserve `errno` immediately after a failed operation and report cleanup failures as well.

## 6. GNU Make — Native and Cross Builds

The Makefile manages compilation, linking, and cleanup:

```makefile
CC = $(CROSS_COMPILE)gcc
CFLAGS = -Wall -Wextra -Werror -std=c11

TARGET = writer
OBJS = writer.o

.PHONY: all clean

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(CFLAGS) -o $@ $^

writer.o: writer.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(TARGET) *.o
```

Recipe lines must begin with a tab.

The build has two stages:

```text
writer.c → writer.o → writer
          compile     link
```

| Make Variable or Command | Purpose |
| --- | --- |
| `$(CROSS_COMPILE)gcc` | Select the compiler using an optional prefix |
| `make` | Build with native GCC by default |
| `make clean` | Remove the executable and object files |
| `make CROSS_COMPILE=aarch64-none-linux-gnu-` | Build with the ARM64 toolchain |
| `$@` | Refer to the target |
| `$<` | Refer to the first prerequisite |
| `$^` | Refer to all prerequisites |
| `.PHONY` | Declare targets that represent actions rather than files |

The warning options help catch suspicious code, and `-Werror` turns compiler warnings into build failures.

### Native Build and Manual Verification

```bash
cd ~/aeld-assignment-1/finder-app
make clean
make
file writer

./writer /tmp/makefile-test.txt "Makefile works!"
printf 'Exit code: %s\n' "$?"
printf 'File content: ['
cat /tmp/makefile-test.txt
printf ']\n'
```

The recorded manual test produced:

```text
Exit code: 0
File content: [Makefile works!]
```

The native binary was identified as an x86-64 ELF executable.

At first, the missing trailing newline made the output difficult to read. Surrounding the content with brackets made the result clear. `$?` must be checked immediately after the command whose status matters.

## 7. ARM64 Cross Compilation and Binary Verification

I cleaned the native artifacts before switching compilers:

```bash
cd ~/aeld-assignment-1/finder-app
make clean
make CROSS_COMPILE=aarch64-none-linux-gnu-
file writer
file writer > ../assignments/assignment2/fileresult.txt
```

The recorded ARM64 output was:

```text
writer: ELF 64-bit LSB executable, ARM aarch64, version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-aarch64.so.1, for GNU/Linux 3.7.0, with debug_info, not stripped
```

The important architecture marker is `ARM aarch64`. Details such as build IDs and debug information can vary with the toolchain and build settings.

### Why Clean Before Switching Architectures?

Make tracks dependencies and timestamps. With this Makefile, changing the compiler prefix alone does not force existing object files to rebuild.

An old x86-64 object file can therefore interfere with an ARM64 build, or an ARM64 executable can be left behind when native tests are expected.

After saving the cross-compilation evidence, I restored the native executable:

```bash
make clean
make
file writer
```

The ARM64 executable was verified with `file`; it was not executed on ARM hardware during this assignment. Running it on the x86-64 VM would require a compatible emulation setup.

## 8. Integrate the C Writer into finder-test.sh

The integration test originally called the Bash writer:

```bash
./writer.sh "$WRITEDIR/${username}$i.txt" "$WRITESTR"
```

I changed it to call the compiled utility:

```bash
./writer "$WRITEDIR/${username}$i.txt" "$WRITESTR"
```

Before the file-writing loop, I added a clean native build:

```bash
echo "Removing the old writer utility and compiling as a native application"
make clean || exit 1
make || exit 1
```

This prepares an executable that can run on the VM and stops the script if compilation fails. Adding `|| exit 1` to each writer invocation is a possible additional improvement; it was not part of the recorded invocation above.

## 9. Run the Full Assignment Tests

From the repository root:

```bash
cd ~/aeld-assignment-1
./full-test.sh
```

Selected output from the recorded test run:

```text
1 Tests 0 Failures 0 Ignored
OK
...
Executing assignment test script
...
Usage: ./writer <writefile> <writestr>
Usage: ./writer <writefile> <writestr>
...
Writing 10 files containing string AELD_IS_FUN to /tmp/aeld-data
...
The number of files are 10 and the number of matching lines are 10
success
Test of assignment assignment2 complete with success
```

The usage messages came from tests that intentionally supplied invalid arguments. They were expected output from negative tests.

| Verification | Recorded Result |
| --- | --- |
| Manual native writer test | Exit status 0 and expected file contents |
| Native binary inspection | x86-64 ELF executable |
| Cross-compiled binary inspection | ARM aarch64 ELF executable |
| Finder integration test | `success` during the full test run |
| Full assignment test | `Test of assignment assignment2 complete with success` |
| GitHub Actions | Reported as passed in the original learning notes |

The local test output was included in the notes. The GitHub Actions result was reported as successful, with a workflow link, but the notes did not include the complete job log.


