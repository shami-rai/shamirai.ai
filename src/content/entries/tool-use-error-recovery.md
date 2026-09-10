---
title: "Tool-use error recovery"
state: executing
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

## What surprised me

## What I'd do differently
