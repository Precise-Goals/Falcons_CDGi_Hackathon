export interface PredictabilityFinding {
  category: 'Unit Shift' | 'Casing Drift' | 'Pagination Deprecation' | 'Enum Semantic Widening' | 'Envelope Flattening' | 'Type Coercion';
  probability: number; // 0 - 100
  target: string;
  predictedShift: string;
  rationale: string;
}

export interface PredictabilityAnalysis {
  score: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: PredictabilityFinding[];
}

export interface GeneratedApiSchema {
  id: string;
  domain: string;
  service: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT';
  baselinePayload: Record<string, any>;
  baselineObservations: Array<Record<string, any>>;
  mutatedPayload: Record<string, any>;
  mutationType: 'rename' | 'unit_shift' | 'pagination_change' | 'enum_drift' | 'payload_flatten' | 'type_coerce';
  mutationDescription: string;
  targetField: string;
  oldValue: any;
  newValue: any;
  expectedVerdict: 'equivalent' | 'lossy' | 'breaking';
  expectedConfidence: number;
  predictability: PredictabilityAnalysis;
}

const DOMAINS = [
  { name: 'FinTech Settlements', service: 'settlements', endpoints: ['/v2/transfers', '/v1/settlements/batch', '/v2/payouts'], method: 'POST' as const },
  { name: 'Logistics Telemetry', service: 'telemetry', endpoints: ['/fleet/v3/waypoints', '/parcels/v1/track', '/dispatch/v2/manifest'], method: 'GET' as const },
  { name: 'Vector Search Cloud', service: 'embeddings', endpoints: ['/v1/vectors/similarity', '/v2/indices/query', '/v1/embeddings/batch'], method: 'POST' as const },
  { name: 'Healthcare Cloud EHR', service: 'patients', endpoints: ['/api/v2/patient/vitals', '/claims/v1/eligibility', '/records/v3/timeline'], method: 'GET' as const },
  { name: 'E-Commerce Nexus', service: 'checkout', endpoints: ['/v4/orders/dispatch', '/v2/cart/checkout', '/v3/payments/charge'], method: 'POST' as const },
  { name: 'Autonomous Drone Grid', service: 'avionics', endpoints: ['/drones/v1/telemetry', '/airspace/v2/corridors', '/battery/v1/telemetry'], method: 'GET' as const },
  { name: 'Identity & Access Mesh', service: 'iam', endpoints: ['/tenants/v2/principals', '/auth/v1/tokens/verify', '/roles/v2/grants'], method: 'GET' as const },
  { name: 'IoT Energy Smart Grid', service: 'smartgrid', endpoints: ['/meters/v1/readings', '/grid/v3/feeders', '/solar/v2/generation'], method: 'POST' as const },
  { name: 'Media Transcoding Mesh', service: 'transcoder', endpoints: ['/jobs/v2/transcode', '/renditions/v1/manifest', '/codecs/v2/profiles'], method: 'POST' as const },
  { name: 'AI Model Gateway', service: 'gateway', endpoints: ['/models/v1/completions', '/agents/v2/chat', '/tokens/v1/rate_headroom'], method: 'POST' as const },
  { name: 'Multi-Tenant CRM Core', service: 'crm', endpoints: ['/leads/v2/qualify', '/accounts/v1/contacts', '/opportunities/v3/stage'], method: 'GET' as const },
  { name: 'Cyber Threat Telemetry', service: 'soc', endpoints: ['/soc/v1/threat_alerts', '/cve/v2/scans', '/firewalls/v1/rules'], method: 'POST' as const },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function analyzeSchemaPredictability(
  payload: Record<string, any>,
  endpoint: string
): PredictabilityAnalysis {
  const findings: PredictabilityFinding[] = [];

  // 1. Currency Float to Integer Cent subunits
  if (typeof payload.amount === 'number' && !Number.isInteger(payload.amount)) {
    findings.push({
      category: 'Unit Shift',
      probability: 94,
      target: '$.amount',
      predictedShift: `amount: ${payload.amount} -> ${Math.round(payload.amount * 100)} (integer subunits)`,
      rationale: 'Modern financial APIs standardize on smallest integer currency units to eliminate IEEE 754 floating point rounding drift.',
    });
  }

  // 2. Mixed Casing Normalization
  if (payload.customerId || payload.accountId || payload.userName || payload.orderId) {
    findings.push({
      category: 'Casing Drift',
      probability: 88,
      target: payload.customerId ? '$.customerId' : '$.userName',
      predictedShift: 'camelCase identifiers -> snake_case standardized keys',
      rationale: 'API mixes camelCase with snake_case. Schema governance engines routinely normalize payload keys to standard snake_case.',
    });
  }

  // 3. Offset/Page pagination deprecation
  if (payload.page !== undefined || payload.offset !== undefined || endpoint.includes('page=') || endpoint.includes('offset=')) {
    findings.push({
      category: 'Pagination Deprecation',
      probability: 92,
      target: '$.offset / $.page',
      predictedShift: 'offset/page numbering -> opaque keyset next_cursor',
      rationale: 'Offset pagination fails to scale on distributed sharded storage; vendor migrations systematically mandate keyset cursor schemes.',
    });
  }

  // 4. Loose string status enum semantic widening
  if (payload.status && typeof payload.status === 'string') {
    findings.push({
      category: 'Enum Semantic Widening',
      probability: 82,
      target: '$.status',
      predictedShift: 'status string enum absorbs unconstrained sub-states (e.g. pending_verification)',
      rationale: 'Unconstrained string status fields regularly expand into broader state machines, risking silent authorization bypasses.',
    });
  }

  // 5. Nested object envelope flattening
  if (payload.metadata && typeof payload.metadata === 'object' && payload.metadata.risk_score !== undefined) {
    findings.push({
      category: 'Envelope Flattening',
      probability: 76,
      target: '$.metadata',
      predictedShift: 'metadata.risk_score -> root-level risk_score attribute',
      rationale: 'Serverless event streaming fabrics prefer flat JSON envelopes for high-throughput stream consumer filtering.',
    });
  }

  // Calculate composite predictability score
  const score = findings.length > 0
    ? Math.round(findings.reduce((sum, f) => sum + f.probability, 0) / findings.length)
    : 85;

  let riskLevel: PredictabilityAnalysis['riskLevel'] = 'LOW';
  if (findings.some((f) => f.probability >= 90)) riskLevel = 'CRITICAL';
  else if (findings.some((f) => f.probability >= 80)) riskLevel = 'HIGH';
  else if (findings.length > 0) riskLevel = 'MEDIUM';

  return {
    score,
    riskLevel,
    findings,
  };
}

export function generateRandomApi(index: number = 1): GeneratedApiSchema {
  const domainInfo = randomItem(DOMAINS);
  const endpoint = randomItem(domainInfo.endpoints);
  const idNum = randomInt(1000, 9999);
  const randomCents = randomInt(1500, 99900) / 100;
  const uuid = Math.random().toString(36).substring(2, 10);

  // Base Schema fields
  const baselinePayload: Record<string, any> = {
    id: `rec_${idNum}`,
    transaction_uuid: `tx_${uuid}`,
    amount: randomCents,
    currency: 'USD',
    customer_name: randomItem(['Alex Chen', 'Priya Sharma', 'David Miller', 'Yuki Tanaka', 'Elena Rostova', 'Marcus Vance', 'Sophia Laurent']),
    customerId: `cus_${randomInt(100, 999)}`,
    account_id: `acc_${randomInt(100, 999)}`,
    status: 'active',
    metadata: {
      source: 'api_gateway',
      risk_score: randomInt(1, 20),
    },
    page: 1,
    offset: 0,
    limit: 25,
    timestamp: new Date().toISOString(),
  };

  // Generate 3 baseline sample observations
  const baselineObservations: Array<Record<string, any>> = [
    { ...baselinePayload, id: `rec_${idNum}_1`, amount: 45.5, customer_name: 'Sarah Connor', status: 'active' },
    { ...baselinePayload, id: `rec_${idNum}_2`, amount: 120.0, customer_name: 'John Miller', status: 'active' },
    { ...baselinePayload, id: `rec_${idNum}_3`, amount: 8.75, customer_name: 'Tanya Smith', status: 'suspended' },
  ];

  // Pick random mutation
  const mutationTypes: Array<GeneratedApiSchema['mutationType']> = [
    'rename',
    'unit_shift',
    'pagination_change',
    'enum_drift',
    'payload_flatten',
    'type_coerce',
  ];
  const chosenMutation = mutationTypes[(index - 1) % mutationTypes.length] || randomItem(mutationTypes);

  let mutatedPayload = JSON.parse(JSON.stringify(baselinePayload));
  let mutationDescription = '';
  let targetField = '';
  let oldValue: any = null;
  let newValue: any = null;
  let expectedVerdict: 'equivalent' | 'lossy' | 'breaking' = 'equivalent';
  let expectedConfidence = 0.95;

  switch (chosenMutation) {
    case 'rename': {
      targetField = 'customer_name';
      oldValue = baselinePayload.customer_name;
      newValue = baselinePayload.customer_name;
      const { customer_name, ...rest } = mutatedPayload;
      mutatedPayload = { ...rest, display_name: customer_name };
      mutationDescription = `Field Renamed: 'customer_name' renamed to 'display_name' by upstream vendor release.`;
      expectedVerdict = 'equivalent';
      expectedConfidence = 0.94;
      break;
    }
    case 'unit_shift': {
      targetField = 'amount';
      oldValue = baselinePayload.amount;
      newValue = Math.round(baselinePayload.amount * 100);
      mutatedPayload.amount = newValue;
      mutationDescription = `Unit Shift: Float currency ($${oldValue}) standardized to integer cents (${newValue} subunits).`;
      expectedVerdict = 'equivalent';
      expectedConfidence = 0.96;
      break;
    }
    case 'pagination_change': {
      targetField = 'offset';
      oldValue = baselinePayload.offset;
      const cursorVal = btoa(`cursor_${idNum}_page`);
      delete mutatedPayload.offset;
      delete mutatedPayload.page;
      mutatedPayload.next_cursor = cursorVal;
      newValue = cursorVal;
      mutationDescription = `Pagination Scheme Migrated: Offset pagination deprecated in favor of opaque keyset cursor.`;
      expectedVerdict = 'lossy';
      expectedConfidence = 0.88;
      break;
    }
    case 'enum_drift': {
      targetField = 'status';
      oldValue = 'suspended';
      newValue = 'active';
      mutatedPayload.status = 'active';
      mutatedPayload.is_suspended = true;
      mutationDescription = `Enum Semantic Drift: Previously 'suspended' records now returned as 'active' with internal sub-state flag.`;
      expectedVerdict = 'breaking';
      expectedConfidence = 0.72;
      break;
    }
    case 'payload_flatten': {
      targetField = 'metadata.risk_score';
      oldValue = baselinePayload.metadata.risk_score;
      newValue = oldValue;
      delete mutatedPayload.metadata;
      mutatedPayload.risk_score = newValue;
      mutationDescription = `Payload Flattening: Nested 'metadata.risk_score' flattened to root-level 'risk_score'.`;
      expectedVerdict = 'equivalent';
      expectedConfidence = 0.91;
      break;
    }
    case 'type_coerce': {
      targetField = 'id';
      oldValue = baselinePayload.id;
      newValue = randomInt(50000, 99999);
      mutatedPayload.id = newValue;
      mutationDescription = `Type Coercion: String prefix ID ('rec_${idNum}') coerced into integer ID (${newValue}).`;
      expectedVerdict = 'lossy';
      expectedConfidence = 0.83;
      break;
    }
  }

  const predictability = analyzeSchemaPredictability(baselinePayload, endpoint);

  return {
    id: `api_sample_${index.toString().padStart(2, '0')}`,
    domain: domainInfo.name,
    service: domainInfo.service,
    endpoint,
    method: domainInfo.method,
    baselinePayload,
    baselineObservations,
    mutatedPayload,
    mutationType: chosenMutation,
    mutationDescription,
    targetField,
    oldValue,
    newValue,
    expectedVerdict,
    expectedConfidence,
    predictability,
  };
}

export function generateRandomApiBatch(count: number = 55): GeneratedApiSchema[] {
  const list: GeneratedApiSchema[] = [];
  for (let i = 1; i <= count; i++) {
    list.push(generateRandomApi(i));
  }
  return list;
}
