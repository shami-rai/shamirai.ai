---
title: "Context compaction"
state: reported
date: 2026-09-10
cluster: agents
repo: https://github.com/shami-rai/context-compaction
summary: "What a long-running agent throws away when the window fills, and how it decides. Summarise, score-and-drop, or offload to storage."
---

## The question

Loop engineering ended on a hunch I never tested: the loop changes that actually break an agent
are the ones that destroy information, not the ones that merely rearrange it. Compaction is
information destruction on purpose. Every long-running agent eventually throws part of its history
away and hopes it chose well. What can an agent lose and still finish, and can I find the point
where compaction stops being housekeeping and becomes the cause of the failure?

## What I built

The same rig as loop engineering, pointed at a different variable: the same 400 devices, three tools, ten-row cap and question. That task peaks around 6k tokens and never gets near a context limit, so nothing forces compaction on it. I forced it. Before each request, a transform rewrites the copy of the history that gets sent, while the loop keeps its own full record, so every run shows exactly what the model was shown and what it was denied.

The transform has three dials, moved one at a time: how many recent turns of tool results survive (three, two or one), what a cleared result turns into (a placeholder, the device ids it listed, or a digest of ids and numbers), and whether the model's own earlier thinking goes too. Alongside it I ran the API's own tool-result clearing, with its trigger dropped to 2,000 tokens so it would bite on something this small, keeping the last three or ten tool uses.

Each run is graded and counted for turns, tool calls, exact re-queries and cost. Halfway through I added one more measure, after one condition passed only because it never fired: the most results actually hidden from the model on any single request.

All of it ran on Claude Opus 5 at low effort, the setting with the least slack that still solves the untouched task. Ten conditions, three runs each (four for one), 31 runs, $7.60. The small n is the main limitation.

## What surprised me

**It never once gave a wrong answer.** I predicted the heaviest condition would produce at least one confident wrong answer from a partial picture, most likely the plausible runner-up. In 31 runs, no answer was wrong. Every failure was a run that never answered at all. Compaction didn't make the agent guess. It made it unable to finish.

**Clearing results alone broke it, completely.** I predicted that keeping only the latest turn of results would be survivable, because the numbers would already live in the model's thinking. It went 0/3, and the three traces were almost identical. By turn three it had found the right device. Then, for the rest of its twenty turns, it alternated between fetching that device's record and fetching the risk ranking, one call per turn, each fetch evicting the other: nine of one and eight of the other, in all three runs. The thinking I was counting on barely existed. At low effort the model's whole output, thinking included, averaged about 140 tokens a turn.

**The break is a cliff, and the task decides where it is.** Keeping three turns: 3/3. Two: 3/3. One: 0/3. The answer needs two facts from two calls, and the second call depends on the first. Two turns can hold both. One can't. No token budget explains that edge. The shape of the question does.

**The ids were worth more than the numbers.** I predicted that leaving device ids in a cleared result would change nothing. It went 3/4, against 0/3 for plain clearing. A cleared ranking that still names the top device lets the model fetch both records in one turn, which turns two dependent steps into two independent ones. The fourth run knew both ids and ping-ponged between them anyway, so ids make batching possible, not certain. And batching wasn't enough on its own either: one run with its earlier thinking stripped fetched both facts together three times and still ran into the cost cap.

**Removing more wasn't worse.** I predicted that losing results and losing thinking would only break it together. Losing thinking alone changed nothing, and losing both (1/3) was no worse than clearing results alone.

**The API's own clearing was harsher than mine.** It keeps the last few tool uses, not turns, so part of a parallel batch is cleared before the model has read it. Keeping three: 1/3, and each failure ran to the cost cap. Keeping ten: 3/3.

**The bill was right for the wrong reason.** Every compaction condition cost more than doing nothing, as I predicted, but not because of context size. Each edit moves the prompt-cache prefix, so the history is rewritten to cache on every turn: about 67,000 cache-write tokens per run for one-turn clearing, against 3,700 for control.

## What I'd do differently

**Decide where to cut runs off before running them, and check what that costs.** Failing runs ran into a limit at 48 to 65 cents each, while passing runs averaged 13. Most of the budget went on watching the same livelock play out again, which left three runs a condition, where 1/3 and 2/3 are the same result. The obvious fix, a 25 cent cap, would have bought about twenty more runs. It would also have killed the only successful run in two conditions, because both of those finished late. Where you cut a run off is a claim about which slow successes don't count, and I'd want to make that claim on purpose.

**Use a task with more than one dependency.** One question with one pair of linked facts gives one cliff in one place. To know whether "the window has to hold everything the next step depends on" is a rule rather than an anecdote, I need tasks where that number is three, or five.

**Measure what was destroyed from the first run.** For part of this I believed a setting worked when it had simply never fired.

**Test what I skipped.** Nobody told the model its results would disappear. The obvious next condition is telling it, and seeing whether it batches, takes notes, or neither. The one prediction I never tested is whether high effort, with real thinking to carry things, survives what low effort can't.
