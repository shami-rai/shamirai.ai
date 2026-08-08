#!/usr/bin/env node
/**
 * Scaffolds the repo for a node that's moving from "learning" to "executing".
 *
 *   npm run project -- loop-engineering
 *   npm run project -- loop-engineering --private
 *
 * It will:
 *   - create ../<slug>  (a sibling of this repo, inside ai-projects/)
 *   - git init, seed a README from the node's own question
 *   - create github.com/<owner>/<slug> and push
 *   - write `repo:` back into the node's frontmatter
 *   - flip the node's state from learning to executing
 *
 * SAFETY: this only ever acts on a slug that already exists as an entry in
 * src/content/entries. It never enumerates the projects directory and cannot be
 * pointed at unrelated local work. Nothing goes to GitHub unless you name it.
 */
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRIES = join(ROOT, 'src/content/entries');
const PROJECTS_ROOT = resolve(ROOT, '..'); // siblings of the site repo

const argv = process.argv.slice(2);
const isPrivate = argv.includes('--private');
const slug = argv.find((a) => !a.startsWith('--'));

function die(msg) {
  console.error(msg);
  process.exit(1);
}

function run(cmd, args, cwd) {
  return execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

if (!slug) {
  die('usage: npm run project -- <slug> [--private]\n\n<slug> must match an existing entry in src/content/entries.');
}

// --- the safety gate: the slug must already be a node on the map -------------
const entryPath = join(ENTRIES, `${slug}.md`);
try {
  await access(entryPath);
} catch {
  die(
    `No entry at src/content/entries/${slug}.md\n\n` +
      `This script only scaffolds repos for topics already on the map, so it can't\n` +
      `touch unrelated work in ${PROJECTS_ROOT}.\n\n` +
      `Create the node first:\n  npm run new -- "Some Title" --cluster <key>`,
  );
}

const raw = await readFile(entryPath, 'utf8');
const title = raw.match(/^title:\s*"?(.+?)"?\s*$/m)?.[1] ?? slug;
const summary = raw.match(/^summary:\s*"(.*)"\s*$/m)?.[1] ?? '';

if (/^repo:\s*\S/m.test(raw)) {
  die(`${slug} already has a repo: in its frontmatter. Nothing to do.`);
}

// --- resolve the GitHub owner from gh, not from a hardcoded name -------------
let owner;
try {
  owner = run('gh', ['api', 'user', '--jq', '.login']);
} catch {
  die('gh is not installed or not authenticated. Run: gh auth login');
}

const dir = join(PROJECTS_ROOT, slug);
try {
  await access(dir);
  die(`${dir} already exists. Refusing to touch it.`);
} catch (e) {
  if (e.message?.startsWith(dir)) throw e; // rethrow our own die()
}

console.log(`Creating ${dir}`);
await mkdir(dir, { recursive: true });

const readme = `# ${title}

${summary}

Part of the learn → execute → report loop at
[shamirai.ai](https://shamirai.ai/e/${slug}/). The writeup lives there.

## Status

In progress.
`;

// Every project repo carries the teaching contract. Without this, a fresh
// session here has no idea it is meant to teach rather than deliver.
const claudeMd = `# ${title}

${summary}

This repo exists because a node on [shamirai.ai](https://shamirai.ai/e/${slug}/) moved to
\`executing\`. The writeup lives on the site, not here.

## How to work in this repo

**The goal is that Shami understands this topic, not that the code gets finished.** A working
repo Shami cannot explain is a failed project.

For each step, in this order:

1. **Explain it first, plain language before jargon.** What is this thing, what problem does it
   exist to solve, what breaks without it. Assume no prior knowledge of the specific technique.
   Shami will say when to skip ahead.
2. **Then the design.** What you are about to build and why this shape rather than the obvious
   alternative. Name the tradeoff out loud.
3. **Then build in small reviewable pieces.** One idea per step. Stop and check before moving on.
4. **Leave the interesting decisions to Shami.** Offer the choice rather than picking silently.
   If a decision is worth understanding, it is worth Shami making.

Do not deliver a finished implementation in one pass, even if asked to just build it. Ask which
part Shami wants to write, and hand that part over.

Explaining an error is part of the work. When something breaks, say what the error actually means
before fixing it.

**Append to \`NOTES.md\` the moment something is surprising**, including your own wrong
predictions and anything that broke unexpectedly. Do not wait to be asked, and do not tidy it up.
The site's "what surprised me" beat is written weeks later from that file, and whatever is not
captured at the time is simply lost.

## Why this shape

The writeup on the site has a beat called "what surprised me". If Claude builds the whole thing
unattended, that beat is empty and the project had no point. The surprises are the deliverable.

## Style

Never use an em dash (\`—\`) anywhere: code, comments, commit messages, or prose.
`;

// Beat 3 on the site is written at the end, about things that happened at the
// start. That is a memory problem, not a discipline problem, so catch them here
// as they land. Never published; the site gets the selected version.
const notes = `# Notes: ${title}

Running log of surprises, dead ends and things that did not work as expected.
Append the moment something is unexpected, do not wait. Newest at the bottom.

This is raw material for the "what surprised me" beat on
[shamirai.ai](https://shamirai.ai/e/${slug}/). It is not published, so it does
not need to be tidy, fair, or well written.

---
`;

await writeFile(join(dir, 'README.md'), readme, 'utf8');
await writeFile(join(dir, 'CLAUDE.md'), claudeMd, 'utf8');
await writeFile(join(dir, 'NOTES.md'), notes, 'utf8');
await writeFile(join(dir, '.gitignore'), 'node_modules/\n.env\n.DS_Store\ndist/\n', 'utf8');

run('git', ['init', '-q'], dir);
run('git', ['add', '-A'], dir);
run('git', ['-c', 'user.useConfigOnly=false', 'commit', '-q', '-m', `Initial commit: ${title}`], dir);

console.log(`Creating github.com/${owner}/${slug} (${isPrivate ? 'private' : 'public'})`);
run(
  'gh',
  [
    'repo',
    'create',
    slug,
    isPrivate ? '--private' : '--public',
    '--source=.',
    '--remote=origin',
    '--push',
    '--description',
    summary || title,
  ],
  dir,
);

// --- wire the node back to the repo -----------------------------------------
let next = raw.replace(/^(cluster: .*)$/m, `$1\nrepo: https://github.com/${owner}/${slug}`);
let flipped = false;
if (/^state:\s*learning\s*$/m.test(next)) {
  next = next.replace(/^state:\s*learning\s*$/m, 'state: executing');
  flipped = true;
}

// A learning stub has no body. Once it is executing it needs the beats, or the
// entry renders the "nothing written yet" message that belongs to learning.
// Beat 1 gets answered before building, not after: a question retrofitted to
// match what you happened to find is not a question.
if (!next.split(/^---$/m)[2]?.trim()) {
  next = next.trimEnd() + `

## The question

## What I built

## What surprised me

## What I'd do differently
`;
}
await writeFile(entryPath, next, 'utf8');

console.log(`\n  repo      https://github.com/${owner}/${slug}`);
console.log(`  local     ${dir}`);
console.log(`  node      src/content/entries/${slug}.md${flipped ? '  (learning -> executing)' : ''}`);
console.log(`\nNext:`);
console.log(`  1. commit the site change, push, and the map updates`);
console.log(`  2. open a NEW conversation in ${dir} and build it`);
console.log(`  3. come back here to write the five beats and flip to reported`);
