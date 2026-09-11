---
title: "Building shamirai.ai"
state: reported
date: 2026-09-10
cluster: runtime
summary: "This site. A map of what I am learning rather than a list of what I have finished."
repo: https://github.com/shami-rai/shamirai.ai
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

Around that sits the machinery that keeps the instrument honest. Every push is type-checked, which
matters because entries are typed data and a typo in a state should fail a build, not quietly drop
a node. CI then re-embeds every entry and commits the new positions back if the map moved, so a
diff in the positions file only ever means the writing changed. Starting work on a topic is one
command that creates the repo, links it to the node and flips its state, and refuses any name that
isn't already on the map, so nothing unrelated on my machine can end up on GitHub by accident. Every
writeup has the same four sections, and every project keeps a local notes file where surprises get
written down the moment they happen, because the section about what surprised me is written weeks
after the surprises.

## What surprised me

**The layout is deterministic across machines.** I hoped a CI run on Linux would reproduce my laptop
exactly, and didn't expect it to. It did, byte for byte. That one property is what makes committing
the positions file worth doing: any change in it is signal, not floating-point noise.

**The geometry beat my argument.** I predicted Graph RAG and knowledge graphs as memory would land
together and probably want merging. They landed at opposite ends of the map: one reads as a
retrieval technique, the other as a storage problem. I would have merged them on instinct. The map
was right and I was wrong.

**Prose moves the map. Metadata doesn't.** Writing the first section of one entry, about seventy
words, was enough to move the map. Adding a repo link moved nothing, because links aren't
embedded. The map responds to what I say about a topic, not to its bookkeeping, which is what I
wanted and still surprised me by how little text it took. It turned out to be too sensitive, which
is why it's no longer true: see the last point below.

**The map once looked like it rearranged completely, and it hadn't.** Finishing the loop
engineering writeup moved all twenty nodes, most by nearly the full width of the map. The structure
hadn't changed at all: distances between nodes were preserved and the whole thing had mirrored
vertically, because a principal component is only defined up to its sign. "Positions changed" and
"structure changed" are different claims, and I had written documentation that treated them as the
same. Pinning the sign made that diff go to zero.

**Real use found bugs that my testing didn't.** The mobile index shipped completely unscrollable,
and passed my check because scrolling in code still works when scrolling with a finger doesn't. The
command that starts a project flipped a node to in progress without giving it anything to render.
The site's own entry linked to a GitHub account that doesn't exist, because I typed it by hand before
I knew the name; the script that derives the account has been right the whole time. And the CI
type check caught a real bug on its very first run.

## What I'd do differently

**Use the instrument before perfecting it.** When the first node was finally reported, the pipeline
around the map was far more developed than the map itself: one finished topic out of twenty, and a
CI system that re-embeds on every push. Building the apparatus was more fun than filling it, which
is the same hazard loop engineering ran into on a smaller scale.

**Distrust the early map.** For weeks, almost every entry was a title and a one-line summary,
and the layout was mostly an arrangement of those one-liners. Pairs like context compaction
and LLM-as-judge sat almost on top of each other for no reason I could find. I'd either embed only
entries that have real writing, or mark the early layout as provisional instead of drawing it with
the same confidence as the later one.

**Test with the input people actually use.** Every bug that shipped had passed a check that tested a
proxy for the real thing: programmatic scrolling instead of a finger, a script's output instead of
the rendered page, a link I typed instead of one I derived.

**Keep the states honest.** At one point seven nodes were pulsing at once. The point of the
executing state is to show what I'm working on right now, and seven at once showed what I had
started. Then six of them were built and run by Claude while I was hands off. They're real work and
each writeup says so, but the map draws a node I worked through myself and a node that was worked
through on my behalf exactly the same way. As it stands, the instrument can show that work happened
but can't show that I learned from it, and that's the gap it was built to expose.

**Place topics by what they are, not by what I wrote about them.** Once eight writeups of about a
thousand words landed, the map stopped arranging topics and started arranging word counts. Every
finished node crowded onto one side and every unstarted one onto the other, and six reports about
the same device fleet piled on top of each other. Positions now come from each topic's title and
one-line summary only, which puts every node on equal footing whatever its state, and keeps a node
still when its report changes.
