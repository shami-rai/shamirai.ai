---
title: "Building shamirai.ai"
state: executing
cluster: runtime
summary: "This site. A map of what I am learning rather than a list of what I have finished."
repo: https://github.com/shamirai/shamirai.ai
---

## The question

Every personal site I've seen is a list of finished things. That shape hides the part I actually
care about: what I don't know yet. Can the site itself be the instrument, so that looking at it
tells me where my gaps are instead of just advertising what's already done?

## What I built

A map instead of a feed. Every topic is a node in a semantic space: dashed outline for things I
want to understand, pulsing for things I'm building, solid for things I've finished and written up.

Positions come from embeddings. Each entry is embedded with Workers AI, projected from 768
dimensions to 2 with PCA, and laid out by meaning rather than by date. Related work ends up near
related work without me arranging anything. Adding an entry is one markdown file; the map
rearranges itself.

The whole thing is static. Nothing runs at request time, so the entire site is a folder of HTML on
Cloudflare Pages.

## What surprised me

## What I'd do differently
