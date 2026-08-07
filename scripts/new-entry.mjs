#!/usr/bin/env node
/**
 * Adds an entry. One command, one file, no design decisions.
 *
 *   npm run new -- "Agent trajectory eval"
 *   npm run new -- "Agent trajectory eval" --cluster evals --state executing
 *
 * A `learning` entry is frontmatter only — it exists to mark a gap on the map.
 * Anything further along gets the five beats pre-written so the blank page is
 * never actually blank.
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'src/content/entries');

const argv = process.argv.slice(2);
const flags = {};
const words = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[++i];
  else words.push(argv[i]);
}

const title = words.join(' ').trim();
if (!title) {
  console.error('usage: npm run new -- "Some title" [--state learning|executing|reported] [--cluster key]');
  process.exit(1);
}

const state = flags.state ?? 'learning';
const cluster = flags.cluster ?? 'agents';

if (!['learning', 'executing', 'reported'].includes(state)) {
  console.error(`unknown state "${state}" — use learning, executing, or reported`);
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .replace(/['']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const today = new Date().toISOString().slice(0, 10);

const front = [
  '---',
  `title: ${JSON.stringify(title)}`,
  `state: ${state}`,
  `cluster: ${cluster}`,
  // Left empty on purpose: an empty summary renders as nothing, but sitting
  // there in the file it's an obvious blank to fill. It's also most of what the
  // embedding has to work with until the entry is written up.
  'summary: ""',
  state === 'reported' ? `date: ${today}` : null,
  state === 'learning' ? null : '# repo: https://github.com/you/repo',
  state === 'learning' ? null : '# live: https://example.com',
  '---',
].filter(Boolean).join('\n');

const beats = `
## The question

What do I actually not understand here? Write it as a question with a wrong answer possible.

## What I built

## What surprised me

## What I'd do differently
`;

const body = state === 'learning' ? '' : beats;
const path = join(DIR, `${slug}.md`);

await mkdir(DIR, { recursive: true });
try {
  await access(path);
  console.error(`refusing to overwrite: src/content/entries/${slug}.md already exists`);
  process.exit(1);
} catch {
  // doesn't exist — good
}

await writeFile(path, `${front}\n${body}`, 'utf8');
console.log(`src/content/entries/${slug}.md`);
