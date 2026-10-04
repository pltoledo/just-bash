import { describe, expect, it } from "vitest";
import { Bash } from "../Bash.js";
import { defineCommand } from "../custom-commands.js";

describe("command_not_found_handle", () => {
  it("lets an embedder forward missing commands to a custom command", async () => {
    const forward = defineCommand("forward", async (args, ctx) => ({
      stdout: `forwarded ${JSON.stringify(args)} cwd=${ctx.cwd}\n`,
      stderr: "",
      exitCode: 7,
    }));
    const env = new Bash({ customCommands: [forward], cwd: "/home/user" });

    const result = await env.exec(
      'command_not_found_handle() { forward "$@"; }; node -e "1 + 1"; echo "status=$?"',
    );

    expect(result).toMatchObject({
      stdout: 'forwarded ["node","-e","1 + 1"] cwd=/home/user\nstatus=7\n',
      stderr: "",
      exitCode: 0,
    });
  });

  it("keeps the caller's positional parameters", async () => {
    const env = new Bash();

    const result = await env.exec(
      'set -- one two; command_not_found_handle() { echo "in=$*"; }; missing x; echo "out=$* count=$#"',
    );

    expect(result).toMatchObject({
      stdout: "in=missing x\nout=one two count=2\n",
      stderr: "",
      exitCode: 0,
    });
  });

  it("stops a handler that keeps calling missing commands", async () => {
    const env = new Bash({ executionLimits: { maxCallDepth: 5 } });

    const result = await env.exec(
      "command_not_found_handle() { inner_missing; }; outer_missing; echo unreachable",
    );

    expect(result).toMatchObject({
      stdout: "",
      stderr:
        "bash: command_not_found_handle: maximum recursion depth (5) exceeded, increase executionLimits.maxCallDepth\n",
      exitCode: 126,
    });
  });

  it("reports command not found when no handler is defined", async () => {
    const env = new Bash();

    const result = await env.exec('missing; echo "status=$?"');

    expect(result).toMatchObject({
      stdout: "status=127\n",
      stderr: "bash: missing: command not found\n",
      exitCode: 0,
    });
  });
});
