/**
 * A deterministic mark per entry, derived only from its title.
 *
 * Same title always produces the same sigil, so you never choose artwork and
 * never store an image. Construction rules are shared across every mark, which
 * is what makes them read as a family rather than as noise.
 */

type State = 'learning' | 'executing' | 'reported';

const INK: Record<State, string> = {
  learning: 'rgba(122,119,113,',
  executing: 'rgba(216,161,58,',
  reported: 'rgba(233,230,225,',
};

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

export function drawSigil(cv: HTMLCanvasElement, title: string, state: State): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const S = cv.clientWidth || 54;
  cv.width = S * dpr;
  cv.height = S * dpr;

  const g = cv.getContext('2d');
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);

  const R = rng(hash(title));
  const cx = S / 2,
    cy = S / 2,
    max = S * 0.4;
  const ink = INK[state];

  // concentric arc fragments
  const arcs = 2 + Math.floor(R() * 2);
  for (let i = 0; i < arcs; i++) {
    const r = max * (0.42 + (0.58 * (i + 1)) / arcs);
    const a0 = R() * Math.PI * 2;
    const span = Math.PI * (0.45 + R() * 1.25);
    g.beginPath();
    g.arc(cx, cy, r, a0, a0 + span);
    g.strokeStyle = `${ink}${0.3 + (0.28 * i) / arcs})`;
    g.lineWidth = 1;
    g.stroke();
  }

  // points on a ring, joined by chords
  const k = 3 + Math.floor(R() * 4);
  const rot = R() * Math.PI * 2;
  const pts: [number, number][] = [];
  for (let i = 0; i < k; i++) {
    const a = rot + i * ((Math.PI * 2) / k) + (R() - 0.5) * 0.5;
    const r = max * (0.55 + R() * 0.45);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  g.strokeStyle = `${ink}0.55)`;
  g.lineWidth = 1;
  for (let i = 0; i < k; i++) {
    const j = (i + 1 + Math.floor(R() * (k - 1))) % k;
    g.beginPath();
    g.moveTo(pts[i]![0], pts[i]![1]);
    g.lineTo(pts[j]![0], pts[j]![1]);
    g.stroke();
  }

  // radial ticks
  const ticks = 2 + Math.floor(R() * 3);
  for (let i = 0; i < ticks; i++) {
    const a = R() * Math.PI * 2;
    g.beginPath();
    g.moveTo(cx + Math.cos(a) * max * 0.92, cy + Math.sin(a) * max * 0.92);
    g.lineTo(cx + Math.cos(a) * max * 1.12, cy + Math.sin(a) * max * 1.12);
    g.strokeStyle = `${ink}0.4)`;
    g.lineWidth = 1;
    g.stroke();
  }

  for (const [x, y] of pts) {
    g.beginPath();
    g.arc(x, y, state === 'reported' ? 2.1 : 1.7, 0, 7);
    g.fillStyle = `${ink}${state === 'learning' ? '0.7' : '0.95'})`;
    g.fill();
  }

  g.beginPath();
  g.arc(cx, cy, 1.6, 0, 7);
  g.fillStyle = `${ink}0.9)`;
  g.fill();
}
