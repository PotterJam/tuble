import type { TubeGraph, RouteSegment, RouteHint } from "./types";
import graphData from "../data/tube-graph.json";

const graph: TubeGraph = graphData as TubeGraph;

export { graph };

interface DijkstraNode {
  stationId: string;
  line: string | null; // the line we arrived on
  cost: number;
  parent: DijkstraNode | null;
}

/** Min-heap keyed on node.cost */
class MinHeap {
  private heap: DijkstraNode[] = [];

  get size() {
    return this.heap.length;
  }

  push(node: DijkstraNode) {
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): DijkstraNode {
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[i].cost >= this.heap[parent].cost) break;
      [this.heap[i], this.heap[parent]] = [this.heap[parent], this.heap[i]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    const n = this.heap.length;
    while (true) {
      let smallest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      if (left < n && this.heap[left].cost < this.heap[smallest].cost)
        smallest = left;
      if (right < n && this.heap[right].cost < this.heap[smallest].cost)
        smallest = right;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}

/**
 * Dijkstra shortest path from `fromId` to `toId`.
 * Each stop costs 1, and each line change costs an additional 1.
 * Throws if no path exists. Returns a RouteHint with segments collapsed by line.
 */
export function findRoute(fromId: string, toId: string): RouteHint {
  if (fromId === toId) {
    return { segments: [], totalStops: 0 };
  }

  if (!graph.adjacency[fromId]) {
    throw new Error(`Unknown station: ${fromId}`);
  }
  if (!graph.adjacency[toId]) {
    throw new Error(`Unknown station: ${toId}`);
  }

  // State: (stationId, line) — arriving at the same station on different lines
  // are distinct states so we can correctly cost line changes.
  const best = new Map<string, number>();
  const stateKey = (stationId: string, line: string | null) =>
    `${stationId}:${line ?? "*"}`;

  const queue = new MinHeap();
  queue.push({ stationId: fromId, line: null, cost: 0, parent: null });
  best.set(stateKey(fromId, null), 0);

  while (queue.size > 0) {
    const current = queue.pop();

    // When we pop the target, this is guaranteed optimal
    if (current.stationId === toId) {
      return buildHint(current);
    }

    // Skip if we've already settled a better path to this state
    const key = stateKey(current.stationId, current.line);
    if (current.cost > (best.get(key) ?? Infinity)) continue;

    for (const edge of graph.adjacency[current.stationId] ?? []) {
      const isChange =
        current.line !== null && current.line !== edge.line;
      const nextCost = current.cost + 1 + (isChange ? 1.5 : 0);

      const nextKey = stateKey(edge.to, edge.line);
      if (nextCost < (best.get(nextKey) ?? Infinity)) {
        best.set(nextKey, nextCost);
        queue.push({
          stationId: edge.to,
          line: edge.line,
          cost: nextCost,
          parent: current,
        });
      }
    }
  }

  throw new Error(`No route found from ${fromId} to ${toId}`);
}

function buildHint(node: DijkstraNode): RouteHint {
  // Walk back to reconstruct path edges
  const edges: { line: string; stationId: string }[] = [];
  let current: DijkstraNode | null = node;
  while (current && current.line !== null) {
    edges.push({ line: current.line, stationId: current.stationId });
    current = current.parent;
  }
  edges.reverse();

  // Collapse consecutive edges on the same line into segments
  const segments: RouteSegment[] = [];
  for (const edge of edges) {
    const last = segments[segments.length - 1];
    if (last && last.line === edge.line) {
      last.stops++;
      last.endStationId = edge.stationId;
    } else {
      segments.push({ line: edge.line, stops: 1, endStationId: edge.stationId });
    }
  }

  const totalStops = edges.length;
  return { segments, totalStops };
}

/**
 * Get all station IDs.
 */
export function getAllStationIds(): string[] {
  return Object.keys(graph.stations);
}

/**
 * Get station name by ID.
 */
export function getStationName(id: string): string | undefined {
  return graph.stations[id]?.name;
}
