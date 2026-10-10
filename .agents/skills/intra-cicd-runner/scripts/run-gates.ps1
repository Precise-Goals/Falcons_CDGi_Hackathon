#!/usr/bin/env pwsh
Write-Host "=== Running G1: Typecheck ===" -ForegroundColor Cyan
pnpm -w typecheck
if ($LASTEXITCODE -ne 0) { Write-Error "G1 Failed"; exit 1 }

Write-Host "=== Running G2 & G3: Unit Tests ===" -ForegroundColor Cyan
pnpm -w test
if ($LASTEXITCODE -ne 0) { Write-Error "G3 Failed"; exit 1 }

Write-Host "=== Running G9: E2E Demonstration ===" -ForegroundColor Cyan
pnpm exec vitest run tests/e2e/demo.spec.ts
if ($LASTEXITCODE -ne 0) { Write-Error "G9 Failed"; exit 1 }

Write-Host "=== All Quality Gates Passed Successfully ===" -ForegroundColor Green
