export interface GeneratedApiSchema {
  domain: string;
  service: string;
  endpoint: string;
  method: 'GET' | 'POST';
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
}

const DOMAINS = [
  { name: 'FinTech Ledger', service: 'settlements', endpoint: '/v2/settlements/transfers', method: 'POST' as const },
  { name: 'Logistics Telemetry', service: 'telemetry', endpoint: '/fleet/v3/waypoints', method: 'GET' as const },
  { name: 'Vector Search Cloud', service: 'embeddings', endpoint: '/v1/vectors/similarity', method: 'POST' as const },
  { name: 'Healthcare Cloud EHR', service: 'patients', endpoint: '/api/v2/patient/vitals', method: 'GET' as const },
  { name: 'E-Commerce Nexus', service: 'checkout', endpoint: '/v4/orders/dispatch', method: 'POST' as const },
  { name: 'Autonomous Drone Grid', service: 'avionics', endpoint: '/drones/v1/telemetry', method: 'GET' as const },
  { name: 'Identity & Access Mesh', service: 'iam', endpoint: '/tenants/v2/principals', method: 'GET' as const },
  { name: 'IoT Energy Sensor Net', service: 'smartgrid', endpoint: '/meters/v1/readings', method: 'POST' as const },
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomApi(): GeneratedApiSchema {
  const domainInfo = randomItem(DOMAINS);
  const idNum = randomInt(1000, 9999);
  const randomCents = randomInt(1500, 99900) / 100;

  // Base Schema fields
  const baselinePayload: Record<string, any> = {
    id: `rec_${idNum}`,
    transaction_uuid: `tx_${Math.random().toString(36).substring(2, 10)}`,
    amount: randomCents,
    currency: 'USD',
    customer_name: randomItem(['Alex Chen', 'Priya Sharma', 'David Miller', 'Yuki Tanaka', 'Elena Rostova']),
    account_id: `acc_${randomInt(100, 999)}`,
    status: 'active',
    metadata: {
      source: 'web_portal',
      risk_score: randomInt(1, 15),
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
  const chosenMutation = randomItem(mutationTypes);

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
      mutationDescription = `Field Renamed: 'customer_name' was renamed to 'display_name' by upstream service.`;
      expectedVerdict = 'equivalent';
      expectedConfidence = 0.94;
      break;
    }
    case 'unit_shift': {
      targetField = 'amount';
      oldValue = baselinePayload.amount;
      newValue = Math.round(baselinePayload.amount * 100);
      mutatedPayload.amount = newValue;
      mutationDescription = `Unit Shift: Float currency ($${oldValue}) converted to integer cents (${newValue} subunits).`;
      expectedVerdict = 'equivalent';
      expectedConfidence = 0.96;
      break;
    }
    case 'pagination_change': {
      targetField = 'offset';
      oldValue = baselinePayload.offset;
      const cursorVal = btoa(`cursor_${idNum}_next`);
      delete mutatedPayload.offset;
      delete mutatedPayload.page;
      mutatedPayload.next_cursor = cursorVal;
      newValue = cursorVal;
      mutationDescription = `Pagination Scheme Migrated: Offset/page numbering deprecated in favor of opaque keyset cursor.`;
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
      mutationDescription = `Enum Semantic Drift: Previously 'suspended' accounts now returned as 'active' with internal sub-state flag.`;
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
      expectedConfidence = 0.82;
      break;
    }
  }

  return {
    domain: domainInfo.name,
    service: domainInfo.service,
    endpoint: domainInfo.endpoint,
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
  };
}
