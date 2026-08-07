# shamirai.ai

A map of what I'm learning, what I'm building, and what I've finished.

Not a portfolio. The primary reader is me — which is why the unfinished nodes are on the map at
all. A list of completed projects hides the interesting part.

## The loop

**Learn → execute → report.** Pick a topic, build something small and public, write down what
actually happened. Every entry is the same five beats so writing one is never a design decision:

1. The question
2. What I built
3. What surprised me
4. What I'd do differently
5. The link

## Adding an entry

```bash
npm run new -- "Agent trajectory eval" --cluster evals --state executing
```

That writes one markdown file with the beats pre-filled and an empty `summary:` to fill in.
Nothing else to touch — the map places it automatically.

`summary` is one line saying what the topic **is** — not what you found, which is what the beats
are for. It renders above the beats, and it matters more than it looks: on an entry you haven't
written up, it's nearly all the signal `npm run embed` has to position the node with. A vague
summary produces a vague map.

States:

| state | on the map | body |
| --- | --- | --- |
| `learning` | dashed outline | none; it exists to mark a gap |
| `executing` | pulsing amber | beats 1–2 |
| `reported` | solid | all five |

Clusters live in `src/lib/clusters.ts`. Add one there before using it in frontmatter.

## Starting a project for a node

```bash
npm run project -- loop-engineering
```

Creates `../loop-engineering` — a sibling of this repo, so
`~/Documents/projects/ai-projects/loop-engineering` — plus a public GitHub repo of the same name
(pass `--private` for private). It writes `repo:` back into the entry and flips `learning` →
`executing`.

**One name everywhere:** node slug = repo name = local directory name. No mapping to remember.

The script refuses any slug that isn't already an entry. That's deliberate — it can only ever
create repos for topics already on the map, so unrelated local work can never be pushed to GitHub
by it.

Not every node needs a repo. Plenty are pure reading, and correctly have no `repo:` at all.

## Running it

```bash
npm install
npm run dev
```

`npm run build` produces a fully static `dist/`. `npm run check` type-checks.

## How positions are decided

Three layers, most specific wins:

1. `position: [x, y]` in an entry's frontmatter — manual override, always wins
2. `src/data/positions.json` — real embeddings, written by `npm run embed`
3. a deterministic scatter around the entry's cluster — the zero-setup fallback

So the map works on a fresh clone with no credentials, and gets truer as you wire things up.
Layer 1 exists because a projection will occasionally put something somewhere that reads wrong,
and arguing with PCA is a bad use of an evening.

### Recomputing from embeddings

```bash
cp .env.example .env   # then fill in CF_ACCOUNT_ID and CF_API_TOKEN
npm run embed
```

This embeds every entry with Workers AI (`@cf/baai/bge-base-en-v1.5`), projects 768 dimensions to
2 with PCA, and writes `src/data/positions.json`. **Commit that file** — it is the layout, and it
should be stable between builds.

Caveats, stated plainly because this is the part worth understanding:

- PCA is not UMAP. It preserves global structure well and tight local neighbourhoods poorly. It's
  ~60 dependency-free lines, which for a few dozen nodes is the right trade.
- The two axes are normalised independently, so the picture is **not distance-true**. Relative
  arrangement is meaningful; absolute gaps are not.
- Nodes closer than a threshold get nudged apart at build time
  (`src/lib/positions.ts`) so labels stay readable. That's presentation overriding data,
  applied deliberately and last. Pinned nodes never move.
- Edges are derived from position — each node links to its two nearest neighbours. Nothing to
  author, and the graph can never contradict the layout.

## Surfaces

- `/` — the map (≥760px) or the index (below that). Same content, both server-rendered.
- `/e/<slug>` — a real page per entry. Clicking a node opens it in a panel and pushes this URL;
  loading it directly gives the standalone page.

## Deploying

Cloudflare Pages project `shamirai`, live at https://shamirai.pages.dev.

Nothing runs at request time — the whole site is a folder of HTML, and
`positions.json` is committed rather than computed during the build, so no
environment variables are needed to deploy.

### Current: direct upload

```bash
npm run build
npx wrangler@4 pages deploy dist --project-name=shamirai --branch=main
```

Needs `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in the environment.

### Better: connect the repo

Push to GitHub, then in the Pages project settings connect the repo with build
command `npm run build` and output directory `dist`. After that every push
deploys and the wrangler step above stops being necessary.

## Note on Node

Astro is pinned to 5.x because 6 and 7 require Node ≥22.12. Astro ≤7.0.9 carries published
advisories, none of which are reachable here (no SSR, no server islands, no untrusted input, no
image processing). Worth upgrading Node and moving to Astro 7 when convenient:

```bash
brew install node@22
```
