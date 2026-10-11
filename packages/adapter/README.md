# @intra/adapter

Autonomous FlashFill PBE Adapter Synthesis & Compatibility Engine.

## Overview

`@intra/adapter` synthesizes zero-downtime compatibility layers for drifting API endpoints. It implements Programming-By-Example (PBE) with inductive program synthesis, numerical currency scaling, dot-path object restructuring, and bi-directional request-response transforms.

```
       Change Spec / Examples
                 │
                 ▼
     ┌────────────────────────┐
     │  PBESynthesizer (PBE)  │  (Depth-2 Occam Shortest Program Search)
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ 80/20 Train/Test Split │  (Empirical Generalization Verification)
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ Reshape & Scaling Core │  (Currency cents<->dollars, flat<->nested)
     └───────────┬────────────┘
                 ▼
     ┌────────────────────────┐
     │ TypeScript Codegen     │  (Zero-dependency standalone adapter module)
     └────────────────────────┘
```

## Mathematical Complexity & Guarantees

| Operation | Complexity Bound | Description |
| :--- | :--- | :--- |
| **Depth-0 Search** | $O(1)$ | Identity and constant evaluation |
| **Depth-1 Primitives** | $O(M)$ candidates ($M \le 50$) | Atomic string/number transforms, substring slices |
| **Depth-2 Combinators** | $O(M^2)$ compositions | Sequential $g(f(x))$ and binary `concat` combinators |
| **Train/Test Verification** | $O(K \times N)$ | $80\%$ train fitting + $20\%$ out-of-sample holdout test |
| **Schema Reshaping** | $O(F)$ where $F = \text{fields}$ | Dot-path property traversal without recursion blowup |
| **Floating Precision** | $O(1)$ IEEE-754 guard | Epsilon-adjusted decimal rounding eliminates drift |

## Sub-Modules

1. `PBESynthesizer` (`pbe.ts`): FlashFill inductive program search ordered by Occam's razor complexity.
2. `CurrencyUnitConverter` (`units.ts`): Cents/dollars scaling, basis point ratios, and ratio detection.
3. `SchemaReshape` (`reshape.ts`): Flat-to-nested envelope restructuring and mapping inversion.
4. `BiDirectionalAdapter` (`bidirectional.ts`): Dual request/response transform pairing with inverter.
5. `generateAdapterSourceCode` (`codegen.ts`): Emits standalone, runnable TypeScript adapter code and Vitest suites.
