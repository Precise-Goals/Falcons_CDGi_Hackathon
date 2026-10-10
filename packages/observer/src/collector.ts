import { Observation, ObservationSchema } from '@intra/shared';
import { redactHeaders, redactPayload } from './redact.js';

export interface RecordTrafficOptions {
  service: string;
  endpoint: string;
  method: string;
  status: number;
  headers: Record<string, string>;
  body?: unknown;
  latencyMs: number;
  rateLimitHeaders?: Record<string, string>;
  paginationShape?: Record<string, unknown>;
  errorBody?: unknown;
}

export class ObservationCollector {
  private observations: Observation[] = [];
  private maxBufferSize: number;

  constructor(maxBufferSize = 10000) {
    this.maxBufferSize = maxBufferSize;
  }

  public record(options: RecordTrafficOptions): Observation {
    const redactedHeaders = redactHeaders(options.headers);
    const redactedBody = redactPayload(options.body);
    const redactedError = options.errorBody ? redactPayload(options.errorBody) : undefined;

    const obs: Observation = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      service: options.service,
      endpoint: options.endpoint,
      method: options.method.toUpperCase(),
      status: options.status,
      headers: redactedHeaders,
      body: redactedBody,
      latencyMs: options.latencyMs,
      rateLimitHeaders: options.rateLimitHeaders,
      paginationShape: options.paginationShape,
      errorBody: redactedError,
      timestamp: new Date().toISOString(),
    };

    ObservationSchema.parse(obs);

    if (this.observations.length >= this.maxBufferSize) {
      this.observations.shift();
    }
    this.observations.push(obs);

    return obs;
  }

  public getByService(service: string, limit = 100): Observation[] {
    return this.observations
      .filter((o) => o.service.toLowerCase() === service.toLowerCase())
      .slice(-limit);
  }

  public getByEndpoint(service: string, endpoint: string, limit = 100): Observation[] {
    return this.observations
      .filter(
        (o) =>
          o.service.toLowerCase() === service.toLowerCase() &&
          o.endpoint.toLowerCase() === endpoint.toLowerCase()
      )
      .slice(-limit);
  }

  public getAll(): Observation[] {
    return [...this.observations];
  }

  public clear(): void {
    this.observations = [];
  }
}
