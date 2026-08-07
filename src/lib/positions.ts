import { CLUSTERS, DEFAULT_CENTER } from './clusters';
import learned from '../data/positions.json';

/**
 * Where a node sits on the map, resolved in three layers, most specific first:
 *
 *   1. `position` in the entry's frontmatter  — manual override, always wins
 *   2. src/data/positions.json                — written by `npm run embed`
 *   3. deterministic scatter around a cluster — works with zero setup
 *
 * Layer 3 means the map is never broken or empty, even on a fresh clone with no
 * Cloudflare credentials. Layer 1 exists because embeddings will occasionally
 * put something somewhere that reads wrong to a human, and arguing with a
 * projection is a bad use of an evening.
 */

/**
 * positions.json is generated, so its shape is asserted rather than trusted.
 * Narrowing here instead of casting means a malformed or truncated entry is
 * dropped and falls through to the cluster layout, rather than becoming a node
 * at NaN that silently vanishes off the edge of the map.
 */
const LEARNED: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(learned as Record<string, unknown>).flatMap(([slug, value]) => {
    if (!Array.isArray(value) || value.length !== 2) return [];
    const [x, y] = value;
    if (typeof x !== 'number' || typeof y !== 'number') return [];
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    return [[slug, [x, y] as [number, number]]];
  }),
);

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function resolveOne(
  slug: string,
  cluster: string,
  override?: [number, number],
): { at: [number, number]; pinned: boolean } {
  if (override) return { at: override, pinned: true };

  const fromEmbeddings = LEARNED[slug];
  if (fromEmbeddings) return { at: fromEmbeddings, pinned: false };

  const center = CLUSTERS[cluster]?.center ?? DEFAULT_CENTER;
  const r = rng(hash(slug));
  const angle = r() * Math.PI * 2;
  const dist = 0.12 + r() * 0.2;
  return {
    at: [center[0] + Math.cos(angle) * dist, center[1] + Math.sin(angle) * dist * 0.8],
    pinned: false,
  };
}

/**
 * Nudge nodes apart until nothing is closer than `min`.
 *
 * This is presentation overriding data, applied deliberately and last: two
 * entries being near-identical in embedding space is true but unreadable, and a
 * map you can't read tells you nothing. Manually pinned nodes never move —
 * if you set a position in frontmatter, you meant it.
 */
function declump(
  pts: { at: [number, number]; pinned: boolean }[],
  min = 0.15,
  iterations = 240,
): void {
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i]!;
        const b = pts[j]!;
        if (a.pinned && b.pinned) continue;
        let dx = b.at[0] - a.at[0];
        let dy = b.at[1] - a.at[1];
        let dist = Math.hypot(dx, dy);
        if (dist > min) continue;
        if (dist < 1e-6) {
          dx = Math.cos(i * 2.4) * 1e-3;
          dy = Math.sin(i * 2.4) * 1e-3;
          dist = Math.hypot(dx, dy);
        }
        const ux = dx / dist;
        const uy = dy / dist;
        // A pinned partner absorbs none of the push, so the free node takes it all.
        const total = (min - dist) * 0.5;
        const aShare = a.pinned ? 0 : b.pinned ? total : total / 2;
        const bShare = b.pinned ? 0 : a.pinned ? total : total / 2;
        a.at[0] -= ux * aShare;
        a.at[1] -= uy * aShare;
        b.at[0] += ux * bShare;
        b.at[1] += uy * bShare;
      }
    }
  }
}

export interface Placeable {
  slug: string;
  cluster: string;
  position?: [number, number];
}

/** Resolve every node's position together — spacing is a property of the set. */
export function layoutNodes<T extends Placeable>(items: T[]): Map<string, [number, number]> {
  const resolved = items.map((i) => resolveOne(i.slug, i.cluster, i.position));
  declump(resolved);
  return new Map(items.map((item, i) => [item.slug, resolved[i]!.at]));
}

export function hasEmbeddings(): boolean {
  return Object.keys(LEARNED).length > 0;
}
