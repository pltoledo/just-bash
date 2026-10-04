---
"just-bash": minor
---

Add the `commandNotFound` option to run commands that just-bash does not provide.

The command runs for each name that is neither a builtin nor a function and is not found in PATH, and receives the missing name followed by its arguments, similar to bash's `command_not_found_handle`. Nested executions such as `bash -c`, `xargs` and `timeout` use it too.

A name that PATH contains only as a non-executable file now fails with "Permission denied" (exit status 126), as in bash, instead of "command not found" (127), and does not reach `commandNotFound`.
