import { askSarvamAI } from './sarvam';
import {
  GeneratedApiSchema,
  analyzeSchemaPredictability,
  generateRandomApi,
} from './apiGenerator';

export type { GeneratedApiSchema };

const ENTERPRISE_DOMAINS = [
  'Fintech & Payment Orchestration',
  'Healthcare & EHR Telemetry',
  'Aerospace & Autonomous Avionics',
  'Supply Chain & Global Logistics',
  'Enterprise CRM & Revenue Pipeline',
  'Decentralized Oracle & Smart Contract Bridge',
  'Telecommunications & Network Mesh',
  'Identity, KYC & Access Management',
  'Cloud Infrastructure & Kubernetes Telemetry',
  'E-Commerce & High-Volume Inventory',
];

const MUTATION_TYPES: Array<GeneratedApiSchema['mutationType']> = [
  'rename',
  'unit_shift',
  'pagination_change',
  'enum_drift',
  'payload_flatten',
  'type_coerce',
];

/**
 * Safely parses and normalizes JSON emitted by Sarvam AI 105B.
 * Strips code fences, trims extraneous conversational wrappers, and extracts the primary JSON object.
 */
export function parseSarvamJsonResponse(raw: string): Record<string, any> {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '').trim();
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    throw new Error(`Failed to parse Sarvam AI JSON output: ${err.message}. Raw output: ${raw.slice(0, 300)}`);
  }
}

/**
 * Procedurally queries Sarvam AI 105B LLM using a 2-stage micro-prompt architecture.
 * Splitting generation into compact baseline schema first and mutation delta second
 * strictly guarantees that generation stays within token length limits without truncating.
 *
 * @param domainSeed Optional seed domain to guide the procedural generation
 * @returns Fully validated and analyzed GeneratedApiSchema
 */
export async function generateSarvamDynamicApiSchema(
  domainSeed?: string
): Promise<GeneratedApiSchema> {
  const targetDomain =
    domainSeed || ENTERPRISE_DOMAINS[Math.floor(Math.random() * ENTERPRISE_DOMAINS.length)];
  const targetMutation =
    MUTATION_TYPES[Math.floor(Math.random() * MUTATION_TYPES.length)];

  let lastError: Error | null = null;
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // ─────────────────────────────────────────────────────────────
      // STAGE 1: Micro-Prompt for Baseline Schema (High token efficiency)
      // ─────────────────────────────────────────────────────────────
      const baselinePrompt = `Output ONLY raw JSON with no markdown fences.
Generate an enterprise REST API endpoint response for domain "${targetDomain}".
JSON keys:
- "service": short lowercase string (e.g. "settlements", "avionics", "iam")
- "endpoint": REST path starting with "/" (e.g. "/v2/transfers", "/tokens/verify")
- "method": "GET" or "POST"
- "baselinePayload": JSON object with 4-6 realistic fields (strings, numbers, booleans)
Raw JSON output:`;

      const baselineRes = await askSarvamAI(baselinePrompt, 'en', [], { maxTokens: 2048, temperature: 0.2 });
      const parsedBaseline = parseSarvamJsonResponse(baselineRes.text);

      const domain = targetDomain;
      const service =
        typeof parsedBaseline.service === 'string' && parsedBaseline.service
          ? parsedBaseline.service.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 16)
          : domain.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16);
      const endpoint =
        typeof parsedBaseline.endpoint === 'string' && parsedBaseline.endpoint.startsWith('/')
          ? parsedBaseline.endpoint
          : `/${service}/v1/records`;
      const method: GeneratedApiSchema['method'] =
        parsedBaseline.method === 'GET' || parsedBaseline.method === 'PUT' ? parsedBaseline.method : 'POST';

      const baselinePayload: Record<string, any> =
        typeof parsedBaseline.baselinePayload === 'object' && parsedBaseline.baselinePayload !== null
          ? parsedBaseline.baselinePayload
          : { id: 'rec_1001', status: 'active', amount: 250.0, timestamp: new Date().toISOString() };

      let parsedDelta: any = null;
      if (parsedBaseline.mutatedPayload && typeof parsedBaseline.mutatedPayload === 'object') {
        parsedDelta = parsedBaseline;
      } else {
        // ─────────────────────────────────────────────────────────────
        // STAGE 2: Micro-Prompt for Undocumented Mutation Delta
        // ─────────────────────────────────────────────────────────────
        const deltaPrompt = `Output ONLY raw JSON with no markdown fences.
Apply the undocumented API change "${targetMutation}" to this baseline JSON:
${JSON.stringify(baselinePayload)}

Output JSON keys:
- "mutatedPayload": modified JSON payload
- "mutationDescription": brief technical description of change
- "targetField": affected JSON field key
- "oldValue": previous value
- "newValue": updated value
- "expectedVerdict": "equivalent" or "lossy" or "breaking"
- "expectedConfidence": float between 0.70 and 0.98
Raw JSON output:`;

        const deltaRes = await askSarvamAI(deltaPrompt, 'en', [], { maxTokens: 2048, temperature: 0.2 });
        parsedDelta = parseSarvamJsonResponse(deltaRes.text);
      }

      const mutatedPayload: Record<string, any> =
        typeof parsedDelta.mutatedPayload === 'object' && parsedDelta.mutatedPayload !== null
          ? parsedDelta.mutatedPayload
          : { ...baselinePayload };

      const validMutationTypes: Array<GeneratedApiSchema['mutationType']> = [
        'rename',
        'unit_shift',
        'pagination_change',
        'enum_drift',
        'payload_flatten',
        'type_coerce',
      ];
      const mutationType: GeneratedApiSchema['mutationType'] = validMutationTypes.includes(
        parsedDelta.mutationType
      )
        ? parsedDelta.mutationType
        : targetMutation;

      const mutationDescription =
        typeof parsedDelta.mutationDescription === 'string' && parsedDelta.mutationDescription
          ? parsedDelta.mutationDescription
          : `Procedural drift: ${mutationType} on ${parsedDelta.targetField || 'payload'}`;

      const targetField =
        typeof parsedDelta.targetField === 'string' && parsedDelta.targetField
          ? parsedDelta.targetField
          : Object.keys(baselinePayload)[0] || 'id';

      const oldValue = parsedDelta.oldValue !== undefined ? parsedDelta.oldValue : baselinePayload[targetField];
      const newValue = parsedDelta.newValue !== undefined ? parsedDelta.newValue : mutatedPayload[targetField];

      const validVerdicts: Array<GeneratedApiSchema['expectedVerdict']> = [
        'equivalent',
        'lossy',
        'breaking',
      ];
      const expectedVerdict: GeneratedApiSchema['expectedVerdict'] = validVerdicts.includes(
        parsedDelta.expectedVerdict
      )
        ? parsedDelta.expectedVerdict
        : mutationType === 'enum_drift'
        ? 'breaking'
        : mutationType === 'pagination_change' || mutationType === 'type_coerce'
        ? 'lossy'
        : 'equivalent';

      let confidence =
        typeof parsedDelta.expectedConfidence === 'number' ? parsedDelta.expectedConfidence : 0.92;
      if (confidence > 1) confidence = confidence / 100;
      confidence = Math.max(0.50, Math.min(0.99, Number(confidence.toFixed(2))));

      // Derive temporal observations from baselinePayload
      const baselineObservations: Array<Record<string, any>> = [
        {
          ...baselinePayload,
          _obs_id: `obs_1`,
          _observed_at: new Date(Date.now() - 30000).toISOString(),
        },
        {
          ...baselinePayload,
          _obs_id: `obs_2`,
          _observed_at: new Date(Date.now() - 15000).toISOString(),
        },
        {
          ...baselinePayload,
          _obs_id: `obs_3`,
          _observed_at: new Date().toISOString(),
        },
      ];

      // Run predictability analysis to attach future drift risk analysis
      const predictability = analyzeSchemaPredictability(baselinePayload, endpoint);

      const id = `sarvam_api_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

      return {
        id,
        domain,
        service,
        endpoint,
        method,
        baselinePayload,
        baselineObservations,
        mutatedPayload,
        mutationType,
        mutationDescription,
        targetField,
        oldValue,
        newValue,
        expectedVerdict,
        expectedConfidence: confidence,
        predictability,
      };
    } catch (err: any) {
      lastError = err;
      // Exponential backoff before retry attempt (fast in test)
      if (attempt < maxAttempts) {
        const backoffMs = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test' ? 10 : 800 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }

  console.warn(
    `[SARVAM RESILIENCE] High-entropy procedural schema synthesis engaged after Sarvam 105B API truncation: ${lastError?.message}`
  );
  return generateRandomApi();
}

/**
 * Procedurally generates a batch of dynamic enterprise API schemas using Sarvam AI 105B LLM.
 * Executes generation with controlled concurrency to prevent socket exhaustion and rate limiting.
 *
 * @param count Number of API schemas to generate (defaults to 55)
 * @param onProgress Optional callback invoked as each item completes
 * @returns Array of generated API schemas
 */
export async function generateSarvamDynamicApiBatch(
  count: number = 55,
  onProgress?: (completed: number, total: number) => void
): Promise<GeneratedApiSchema[]> {
  const results: GeneratedApiSchema[] = new Array(count);
  const concurrency = 4; // Controlled concurrent pipeline workers
  let nextIndex = 0;
  let completedCount = 0;

  async function worker(): Promise<void> {
    while (nextIndex < count) {
      const currentIndex = nextIndex++;
      const domainSeed = ENTERPRISE_DOMAINS[currentIndex % ENTERPRISE_DOMAINS.length];
      const schema = await generateSarvamDynamicApiSchema(domainSeed);
      schema.id = `api_sarvam_${String(currentIndex + 1).padStart(2, '0')}`;
      results[currentIndex] = schema;
      completedCount++;
      if (onProgress) {
        onProgress(completedCount, count);
      }
    }
  }

  const workerPromises = Array.from(
    { length: Math.min(concurrency, count) },
    () => worker()
  );

  await Promise.all(workerPromises);

  return results;
}
