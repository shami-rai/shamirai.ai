# Notes: Building shamirai.ai

Running log of surprises, dead ends and things that did not work as expected.
Append the moment something is unexpected, do not wait. Newest at the bottom.

This is raw material for the "what surprised me" beat on
[shamirai.ai](https://shamirai.ai/e/building-shamirai-ai/). It is not published, so it does not
need to be tidy, fair, or well written.

---

**2026-08-07** The layout is genuinely deterministic across machines. CI on Node 22 / Linux
produced a byte-identical PCA projection to a local Node 20 / macOS run. That was hoped for, not
expected, and it is what makes committing `positions.json` worth doing: any diff in that file is
real signal rather than floating-point noise.

**2026-08-07** Predicted that Graph RAG and Knowledge graphs as memory would embed close together
and probably wanted merging. Wrong, and by a lot: they landed at opposite ends of the map. The
model reads one as a retrieval technique and the other as a storage problem. Trusting the geometry
over my own argument was the right call.

**2026-08-07** Context compaction and LLM-as-judge came out 0.035 apart, the tightest pair on the
map, with no semantic reason. Still unexplained. Suspect an artifact of one-line summaries plus PCA
compressing hard, but that is a guess.

**2026-08-07** The CI type-check gate paid for itself on its very first run, catching a real
unsoundness (asserting `number[]` to a 2-tuple) that had passed locally only because
`positions.json` was still empty when I last ran `astro check`. A gate that catches something on
day one is a strong argument for gates.

**2026-08-07** The mobile index was completely unscrollable and had shipped that way. `Base.astro`
set `overflow: hidden` for the map, but the index renders through the same layout, so it inherited
it. Hidden from testing because `window.scrollTo` still works when this is broken; only a real
wheel event reveals it. Lesson: verify user-facing behaviour with user-facing input.

**2026-08-08** `npm run project` flipped a node to `executing` without giving it a body, so the
entry rendered the "nothing written yet" message that belongs to `learning`. The two scripts
disagreed about what a state transition implies. Found only by running it for real.

**2026-08-08** Writing beat 1, about 70 words, was enough to move the map and trigger the
positions commit-back. Metadata does not move it (`repo:` is not embedded), prose does. The layout
responds to what you say about a topic, not to its bookkeeping.

**2026-08-08** The site's own entry linked to `github.com/shamirai/shamirai.ai` and 404'd. Written
by hand before the account name was known. The scaffold script, which derives the owner from
`gh api user` rather than trusting me, has been correct the whole time. Deriving beats typing.
