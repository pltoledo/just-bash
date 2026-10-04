import { afterEach, beforeEach, describe, it } from "vitest";
import {
  cleanupTestDir,
  compareOutputs,
  createTestDir,
  setupFiles,
} from "./fixture-runner.js";

describe("command_not_found_handle - Real Bash Comparison", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await createTestDir();
  });

  afterEach(async () => {
    await cleanupTestDir(testDir);
  });

  it("passes the command name and arguments and returns the handler status", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo "name=$1 args=[${*:2}] count=$#"; return 42; }; missing a "b c"; echo "status=$?"',
    );
  });

  it("gives the handler the command's stdin", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo "read=$(cat)"; }; echo piped | missing',
    );
  });

  it("applies the command's redirections to the handler output", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo "handled $1"; }; missing > out.txt; cat out.txt',
    );
  });

  it("runs the handler in a separate environment", async () => {
    const env = await setupFiles(testDir, { "sub/.keep": "" });
    await compareOutputs(
      env,
      testDir,
      'x=before; d=$PWD; command_not_found_handle() { x=after; cd sub; g() { :; }; }; missing; echo "x=$x"; [ "$PWD" = "$d" ] && echo same-dir; type g >/dev/null 2>&1; echo "g=$?"',
    );
  });

  it("ends only the handler on exit", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { exit 3; }; missing; echo "after=$?"',
    );
  });

  it("sees prefix assignments of the command", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo "FOO=$FOO"; }; FOO=1 missing',
    );
  });

  it("runs for commands inside command substitution", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo "sub:$1"; }; echo "got $(missing)"',
    );
  });

  it("runs for the command builtin", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo "handled $1"; return 4; }; command missing; echo "status=$?"',
    );
  });

  it("is not used for names that contain a slash", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo handled; }; ./missing; echo "status=$?"',
    );
  });

  it("stops after the handler is unset", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo handled; }; unset -f command_not_found_handle; missing; echo "status=$?"',
    );
  });

  it("does not change type or command -v", async () => {
    const env = await setupFiles(testDir, {});
    await compareOutputs(
      env,
      testDir,
      'command_not_found_handle() { echo handled; }; type missing >/dev/null 2>&1; echo "type=$?"; command -v missing; echo "v=$?"',
    );
  });
});
