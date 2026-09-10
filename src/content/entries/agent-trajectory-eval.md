---
title: "Agent trajectory eval"
state: executing
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

## What surprised me

## What I'd do differently
