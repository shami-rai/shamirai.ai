---
title: "Loop engineering"
state: reported
date: 2026-08-08
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

**I could not break it.** I ran the task twice, changing nothing but the loop: same model, same
prompt, same tools, same question, with parallel tool calls allowed and then forbidden. Both runs
got the right answer. The failure modes I had built the task specifically to provoke, wrong
candidate set, giving up partway, context blowing out, simply did not happen. My prediction that a
naive loop would confidently return the plausible wrong device was written down before the run, and
it was wrong.

**Forcing serial tool calls made the agent cheaper, not more expensive.** This is the part I keep
turning over. Serialising took 15 turns instead of 6, exactly as expected, but it used 14 tool calls
instead of 19 and less peak context. The trace shows why. When the model can batch, speculation is
free, so it fired six queries at once and three turned out to be unnecessary. Forced to see each
result before choosing the next, it reasoned instead: it took the leading rate as a benchmark,
derived that any device above 200 hours would need more than 179 minutes of downtime to beat it,
noticed only one device cleared that bar and that its own rate was lower, and eliminated three
fifths of the search space in a single inference. Parallel tool calling is partly a substitute for
thinking. Take it away and the model thinks harder per call.

**The model out-solved my reference path, twice, differently each time.** I had assumed the only
route was to split the range into bands and check devices inside each. Run 1 banded, then bounded
each band and pruned three of them without looking inside. Run 2 skipped banding and derived one
global threshold. Mine was the worst of the three solutions.

**Most of the design work was in the tools, not the loop.** Whether the task took two hops or
fifteen was decided entirely by which fields I made rankable, before the model was ever called. One
line, a ten row cap on results, turned out to be the whole difficulty setting: at ten the answer is
invisible to any single query, at twenty it falls out of one call and the task collapses. I wrote
that line without thinking about it.

## What I'd do differently

**Run it on day one.** I spent an entire session on the apparatus (data, tools, task, ground truth,
loop) before the first execution. The first run then invalidated one of my core measurement
assumptions in about ninety seconds: I had been counting hops as a proxy for how much loop there is,
and run 1 was 6 turns and 19 tool calls, because the model batches independent work into single
turns. Hops and work are different quantities and I would have known that on day one for a dollar.

**I picked the wrong variable.** Serialising tool calls rearranges when information arrives; it
never removes any. That is presumably why the model absorbed it without difficulty. The loop changes
worth testing are the ones that destroy information the model cannot reconstruct: dropping tool
results, truncating history mid-task, capping iterations before the work is done. I reached for the
change that was easiest to implement rather than the one most likely to break something.

**I would state the claim more carefully.** "Most agent failures are loop failures" is too loose to
be tested. What these two runs actually support is something narrower and less quotable: a capable
enough model absorbs a merely inefficient loop. Which means if loop failures dominate in practice,
it is not because loops are badly arranged, it is because they lose information or stop early. That
is a sharper question, and it is the one I should have started with.
