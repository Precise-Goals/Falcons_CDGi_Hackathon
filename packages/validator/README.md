# @intra/validator

Golden Replay Harness & Wald Sequential Probability Ratio Test (SPRT) Canary Verification.

## Overview

`@intra/validator` provides mathematical certainty that synthesized compatibility adapters maintain exact behavioral equivalence under live traffic.

```
                  Synthesized Adapter
                           │
                           ▼
               ┌───────────────────────┐
               │ Golden Vector Replay  │  (100+ Deterministic Regression Vectors)
               └───────────┬───────────┘
                           ▼
               ┌───────────────────────┐
               │ Wald SPRT Canary Guard│  (Sequential Hypothesis Testing)
               └───────────┬───────────┘
                           ▼
               ┌───────────────────────┐
               │ Divergence Metrics    │  (Wasserstein W1 + Kolmogorov-Smirnov D)
               └───────────┬───────────┘
                           ▼
               ┌───────────────────────┐
               │ Replay Certificate    │  (Tamper-evident verification stamp)
               └───────────────────────┘
```

## Mathematical Foundations: Wald SPRT

### 1. Hypothesis Formulation
Let $X_1, X_2, \dots, X_m$ be independent Bernoulli observations where $X_i = 1$ denotes a canary failure and $X_i = 0$ denotes success.
- **Null Hypothesis ($H_0$)**: $p \le p_0$ (Adapter is safe and conforms to baseline, e.g. $p_0 = 0.01$).
- **Alternative Hypothesis ($H_1$)**: $p \ge p_1$ (Adapter introduces degradation, e.g. $p_1 = 0.05$).

### 2. Log-Likelihood Ratio Accumulation
$$\Lambda_m = \sum_{i=1}^m z_i = k \ln \left(\frac{p_1}{p_0}\right) + (m - k) \ln \left(\frac{1 - p_1}{1 - p_0}\right)$$
where $k$ is the number of observed errors in $m$ trials.

### 3. Stopping Boundaries
Given Type I error tolerance $\alpha$ (false alarm) and Type II error tolerance $\beta$ (missed regression):
$$A = \frac{1 - \beta}{\alpha}, \quad B = \frac{\beta}{1 - \alpha}$$
- If $\Lambda_m \ge \ln A$: Reject $H_0$, accept $H_1$ $\rightarrow$ **Trigger Immediate Rollback**.
- If $\Lambda_m \le \ln B$: Accept $H_0$, reject $H_1$ $\rightarrow$ **Promote Canary to Production**.
- If $\ln B < \Lambda_m < \ln A$: Indeterminate $\rightarrow$ **Continue Sampling**.

## Sub-Modules

1. `GoldenReplayHarness` (`golden.ts`): Replays suites of vectors against adapters, computing pass rates and pinpointing failures.
2. `WaldSPRT` (`sprt.ts`): Sequential ratio calculator with analytical Average Sample Number (ASN) forecasting.
3. `CanaryGuard` (`canary.ts`): Automated circuit breaker that dispatches rollback handles upon Wald boundary breach.
4. `computeWasserstein1D` & `computeKolmogorovSmirnov` (`divergence.ts`): Distribution divergence tests for latency degradation.
5. `issueReplayCertificate` (`certificate.ts`): Produces tamper-evident certification records with signature hashes.
