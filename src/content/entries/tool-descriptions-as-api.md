---
title: "Tool descriptions as the API"
state: reported
date: 2026-09-10
cluster: protocol
repo: https://github.com/shami-rai/tool-descriptions-as-api
summary: "The claim that a tool's prose description, not its type signature, is the real interface the model programs against, and that writing it is design work."
---

## The question

In loop engineering the biggest design decisions were made in the tool definitions, before the
model was ever called. But I only varied what the tools could do, never how they were described. If
the prose description really is the interface the model programs against, then changing only the
words, with identical code underneath, should change behaviour. How much? Can I make a working agent
fail by editing nothing but a description?

## What I built

A way to change nothing but words, and prove that's all that changed.

The world, the tools and the question are loop engineering's, untouched: 400 synthetic medical devices, three narrow tools (count, rank by one stored field with at most ten rows back, fetch one device), and a question whose right answer never appears in any single ranking of the whole pool. The only thing that moves between conditions is the description strings, on each tool and each parameter. Every variant is a copy of the baseline definitions with strings edited, and a checker refuses to start a run unless the variant matches the baseline exactly once every description is stripped out. It also has to reject a deliberately retyped parameter, so I know it can fail.

Nine versions. Five honest: the baseline; a minimal one, three words per tool; a verbose one, 437 words full of ALWAYS and NEVER; a short true warning that the cap can hide a high ratio; and a correct numbered recipe (band the hours range, rank within each band, divide), added after the pilot. Four with one plausible lie each: that the ranking tool returns every match, which every result it sends back contradicts; that downtime is already per 100 hours, which nothing on screen contradicts; a hint to rank by raw downtime; and a wrong recipe (rank once, fetch the top ten, divide) with a promise that the top ten always contain the answer.

Opus 5 at low effort is the main arm, five runs per condition. Haiku 4.5, without thinking, ran every condition as the weaker model, five runs each (six for two of them, counting pilots). 92 graded runs, $3.50. The grader reads the trace as well as the answer, including the model's summarised thinking, so a run that noticed a lie can be told apart from one that didn't.

## What surprised me

**Yes, and it took two sentences.** Telling the model that downtime was already per 100 hours took it from 4 of 5 to 0 of 5. I predicted that. I didn't predict how. There was no reasoning to lose: every run made the same three calls, give or take the row limit, with no thinking at all. The lie turned the question into a lookup, and a lookup gets no thought. The numbers that expose it, 453 hours next to 314 minutes, were on screen every time. It flipped the conclusion too. The real finding is that the vendor risk score missed the worst device; four of the five lied-to runs reported that the score had flagged it correctly in advance.

**A numbered recipe isn't advice, it's code.** I predicted the wrong recipe would be followed sometimes. It was followed 5 of 5, identically, every step of the arithmetic right, landing on the wrong device. The correct recipe, in the same form, was 5 of 5 right, every run identical, and the cheapest condition that got the answer. The unmodified baseline fails once in five the same careful way, fetching all ten and dividing, and that run even wrote the caveat that a low-hour device might beat its answer, without checking. The wrong recipe didn't invent that failure. It removed the variance.

**It catches the lies it can check, and tells nobody.** The claim that the ranking returned everything was noticed in 5 of 5 runs, in thinking ("only 5 results came back despite the claim of more"), and all five got the right answer anyway. It appeared in 0 of 5 final answers. From outside, those runs look like baseline runs, so whoever owns the tool never learns the description is wrong. The hint to rank by raw downtime did nothing at all: it sat two sentences after the fact that downtime is raw minutes, and the fact won without ever being argued. Across the four lies, what separated 10 of 10 from 0 of 10 wasn't how plausible they were. It was whether anything inside the run could check them.

**Words couldn't rescue the weaker model.** I predicted the helpful sentence and the correct recipe would get Haiku to at least 3 of 5. It was 0 of 11, and 0 of 47 across everything. In 47 runs Haiku never once used an hours filter narrower than the question's own pool. It followed the fetch and divide steps of the recipe and skipped the banding step, the only one that changes the answer. The descriptions moved it between the lazy wrong road and the careful one. For Opus the description decided the answer; for Haiku it only decided the cost.

**More words bought nothing.** The verbose version used 60% more input tokens for the same results, mostly by re-sending itself every turn.

## What I'd do differently

**Run the expensive question first.** The high effort arm, the one that would say whether thinking harder rescues the two lies that worked, never ran: the shared API account ran out of credit when I had spent $3.50 of $8. I queued the cheap arms first because they were cheap. The expensive one should have gone first because it was the open question.

**Five runs was too few for the honest conditions.** The baseline failing once in five means a 5 of 5 elsewhere can't be told apart from the baseline. The dishonest results are clean, 0 of 10 against 10 of 10, but "the verbose description changed nothing" is weaker than it sounds.

**Separate thinking from size.** Haiku ran without thinking and Opus with it, so I can't say whether Haiku ignored the recipe because it's smaller or because it didn't think. A Haiku arm with thinking on would split those.

**Compare in tokens, not dollars.** Prompt caching let a condition that repeats itself read its whole prefix from the previous run's cache, so the most predictable conditions look cheapest in dollars.
