# @intra/impact

AST-driven Blast Radius & Dependency Tracing Engine for Autonomous Safe-Handling.

## Overview

`@intra/impact` computes the deterministic blast radius of upstream API drifts by combining TypeScript Compiler API Abstract Syntax Tree (AST) inspection, downstream call graph reachability analysis, and domain-criticality heuristics.

```
       Upstream Drift (Change)
                 │
                 ▼
     ┌────────────────────────┐
     │ AST Property Extraction│  (TypeScript Compiler API AST visitor)
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ Call Graph Dependency  │  (Multi-hop BFS downstream reachability)
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ Criticality Elevation  │  (Financial / payment route annotator)
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ Source Range Formatter │  (GitHub L42-L50 linkable diagnostics)
     └────────────────────────┘
```

## Performance & Complexity Guarantees

| Component | Mechanism | Computational Complexity | Memory Footprint |
| :--- | :--- | :--- | :--- |
| **AST Property Visitor** | `extractPropertyAccesses` | $O(N)$ where $N$ is AST nodes | $O(D)$ recursion depth ($D \le 64$) |
| **Call Graph Tracer** | `CallGraphTracer.traceDownstream` | $O(V + E)$ BFS traversal | $O(V)$ visited node Set |
| **Path Reachability** | `CallGraphTracer.findHopChain` | $O(V + E)$ shortest-path BFS | $O(V)$ predecessor tracking |
| **Criticality Scoring** | `annotateCriticality` | $O(1)$ substring lookup | $O(1)$ stack allocation |
| **Location Parsing** | `parseSourceLocation` | $O(1)$ regex match | $O(1)$ range tuple |

## Key Exports

- `ImpactAnalyzer`: Orchestrates workflow registry, change matching, and severity computation.
- `extractPropertyAccesses(sourceText, targetVariables)`: Traverses AST to find dot-access and destructuring occurrences.
- `CallGraphTracer`: Manages directed dependency graphs and hop chain path queries.
- `formatSourceLocation(filePath, startLine, endLine)`: Formats range links compatible with GitHub and VS Code (`#L42-L50`).
- `generateImpactSummary(impacts)`: Aggregates individual impact verdicts into JSON summaries.
