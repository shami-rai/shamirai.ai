#!/usr/bin/env node
/**
 * Recomputes map positions from real embeddings.
 *
 *   npm run embed
 *
 * Reads every entry, embeds it with Workers AI, projects 768 dimensions down to
 * 2 with PCA, and writes src/data/positions.json. Commit that file. It is the
 * layout, and it should be stable between builds.
 *
 * Needs CF_ACCOUNT_ID and CF_API_TOKEN (see .env.example). Without them the site
 * still builds; positions just fall back to the per-cluster layout.
 *
 * Honest caveats, since this is the interesting part:
 *   - PCA is not UMAP. It preserves global structure and large distances well,
 *     and is mediocre at tight local neighbourhoods. It is ~60 lines and has no
 *     dependencies, which for a map of a few dozen nodes is the right trade.
 *   - The two axes are normalised independently, so the picture is not
 *     distance-true. Relative *arrangement* is meaningful; absolute gaps aren't.
 *
 * What this file writes is the projection and nothing else. Spacing nodes apart
 * so labels are readable happens at build time in src/lib/positions.ts, which
 * keeps this output honest and means both layout modes get the same treatment.
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRIES = join(ROOT, 'src/content/entries');
const OUT = join(ROOT, 'src/data/positions.json');
const MODEL = '@cf/baai/bge-base-en-v1.5';

// ---------------------------------------------------------------- env
async function loadEnv() {
  try {
    const raw = await readFile(join(ROOT, '.env'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    /* no .env, rely on the environment */
  }
}

// ---------------------------------------------------------------- linear algebra
const dot = (a, b) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
};

function normalise(v) {
  const n = Math.sqrt(dot(v, v)) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}

/** Top principal direction of M by power iteration. Deterministic init, so the
 *  same corpus always yields the same map. */
function topComponent(M, d) {
  let v = normalise(Array.from({ length: d }, (_, i) => Math.sin(i * 12.9898 + 1)));
  for (let iter = 0; iter < 250; iter++) {
    const Mv = M.map((row) => dot(row, v));
    const w = new Array(d).fill(0);
    for (let i = 0; i < M.length; i++) {
      const s = Mv[i];
      const row = M[i];
      for (let j = 0; j < d; j++) w[j] += s * row[j];
    }
    v = normalise(w);
  }
  return v;
}

function pca2(vectors) {
  const n = vectors.length;
  const d = vectors[0].length;
  const mean = new Array(d).fill(0);
  for (const v of vectors) for (let j = 0; j < d; j++) mean[j] += v[j] / n;
  const X = vectors.map((v) => v.map((val, j) => val - mean[j]));

  const v1 = topComponent(X, d);
  const X2 = X.map((row) => {
    const s = dot(row, v1);
    return row.map((val, j) => val - s * v1[j]);
  });
  const v2 = topComponent(X2, d);

  return X.map((row) => [dot(row, v1), dot(row, v2)]);
}

/** Independent per-axis normalisation into roughly -0.72..0.72. */
function normaliseAxes(pts) {
  const out = pts.map((p) => [...p]);
  for (const axis of [0, 1]) {
    const vals = out.map((p) => p[axis]);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const span = hi - lo || 1;
    for (const p of out) p[axis] = ((p[axis] - lo) / span) * 1.44 - 0.72;
  }
  return out;
}

// ---------------------------------------------------------------- workers ai
async function embed(texts, accountId, token) {
  const out = [];
  for (let i = 0; i < texts.length; i += 50) {
    const batch = texts.slice(i, i + 50);
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${MODEL}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: batch }),
      },
    );
    if (!res.ok) {
      throw new Error(`Workers AI returned ${res.status}: ${(await res.text()).slice(0, 400)}`);
    }
    const json = await res.json();
    if (!json.success) throw new Error(`Workers AI error: ${JSON.stringify(json.errors)}`);
    out.push(...json.result.data);
    process.stdout.write(`  embedded ${Math.min(i + 50, texts.length)}/${texts.length}\r`);
  }
  process.stdout.write('\n');
  return out;
}

// ---------------------------------------------------------------- main
await loadEnv();

const accountId = process.env.CF_ACCOUNT_ID;
const token = process.env.CF_API_TOKEN;
if (!accountId || !token) {
  console.error('Missing CF_ACCOUNT_ID / CF_API_TOKEN. Copy .env.example to .env and fill it in.');
  console.error('The site builds fine without this. Positions fall back to the cluster layout.');
  process.exit(1);
}

const files = (await readdir(ENTRIES)).filter((f) => f.endsWith('.md'));
if (files.length < 3) {
  console.error(`Only ${files.length} entries. Need at least 3 for a projection to mean anything.`);
  process.exit(1);
}

const docs = [];
for (const f of files) {
  const { data, content } = matter(await readFile(join(ENTRIES, f), 'utf8'));
  docs.push({
    slug: basename(f, '.md'),
    // On an unwritten entry the summary is nearly all the signal there is, so it
    // goes in ahead of the body. A title alone embeds to something very vague.
    text: `${data.title}. ${data.summary ?? ''} ${data.cluster}. ${content
      .replace(/^#+\s.*$/gm, ' ')
      .trim()}`.slice(0, 2000),
  });
}

console.log(`Embedding ${docs.length} entries with ${MODEL}…`);
const vectors = await embed(docs.map((d) => d.text), accountId, token);

const coords = normaliseAxes(pca2(vectors));
const positions = Object.fromEntries(
  docs.map((d, i) => [d.slug, [Number(coords[i][0].toFixed(4)), Number(coords[i][1].toFixed(4))]]),
);

await writeFile(OUT, `${JSON.stringify(positions, null, 2)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(positions).length} positions to src/data/positions.json`);
console.log('Commit it. That file is the map layout.');
