---
title: 'Bash Scripting Basics — Assignment 1 Learning Record'
description: 'Bash Scripting Basics — Assignment 1 Learning Record'
pubDate: 'Nov 11 2026'
tags: ['linux']
heroImage: '../../assets/blog-bash.jpeg'
---

**Topics:** Bash Scripting, Linux, Docker, Git, Github Actions

[Assignment 1 Repository](https://github.com/j22868706/aeld-assignment-1)

## 1. The Complete Learning Path for This Assignment

1. Set Up a Linux Development Environment

   Use a Google Cloud VM to practice working with the terminal, installing packages, and managing user permissions.
2. Create a GitHub Repository

   Create `aeld-assignment-1`, clone it to the VM, and import the course's official starter code.
3. Modify Assignment Settings and C Unit Tests

   Configure the GitHub username and implement Unity tests to verify that the settings are consistent.
4. Implement Bash Scripts

   Complete `finder.sh` and `writer.sh` while learning about arguments, conditionals, file operations, and error handling.
5. Resolve Shell Execution Permission Issues

   Encounter `Permission denied` and learn to use `chmod +x`.
6. Git Push Authentication and Permission Management

   Go from failed password authentication to using a PAT, then address workflow permission restrictions.
7. Debug Docker and GitHub Actions

   Clarify the relationships between the Docker client, daemon, socket, and user groups.

## 2. Set Up the Linux and GitHub Development Environment

Working environment:

```bash
Google Cloud VM
└── Linux user: username
    ├── ~/aeld-assignment-1/
    └── ~/actions-runner/
```

First, check the Linux system and tools:

```bash
lsb_release -a
uname -m
git --version
gcc --version
```

## 3. Git Repository Configuration

### Key Concepts

| Git Command                 | Concept Learned                     |
| ---------------------- | ------------------------- |
| `git clone`            | Clone a remote repository to the local machine      |
| `git remote add`       | Add a remote repository source        |
| `git fetch`            | Download remote revision data without directly modifying the current working files      |
| `git merge`            | Merge the revision history and changes from different branches            |
| `git submodule update` | Retrieve other Git repositories that the project depends on |
| `git status`           | Check the current revision and file changes               |
| `git add`              | Add changes to the staging area                  |
| `git commit`           | Create a local commit                  |
| `git push`             | Push commits to the remote repository                  |


## 4. Bash Scripting — finder.sh

One of the core tasks in this assignment is to write a file search tool.

It requires two arguments:

```bash
./finder.sh /tmp/aeld-data linux
```

Here, `$1` is the directory to search, and `$2` is the text to search for.

Finder's execution logic

Provide filesdir and searchstr

Check that the arguments and directory are valid

Use find to count the number of files, X

Use grep to count the number of matching lines, Y

Output X and Y

Reference implementation:

```bash

#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Error: Two arguments are required."
    exit 1
fi

filesdir="$1"
searchstr="$2"

if [ ! -d "$filesdir" ]; then
    echo "Error: Invalid directory."
    exit 1
fi

numfiles=$(find "$filesdir" -type f | wc -l)

matchinglines=$(grep -r -F -h \
    -- "$searchstr" "$filesdir" | wc -l)

echo "The number of files are $numfiles and the number of matching lines are $matchinglines"

```

Bash concepts learned from this code:

- `$1`, `$2`: Positional parameters.
- `$#`: The number of arguments.
- `-ne`: Not equal.
- `-d`: Check whether a path is a directory.
- `!`: Negate a condition.
- `$(...)`: Execute a command and capture its output.
- `|`: A pipe, which passes the output of the previous command to the next command.
- `exit 1`: Indicate that the program failed.
- `wc -l`: Count lines.

An important distinction: `grep` counts matching lines, rather than the total number of occurrences of the search text. Even if the search string appears twice on the same line, it still counts as only one line.

## 5. Bash Scripting — writer.sh

The purpose of `writer.sh` is to create a file and write the specified text to it.

Example usage:

```bash
./writer.sh /tmp/aeld-data/sample.txt ios
```

If the file does not exist, create it; if it already exists, overwrite its contents.

```bash

#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "Error: Two arguments are required."
    exit 1
fi

writefile="$1"
writestr="$2"

writedir=$(dirname "$writefile")

if ! mkdir -p "$writedir"; then
    echo "Error: Could not create directory."
    exit 1
fi

if ! printf '%s\n' "$writestr" > "$writefile"; then
    echo "Error: Could not write file."
    exit 1
fi

exit 0

```

The most important new concepts here are:

`dirname`: Get the directory containing the file.

`mkdir -p`: Create the required directories, including any parent directories that do not yet exist.

`>`: Write output to a file, overwriting its existing contents.

`printf`: Output text in a specified format, making formatting easier to control than with `echo` alone.

## 6. The First Error Encountered in Practice: Permission denied

Run:

```bash
./finder-test.sh
```

Output:

```bash
./finder-test.sh: 57: ./writer.sh: Permission denied
```

### Cause

The file exists, but it lacks execute permission.

Linux file permissions are divided into:

| Permission      | Symbol  | Purpose   |
| ------- | --- | ---- |
| Read    | `r` | Read a file |
| Write   | `w` | Modify a file |
| Execute | `x` | Execute a file |

Solution:

```bash
chmod +x writer.sh
chmod +x finder.sh
```

Check:

```bash
ls -l writer.sh finder.sh
```

Example:

```bash
-rwxr-xr-x writer.sh
-rwxr-xr-x finder.sh
```

### Key Lessons Learned

Having content in a file does not mean it can be executed directly.

Git also tracks whether a file is executable, so the permission changes need to be committed to Git as well:

```bash
git add finder-app/writer.sh finder-app/finder.sh
git commit -m "Fix executable permissions"
```

## 7. The Second Error: GitHub Password Authentication Failed

Run:

```bash
git push -u origin HEAD
```

Error encountered:

```bash
remote: Invalid username or token.
Password authentication is not supported for Git operations.
```

This happens because GitHub no longer supports account login passwords for Git operations over HTTPS.

Two authentication methods:

| Method                    | Purpose                |
| --------------------- | ----------------- |
| Personal Access Token | HTTPS Git authentication    |
| SSH Key               | Authenticate using a public and private key pair |

Authentication was eventually completed using a PAT.

## 8. The Third Error: GitHub Workflow Permission

Git push had already uploaded 179 objects, but ultimately failed:

```bash
refusing to allow a Personal Access Token to
create or update workflow
.github/workflows/github-actions.yml
without workflow scope
```

This means GitHub authentication succeeded, but the token did not have sufficient permissions to modify the workflow.

### Cause and Solution

- A fine-grained PAT requires the repository permissions `Contents: Read and write` and `Workflows: Read and write`.
- A classic PAT requires appropriate repository access permissions and the `workflow` scope.

Authentication: Who are you?

Authorization: What are you allowed to do?

These two concepts are also very important in AWS IAM, Kubernetes RBAC, and other cloud platforms.

## 9. The Fourth Error: GitHub Actions Docker Failed

After the push, GitHub Actions displayed four annotations:

```bash
full-test: Value cannot be null. (Parameter 'network')
full-test: Docker Exit Code 1

unit-test: Value cannot be null. (Parameter 'network')
unit-test: Docker Exit Code 1
```

At first, I thought it might be a code issue, but it actually occurred during Docker initialization.

Check step by step:

```bash
docker --version
docker info
sudo systemctl is-active docker
groups
ps -ef | grep '[R]unner'
```

The results were as follows:

| Item            | Result                  |
| ------------- | ------------------- |
| Docker CLI    | Installed, 29.9.3          |
| Docker Daemon | `active`            |
| Docker Socket | `permission denied` |
| Linux user     | `username`       |
| docker group  | User is not a member              |
| Runner        | Run by `username`  |

### Docker Architecture

GitHub Actions Runner

Runs as username

Docker Client

docker run, docker info

Docker Socket

/var/run/docker.sock

Docker Daemon

Manages images, containers, and other resources

Docker Container

Runs automated tests

Resolve the permission issue with the following commands:

```bash
sudo groupadd -f docker
sudo usermod -aG docker <username>
```

Log back in to the VM for the new group permissions to take effect.

Then test:

```bash
docker run --rm hello-world
```

This time, the output successfully showed:

```bash
Hello from Docker!
This message shows that your installation appears to be working correctly.
```

This is the last step that has actually been confirmed to work so far.

It confirms that the Docker CLI, daemon, socket permissions, and container execution are all working correctly.

## 10. Understanding GitHub Actions and CI/CD

Developer modifies code

Git Commit + Push

GitHub Actions Workflow

Self-hosted Runner

Docker Test Environment

Unit Test + Full Test

Pass

Fail

The purpose of this process is to revalidate the code in a consistent environment after every update.

### Differences Between the Three Tests

| Test               | Main Purpose                         |
| ---------------- | ---------------------------- |
| `unit-test.sh`   | Validate the C unit tests and username configuration |
| `finder-test.sh` | Verify that the Bash scripts meet the requirements       |
| `full-test.sh`   | Run the course's integration tests                     |

## 11. The Main Problems and Solutions in This Assignment

| Problem Encountered                                | Cause                                   | Approach to Resolution                   |
| ------------------------------------- | ------------------------------------ | ---------------------- |
| `writer.sh: Permission denied`        | The script lacks execute permission                        | `chmod +x`             |
| GitHub Password Authentication Failed | GitHub does not accept account password authentication                     | Use a PAT or SSH           |
| GitHub Workflow Push Rejected         | The PAT lacks workflow write permissions                 | Add Workflows permissions        |
| GitHub Actions Docker Exit Code 1     | The runner cannot access the Docker socket            | Check the Docker service and group permissions      |
| `docker info: permission denied`      | The user is not in the docker group                   | `usermod -aG docker`   |
| Docker still cannot be used after changing group membership                     | The old session has not loaded the group membership                     | Log back in and restart the runner         |

## 12. Essential Linux Command Reference

| Command            | Purpose                        |
| ------------- | ------------------------- |
| `pwd`         | Display the current directory                   |
| `ls -la`      | View files and permissions                   |
| `cd`          | Change directories                     |
| `cat`         | Display file contents                    |
| `vim`         | Edit a file                      |
| `chmod +x`    | Add execute permission to a file                  |
| `whoami`      | Show the current user                   |
| `id`          | Show the user's UID, GID, and groups         |
| `groups`      | List the groups the user belongs to                 |
| `sudo`        | Run with administrator privileges                  |
| `systemctl`   | Manage Linux services               |
| `ps -ef`      | View system processes                    |
| `find`        | Search for files                      |
| `grep`        | Search for text                      |
| `wc -l`       | Count lines                      |
| `mkdir -p`    | Create directories                     |
| `dirname`     | Get the parent directory path                  |
| `git status`  | View the Git working directory status             |
| `git push`    | Push commits to GitHub       |
| `docker info` | Check the Docker client and server |
| `docker run`  | Create and run a container           |

