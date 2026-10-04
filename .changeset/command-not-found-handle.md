---
"just-bash": minor
---

Run the `command_not_found_handle` function for commands that PATH lookup does not find.

As in bash, the handler runs in a separate execution environment with the command name and its arguments, and its exit status becomes the command's. Embedders can define it to forward missing commands to a custom command.
