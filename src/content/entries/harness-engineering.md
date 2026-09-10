---
title: "Harness engineering"
state: reported
date: 2026-09-10
cluster: harness
repo: https://github.com/shami-rai/harness-engineering
summary: "Designing everything around the model: tool surface, context assembly, permissions, feedback. The scaffolding that decides whether a capable model is actually useful."
---

## The question

Every agent I've built has run on someone else's harness: a framework's tool definitions, its
context handling, its error behaviour. I've never built the surrounding machinery myself, so I don't
actually know which parts are hard and which only look hard from the outside. What does it take to
build one, and what decisions does it force that I've never had to make?

## What I built

I ran this one hands off: Claude designed, built and ran the experiment from the question above, and I read the results afterwards. The first person below is the project's account, not a memory of mine.

A harness over this site's own content, built from nothing, with each part in its own file and the
decision it forced written at the top of that file. The model and the loop are deliberately plain,
because loop engineering already studied loops. Everything else is the harness.

It sees a frozen snapshot of the site rather than the live one, so every run sees the same world.
There are four tools that read (list, read a topic or one section of it, keyword search, and
nearest neighbours on the map) and one that writes, which can't touch the site. It only produces a
proposal file for review, and only if a write policy outside the model allows it. Arguments are
checked against the same schema the model was given, because the API doesn't enforce that on its
own. Every failure, whether a bad argument, an unknown topic, a refused write or a spent budget,
comes back in one shape: what went wrong and what to do next. Results over a size cap are cut, with
a note saying how to ask for less. The system prompt can optionally carry an index of every topic.
Every run is written to a trace.

Most of the decisions I'd never had to make showed up before the model was called: snapshot or live
data, whether writes exist at all, who validates arguments, what a failure looks like, how big a
result may be, what goes in the prompt up front, and where the budget lives. Then I measured some of
them. There were five questions with answers computed from the snapshot, under configurations that
each changed one thing: the index preloaded, the cap removed, the cap cut to 500 characters, writes
refused, and the site's style rule either written into a tool description or enforced when the
tool is called. That came to 49 runs on Opus 5 at low effort, for $1.40.

## What surprised me

**The comfortable version measured nothing.** Base, preloaded, uncapped and read-only: 33 of 33
runs passed. On these tasks the configurations differed only in path and cost, never in whether
the answer was right. Loop engineering warned me about exactly this and I built it anyway.

**One constant was the dial again, and another part cancelled it.** A 2,000 character cap turned
one question from one call into seven, because the capped list forced the model to page through
the clusters one by one. With the index preloaded, the same cap cost one call. The parts of a
harness compensate for each other, which you only see by varying them together.

**Search turned into a keyhole.** At 500 characters, one run hit the cap eight times, then narrowed
a search down to the exact phrase the answer sat in and read it through the search snippet, a
200-character window I'd built as a convenience. The cap limited reads and didn't limit search.
Every tool is a read path, whether I designed it as one or not.

**Both failures were honest, and my grader couldn't tell.** The tight cap produced two failures. In
one, the model said it couldn't find the number rather than guess. In the other, it ran into the
25-call budget one topic short, and its reply named the topic it hadn't been able to confirm and
said why. My grader reads only the final line, so it scored that honest, partial answer the same as
a confidently wrong one. I read the grade before I read the reply and wrote down the wrong
conclusion. Grading the last line isn't grading the run.

**The model follows rules it's shown, and I had never shown it this one.** The site forbids em
dashes. That rule lives in a file the harness never reads, and 9 of 14 proposals used one. Written
into the tool's description, 0 of 3 did. Enforced when the tool was called, the one that broke it
was rejected and rewritten clean on the next try. The refusals worked the same way: when writes
were off, every run tried once, took the refusal's hint, and put the proposal in its reply instead.

## What I'd do differently

**Start with the version that can fail.** The tight cap was an afterthought, and it was the only
configuration that told me anything about correctness. I'd find the settings that break the task
first, then compare designs there.

**Audit every tool for what it can reveal.** I thought of the cap as a limit on what the model could
see. It was a limit on one tool. A search snippet, an error message that quotes its input, a
neighbour list: each one is a way to see something, and the harness is only as tight as the
loosest of them.

**Carry the house rules in from day one, and enforce the ones that matter.** A rule in a
description worked here, but a description is advice and an enforced check is a guarantee, and the
guarantee cost one extra call in one run out of three.

**Read the runs, not the summaries.** Twice I wrote a finding down from a summary instead of the
runs. I recorded that every proposal had broken the style rule after looking at two of them; the
real figure was five of the first six, and nine of fourteen overall. I recorded that a failed run
had confidently returned an incomplete list; its reply said plainly what it was missing. Both came
close to ending up on this page. Two runs per cell also can't rank the
configurations on cost, since the first run of each pays for the prompt cache and costs about half
again as much as the second.
