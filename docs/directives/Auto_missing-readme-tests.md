# tests has no README while its peers do

## 1. Why this exists

This directive was generated from a workspace scan, not written by hand. It matched the
`missing-readme` category in the install's `backlog_policy.yaml`, which Robert authorised for
automatic dispatch:

> A package with no README. Additive, one file, and the agent has to read the code to write it - which surfaces problems as a side effect.

Nobody looked at this specific case before it was dispatched. Treat the finding as a
claim to verify, not as an instruction - §5 says what to do if it is wrong.

## 2. Scope

```
tests/README.md
```

At most 1 file(s). A change that needs more than that is a
different task: stop and report it rather than widening this one.

## 3. The work

`tests/README.md` has no README while its sibling packages do. Write one.

Read the package's code first - the README must describe what is actually there. Cover:
what this package is for, how it is used (a real call, taken from the code or its
tests), and what it depends on. Match the length and tone of a sibling package's README.

Do not describe intentions, roadmaps, or anything you cannot see in the code.

## Verification

Run `git diff --stat`; it must pass (the check command for this directive).

## Rules for this run

- **Write only inside this worktree.** Never `%TEMP%`, never `/tmp`. Scratch goes in `.devin-scratch/`.
- **Do not delete anything.** `rm` is not permitted in a headless run and ends it silently.
- **One shell command at a time.** No `&&` or `;` chains, no `$(...)`, no heredocs, no `cat`
  piped into a command. Each of these ended a real run without a word.
- Commit with a plain single-line message: `git commit -m "one line"`.
- Use the `python` already on PATH. Do not probe for interpreters or create a venv.
- No servers and no long-running processes.
- Never merge, rebase onto, or push to the default branch.
- **If a command is refused, stop immediately** and report Blocked naming the refused
  command. Working around a refusal is what killed every run that died silently; the
  refusal itself is useful information and reporting it is a successful outcome.
- **If the task turns out to be wrong, stop and say so.** This directive was generated
  automatically from a scan, and a scan can be wrong. Reporting "this was a false
  positive, here is why" is a complete and welcome result - do not invent work to do.
- **This change is purely additive.** Create the new file and change nothing else. If
  making it pass would require editing existing code, stop and report that instead -
  that is a finding worth more than the file.

## 5. If the finding is wrong

The scan that produced this can be wrong: a module may be tested somewhere the scan did
not look, a README may live one level up, a marker may already be resolved. If so, stop,
report Blocked, and state what the scan missed. That report is how the finder gets
fixed, and it is worth more than the work would have been.

## 6. Completion criteria

- [ ] `git diff --stat` passes.
- [ ] Nothing outside §2 was modified.
- [ ] Nothing was deleted.
- [ ] If anything was refused or the finding was wrong, it is reported rather than worked around.

## 7. Report

What you changed and why. The real output of the check command, pasted. Anything about
the finding that was inaccurate. And any refused command, verbatim.

<!-- check: git diff --stat -->

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Queued |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
| Policy | missing-readme |

**Status log**
- 2026-10-22 14:56 · backlog-policy · none → Queued — generated from a missing-readme finding authorised in backlog_policy.yaml
<!-- queue:end -->
