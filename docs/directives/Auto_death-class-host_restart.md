# Fix the host_restart death class

Auto-drafted by the tick's death-class escalation sweep - a skeleton for a
human or agent to scope, not a ready dispatch.

## 1. Why this exists

`host_restart` recurred across dispatch deaths inside one window (the sweep's
distinct-directives bound), so its fix is `| Priority | high |`. The newest
death notes:

- death-classifier: host_restart - the host shut down or restarted under the run; WIP checkpointed, requeued once
- death-classifier: host_restart - the host shut down or restarted under the run; WIP checkpointed, requeued once

Pointers a fix run needs: the signature and its policy live in
`packages/loop/agentflow_loop/death_classifier.py` (the `SIGNATURES` and
`POLICIES` tables); the fix-directive hint map lives in
`packages/loop/agentflow_loop/priority_maintenance.py` (`FIX_HINTS`); the
death ledger itself is `C:\Users\cheat\AppData\Local\AgentFlow\personal-laptop\dispatch_logs\death_events.jsonl`.

## 2. Scope

<name the change that makes this death class stop killing runs>

## 3. Verification

<the command that proves it>

<!-- queue:start -->
## Queue

| Field | Value |
|---|---|
| Status | Draft |
| Assigned to | devin |
| Branch | - |
| Base branch | - |
| Policy | fix |
| Priority | high |

**Status log**
- 2026-10-14 09:00 · agentflow-tick · none → Draft — auto-drafted by the death-class escalation sweep: host_restart recurred
<!-- queue:end -->
