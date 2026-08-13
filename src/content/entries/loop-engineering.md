---
title: "Loop engineering"
state: executing
cluster: harness
repo: https://github.com/shami-rai/loop-engineering
summary: "Designing the iteration itself: when to continue, retry, escalate, compact, or stop. Most agent failures are loop failures, not model failures."
---

## The question

The claim I keep repeating is that most agent failures are loop failures, not model failures. I
don't actually know if that's true, or if it's just a satisfying thing to say. If it is true, I
should be able to take a working agent, change nothing about the model or the prompt, and break it
purely by changing the loop around it. Can I?

## What I built

A rig for breaking an agent on purpose, and the control group to break it against.

The world is a frozen fleet of 400 connected medical devices, one 30-day telemetry window, eight
fields per device. It is synthetic, from a seeded generator, because this repo is public and the
data has to be mine to publish. That trade has a cost worth naming: real data has one virtue a
generator cannot fake, which is that nobody chose the answer. So the generative process is written
out in the script, the seed is fixed, and I read the answer off the output afterwards instead of
designing it in.

The agent sees the fleet through three deliberately narrow tools: count, rank by one stored field,
fetch one device. No tool returns more than ten rows, and no tool will compute a rate for me. Both
constraints are load-bearing. A tool that ranked by downtime-per-operating-hour would turn the
whole task into two calls, and a higher row cap would make the answer visible in a single query.
Because neither exists, the one device that matters is invisible to the obvious search and can only
be found by narrowing the range and dividing by hand.

The task has a known right answer and a known wrong one. The wrong one is the interesting half: it
is what a run reports if it ranks once and stops, and also what a run reports if it ranks once,
pulls every candidate and carefully divides all of them. Both roads lead to the same plausible,
well-supported, incorrect device.

Then the loop itself, written by hand rather than with the SDK's tool runner, because the tool
runner *is* the loop and using it would put the entire subject of the project inside a library I
cannot instrument. This first version has no retry, no iteration budget, no compaction, and no
error handling: a tool that throws takes the process with it. That is not a first draft on the way
to the real one. It is the control. I cannot claim a retry policy helped unless I have watched the
thing fail without one.

## What surprised me

## What I'd do differently
