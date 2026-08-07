/**
 * Clusters do two jobs:
 *   1. They give the map a sane layout before any embeddings exist.
 *   2. They stay as a coarse grouping you can filter by later.
 *
 * Centres are in normalised space: roughly -1..1 on both axes, 0,0 = middle.
 * Add a cluster here before using it in frontmatter.
 */
export const CLUSTERS: Record<string, { label: string; center: [number, number] }> = {
  agents: { label: 'agent architectures', center: [-0.52, -0.30] },
  harness: { label: 'harness & loops', center: [-0.06, -0.50] },
  retrieval: { label: 'retrieval', center: [0.36, -0.42] },
  evals: { label: 'evaluation', center: [0.50, 0.30] },
  runtime: { label: 'runtime & infra', center: [-0.44, 0.44] },
  protocol: { label: 'protocol & tooling', center: [0.02, 0.04] },
};

export const DEFAULT_CENTER: [number, number] = [0, 0];

export function clusterLabel(key: string): string {
  return CLUSTERS[key]?.label ?? key;
}
