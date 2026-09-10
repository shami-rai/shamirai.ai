---
title: "Tool-use error recovery"
state: reported
date: 2026-09-10
cluster: agents
repo: https://github.com/shami-rai/tool-use-error-recovery
summary: "What you hand back when a tool call fails: the raw error, a translated message, or a suggested fix. The choice changes recovery rates a lot."
---

## The question

My loop-engineering control loop had no error handling at all. A tool that threw would have taken
the whole process down, and it never came up because nothing ever threw. So I don't know what an
agent actually does with a failure when it gets one. Does it matter whether the model sees the raw
error, a friendly translation, or a suggested fix? My instinct says the friendly version wins. I
want to find out whether that instinct is a UX habit that doesn't transfer.

## What I built

I ran this one hands off: Claude designed, built and ran the experiment from the question above, and I read the results afterwards. The first person below is the project's account, not a memory of mine.

The same rig as loop engineering, on purpose: the same frozen fleet of 400 devices, the same three narrow tools, the same question with the same right answer and the same plausible wrong one. The only new code sits between the model and the tools. It breaks some calls and decides what the model is told when it does, so every difference between conditions is a difference in what the model was shown, never in what the fleet contains.

Three kinds of failure. Transient: the first attempt at some calls fails with a timeout, and the identical call works if retried. Which calls fail comes from a seeded hash of the call itself, so every wording faces the same failures on the same calls. Drift: the backend has renamed the downtime field and nobody updated the tool description, so ranking by downtime fails for the whole run, while the device records quietly carry the new name. Silent: the calls the transient schedule would have failed come back looking like success instead (an empty list, a count of zero, a null record) with no error flag.

Flagged failures reach the model in one of three wordings. Raw: the backend's error line and a stack trace, which names the symptom and never the fix. Friendly: "Something went wrong. Please try again." Fix: what happened and the specific next step. Drift exists because of that split. Most validation errors carry their own fix ("limit 10 exceeds 5"), which makes raw and fix the same condition. A renamed field is the case where the error says what broke and not what to do.

Opus 5 at low effort, five runs per condition and ten for the control: 47 graded runs, $4.45. A single Haiku 4.5 run got the unbroken task wrong, so there was nothing there to break. I planned a high-effort arm and a test of the error flag; the API credit ran out after one high-effort run, so neither happened.

## What surprised me

**The friendly message lost, but not to the raw error.** I predicted fix, then raw, then friendly. Under drift, fix went 5/5 and was the only wording that ever repaired the call, in all five of its runs. Raw went 2/5 and friendly 3/5, and neither repaired it once in ten runs. My instinct was wrong, and so was my correction to it. The ordering isn't precise over vague. It's "tells you what to do" over everything else.

**Raw and friendly failed differently.** Raw was the only wording that produced refusals. Two of five raw runs refused outright, one after four tool calls: the precise error let it prove the path was closed, and it concluded, wrongly, that there was no other way in, rejecting a proxy as "a guess, not the measured quantity you asked about". Friendly never refused. It retried once, then varied everything except the field: each of the five models, extra filters, smaller limits. Then it walked around the problem, and when the detour went through the wrong proxy it answered the plausible wrong device behind a caveat. One raw run did the same. The precise error made it more likely to quit honestly. The vague one only ever made it hedge.

**It read the fix and didn't recognise it.** Eight of those ten runs fetched device records containing the new field name, two of them 24 times. None tried it. The one high-effort run did the same enumeration, then noticed the stored field was called something else and repaired the call. One run isn't a result, but it's the next question.

**Silent failures split on whether they contradict something the model believes.** I predicted it would almost never re-check an empty result. It re-issued 15 of 25 null device lookups, because a null for an id it has just seen in a list is loud. It re-checked 0 of 13 empty rankings and zero counts. In one run an empty ranking became a sentence in the answer, "no sub-500h device has under ~200 hours", about a fleet where 76 do. Silent went 3/5, better than I predicted, but that run is the only confident wrong answer in the whole experiment. Every other miss came with a caveat or a refusal.

**Transient failures cost almost nothing.** Every wording retried nearly every failure. The two wrong transient runs took the rank-once shortcut after every failed call had already been recovered. The control never took it in ten runs, but 2/15 against 0/10 is well within chance.

## What I'd do differently

**Pick a task where walking around the failure costs something.** The detour that saved half the drift runs works only because the answer device has 76 operating hours. If the worst device had 300, every detour would have been wrong and the wordings would have separated further. My correct-rate column partly measures my fleet.

**Measure repair separately from correctness from the start.** "Correct" lumped together runs that fixed the call, runs that walked around it, and runs that got lucky on the way. Repair, 5/5 against 0/10, is the one drift number that survives five runs a condition. I only added it after the pilot traces showed me I needed it.

**Spend in the order that answers the question.** I ran the whole low-effort matrix before any high-effort run, so when the credit ran out, the most interesting comparison (does thinking harder turn a detour into a repair?) had one run in it. Run the smallest version of every arm first, then fill in.
