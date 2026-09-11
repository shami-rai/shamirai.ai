---
title: "MCP server authoring"
state: reported
date: 2026-09-10
cluster: protocol
repo: https://github.com/shami-rai/mcp-server-authoring
summary: "Building a Model Context Protocol server so an agent can use your own data and actions as first-class tools rather than pasted context."
---

## The question

Every tool I've written so far has lived inside one script, wired directly into one loop. MCP is the
claim that tools should be a separate service any agent can connect to. I don't know what changes
when a tool stops being a function call and becomes a protocol boundary: what gets harder, what
gets easier, and whether a model uses a tool any differently when it arrives over MCP than when I
hand it over directly.

## What I built

The same rig as loop engineering, with the tools moved out of the process. The fleet, the three tool handlers, the ten-row cap, the question and the hand-written loop are unchanged. What changed is the path between the loop and the handlers. On one side, in-process function calls. On the other, a Model Context Protocol server that the harness spawns as a child process and talks to over stdio: newline-delimited JSON-RPC on stdin and stdout.

I wrote the server twice. Once the way the official SDK wants it written, with its high-level McpServer. That only accepts zod schemas, so my JSON Schema had to be re-authored in zod, and the SDK converts it back when a client asks what tools exist. Once with the low-level Server class, handed my exact JSON Schema and doing nothing for me. The second one is the control. The model sees identical bytes over it, so any difference there is the protocol itself.

The client is where the new work lives. It lists the server's tools, converts them into the definitions the Messages API takes, and drops the fields that have nowhere to go. It also maps two different kinds of failure onto one: a tool that returns an error, and a call that never returns at all. Then I broke the boundary on purpose: a tool slower than the client's timeout, a server that dies on its sixth call, the same death with a harness that restarts it, and a server that prints to stdout. A separate probe measures what needs no model: the definitions before and after the round trip, token cost, latency, and what the same eight malformed calls come back as down each path.

Opus 5 at low and high effort, five runs per arm, plus a small Haiku 4.5 arm: 61 run records, $3.85. The API credit ran out before the last planned arm, so one condition was never run.

## What surprised me

**The model couldn't tell, and I couldn't have told either.** Direct and over MCP, Opus 5 went 20 for 20, at the same cost to a tenth of a cent. I predicted that. What I didn't predict was how noisy the measure was. The control arm, whose inputs were byte-identical to direct, averaged 15 tool calls against direct's 19. That gap is bigger than anything I would have blamed on the protocol. With five runs per arm, I couldn't have seen a difference of the size I predicted even if one existed.

**The official SDK quietly rewrote my tools.** I predicted the definitions would change and got the details wrong. No `additionalProperties` appeared, which I'd been sure of. Instead every integer field gained bounds of plus or minus two to the fifty-third, including a limit whose description says 1 to 10. The machine-readable schema now contradicts the prose beside it. The client SDK then reordered keys again on the way in. Two rewrites, one on each side of the wire, 16% more definition tokens, and nobody asked for either. The model ignored all of it: across the matrix runs it never asked for more than ten rows.

**My own error messages were worse than the library's.** I predicted the SDK's validation errors would be less useful than mine. They were better: my handler answered a missing field with `Cannot rank by "undefined"`, while the SDK said what it expected instead. But the SDK's messages leak the protocol, so the model reads "MCP error -32602" inside what's supposed to be a tool result. And the same tool now has two contracts. A model name with the wrong capitalisation quietly returns zero devices in-process, and the SDK's server rejects it.

**When the server died, the strong model answered like the weak one.** I predicted that with a dead server Opus would stop within two turns and decline to answer. It kept calling the dead server for four to seven more turns, eleven to twenty-one failed calls per run, because "Not connected" doesn't say whether the failure is permanent. Then it answered, seven times out of seven, with the task's shortcut wrong answer. That's exactly what Haiku gives with a healthy server. Every answer said the tools had dropped out, and several named the precise gap: a low-hour device could still beat it. That device is the right answer.

In six of the seven runs the crash landed at the same point in the search, because the opening moves barely vary, so those runs were all left holding the same three records. The seventh had already seen the right device in a ranking, noted that its lookup had failed, and still chose the wrong one. Restarting the server and retrying the call took about a hundred milliseconds, and turned 0 of 7 into 5 of 5.

## What I'd do differently

**Size the prediction against the noise first.** I wrote "within three tool calls" before knowing that identical inputs produce a spread bigger than that. The byte-identical control should have run first, and its variance should have set how many runs every other arm needed.

**Test the error text, not just the error.** The slow tool and the dead server got the same response from the model, retry, with opposite outcomes. One failure happened to be transient and the other wasn't, and neither message said which. The arm I most wanted was the same crash with the harness saying plainly that the server is gone. It never ran. My first two attempts went out with the option unwired, which I only caught by reading the traces, and then the credit ran out. My own runner's retry-on-error had the same flaw as the model's: it couldn't tell a permanent failure from a transient one.

**Go past stdio.** Everything here is one local process on one machine, and one task. The API's remote MCP connector needs a publicly reachable URL, so I never tested it. The problems a network brings (authentication, partial failure, a server shared by several agents) are exactly where the boundary should cost the most. What these runs support is narrower: over a local stdio boundary, the model uses the tool the same way, and all of the new risk sits in the harness around it.
