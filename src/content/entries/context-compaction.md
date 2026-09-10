---
title: "Context compaction"
state: executing
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

## What surprised me

## What I'd do differently
