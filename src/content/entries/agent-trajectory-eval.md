---
title: "Agent trajectory eval"
state: reported
date: 2026-09-10
cluster: evals
repo: https://github.com/shami-rai/agent-trajectory-eval
summary: "Scoring the path an agent took rather than just its final answer: redundant calls, recovery from errors, dead ends. Final-answer accuracy hides all of it."
---

## The question

Loop engineering taught me two things about measurement the hard way: a run can reach the right
answer by the wrong path, and hop count is not a measure of work, because the model batches calls. I
graded two runs by reading the traces myself. That does not scale past two. What does it take to
score the path an agent took automatically, and which of the things I noticed by eye can a program
actually detect?

## What I built

I ran this one hands off: Claude designed, built and ran the experiment from the question above, and I read the results afterwards. The first person below is the project's account, not a memory of mine.

A scorer that reads an agent's run records and reports ten properties of the path it took, and a labelled corpus to measure it against. The agent is the one from loop engineering: same fleet, same three tools, same question, plus a FINAL line so a program can read the answer.

Each property is defined twice, once as I would judge it reading the trace and once as code. Most are plain trace arithmetic: turns versus calls, repeated calls, errors and whether they were retried. The two that matter most are whether the evidence actually proves the answer, and from which turn it could have. Those needed something else: an oracle that knows what the tools mean. A top-ten list caps everything it didn't return. A total that matches the devices already identified closes a range. From those two rules it bounds the rate every device could have, seen or unseen, and says whether anything could still beat the named answer. Replayed on loop engineering's first trace, it sharpened my old by-eye claim: four of the six band queries could each be dropped on their own, but only three together.

The corpus is 24 runs chosen to take different roads:
- Opus 5 at low, medium and high effort, parallel and serial.
- Three runs on Haiku 4.5 in the normal environment, and two more in sabotaged ones, because Opus rarely goes wrong on its own.
- Sabotaged environments: the answer device deleted from the world, a tool that fails about 30% of the time, a tool description that lies about units, and a loop capped at three turns.

I froze the scorer before the corpus existed, and labelled every run by hand before running the scorer on it. The git history shows the order. A small LLM judge was written for the properties code can't see, but it never ran: the shared API key ran out of credit the moment it started. Total spend: $1.96.

## What surprised me

**Final-answer accuracy hid most of what happened.** 16 of 24 runs got the right answer for the world they ran in, and only 6 did enough to prove it. In the unmodified environment Opus was right 10 times out of 10 and proved it 3 times. All five low-effort runs were right and unproven; I had predicted at least two. Most of the gaps are absurd: a 2-minute device whose hours were never checked, and which would need under 3 hours to matter. But not all. One run wrote that it would double-check a device with 90 minutes of downtime, then didn't. Had that device logged only 100 hours, it would have been the answer. I read the pilot trace myself and didn't notice it was unproven.

**The property I expected to be hardest scored perfectly.** I predicted at least 85% agreement on whether a path was justified, and at most 60% on the exact turn it became so, with me as the lenient one. Both came out 24 of 24. In every run that was right but unproven, the oracle named the same missing device I had. The catch is that I made those labels by doing the bound arithmetic by hand, which is the oracle's method. This shows code can do careful reading. It doesn't show that careful reading is what a quick look gives you.

**The number check was a fabrication detector in a corpus with no fabrication.** On the dev runs, my first version accepted 85 to 93% of all integers under 1000 as following from the results. The typed rewrite agreed with me on 16 of 23 runs, and every run it flagged was flagged for a model name or firmware version: "InfusaLine 700" contains a 700. The real errors were a count written as a word and, three times, "314 minutes per 100 hours". 314 really is in a tool result; the unit is wrong. Fixing the model-name bug lifts agreement to 20 of 23 and catches none of the four for the right reason.

**The waste I came looking for wasn't there.** I predicted the median run would make three or more calls after the answer was already settled. 18 of 24 never settled it at all, and the other six made 0 or 1. Not one of the 324 calls was redundant: all 24 identical repeats were retries of a call that had just failed. On this task the failure is stopping early, not working too much.

**The reasoning I most wanted to catch lives in a number.** The pilot filtered on max hours 127, which is 88 minutes divided by the leading rate at that point, but its thinking never states the bound. I added a rule for derived filter values. On the corpus it fired twice, both times on runs keywords had already caught, because the other runs that used the bound rounded 127 up to 130.

## What I'd do differently

**Have someone else label, or label before building the oracle.** Agreement between two things one person designed measures consistency. The number worth having is how often a quick human read disagrees with the proof, and I didn't collect it.

**Seed the failure each check exists for.** Nothing in the corpus fabricated a number, so the number check was never tested against the thing it is for. The Haiku arm gave me natural wrong paths, but in the normal environment it was the same three-call shortcut every time.

**Run the expensive comparison first.** The judge was the last step, and the credit ran out before it. The half of the question it was for, what code can't detect, has no measurement. It's the same lesson as last time: run the risky thing on day one.

**Measure under-work.** I ported loop engineering's measures of over-work: repeats, speculative calls, calls after the answer. The useful number was "right but unproven", and it needed a model of these specific tools. The reliable half of this scorer is the half that knows the task, which means it won't transfer.
