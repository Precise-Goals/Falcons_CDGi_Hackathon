/**
 * Call Graph Downstream Dependency Tracer
 * Multi-hop blast-radius reachability and topological chain computation.
 * Zero external dependencies.
 */

export class CallGraphTracer {
  private adjacency: Map<string, Set<string>> = new Map();

  /**
   * Registers a directional dependency: `caller` -> `callee`.
   */
  public addEdge(caller: string, callee: string): void {
    if (!this.adjacency.has(caller)) {
      this.adjacency.set(caller, new Set());
    }
    this.adjacency.get(caller)!.add(callee);
  }

  /**
   * Traces all transitive downstream dependents reachable from `root`
   * using cycle-safe Breadth-First Search.
   */
  public traceDownstream(root: string): string[] {
    const visited = new Set<string>();
    const queue: string[] = [root];

    while (queue.length > 0) {
      const current = queue.shift()!;
      const neighbors = this.adjacency.get(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
    }

    return Array.from(visited);
  }

  /**
   * Computes the shortest hop chain path from `source` to `target`.
   * Returns null if unreachable.
   */
  public findHopChain(source: string, target: string): string[] | null {
    const queue: Array<{ node: string; path: string[] }> = [{ node: source, path: [source] }];
    const visited = new Set<string>([source]);

    while (queue.length > 0) {
      const { node, path } = queue.shift()!;
      if (node === target) return path;

      const neighbors = this.adjacency.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push({ node: neighbor, path: [...path, neighbor] });
          }
        }
      }
    }

    return null;
  }

  /**
   * Clears the graph.
   */
  public clear(): void {
    this.adjacency.clear();
  }
}
