export interface MapNode {
  slug: string;
  label: string;
  state: 'learning' | 'executing' | 'reported';
  cluster: string;
  x: number;
  y: number;
}

/**
 * Edges are derived from position rather than authored.
 *
 * That's deliberate: it means the graph can never contradict the layout, and
 * adding an entry never requires deciding what it connects to. Each node links
 * to its k nearest neighbours; pairs are deduped so an edge is drawn once.
 *
 * With embeddings in place these lines are meaningful (near in 2D ≈ near in
 * meaning). Without them they read as cluster membership, which is also true,
 * just less interesting.
 */
export function nearestEdges(nodes: MapNode[], k = 2): [number, number][] {
  const seen = new Set<string>();
  const edges: [number, number][] = [];

  nodes.forEach((n, i) => {
    const ranked = nodes
      .map((m, j) => ({ j, d: (m.x - n.x) ** 2 + (m.y - n.y) ** 2 }))
      .filter((r) => r.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, k);

    for (const { j } of ranked) {
      const key = i < j ? `${i}:${j}` : `${j}:${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([i, j]);
    }
  });

  return edges;
}
