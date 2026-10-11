/**
 * Composite Bi-directional Request-Response Transformation Adapter
 */

export interface BiDirectionalConfig<TClientReq, TServiceReq, TServiceRes, TClientRes> {
  name: string;
  service: string;
  endpoint: string;
  transformRequest: (clientReq: TClientReq) => TServiceReq;
  transformResponse: (serviceRes: TServiceRes) => TClientRes;
  metadata?: Record<string, unknown>;
}

export class BiDirectionalAdapter<
  TClientReq = unknown,
  TServiceReq = unknown,
  TServiceRes = unknown,
  TClientRes = unknown,
> {
  public readonly name: string;
  public readonly service: string;
  public readonly endpoint: string;
  private readonly reqFn: (clientReq: TClientReq) => TServiceReq;
  private readonly resFn: (serviceRes: TServiceRes) => TClientRes;
  public readonly metadata: Record<string, unknown>;

  constructor(config: BiDirectionalConfig<TClientReq, TServiceReq, TServiceRes, TClientRes>) {
    this.name = config.name;
    this.service = config.service;
    this.endpoint = config.endpoint;
    this.reqFn = config.transformRequest;
    this.resFn = config.transformResponse;
    this.metadata = config.metadata ?? {};
  }

  /**
   * Adapts outgoing client payload into format expected by drifting service.
   */
  public adaptRequest(clientReq: TClientReq): TServiceReq {
    return this.reqFn(clientReq);
  }

  /**
   * Adapts incoming service response into format expected by local client codebase.
   */
  public adaptResponse(serviceRes: TServiceRes): TClientRes {
    return this.resFn(serviceRes);
  }

  /**
   * Generates inverse bidirectional adapter for gateway simulation or contract pairing.
   */
  public invert(
    inverseReqFn: (serviceReq: TServiceReq) => TClientReq,
    inverseResFn: (clientRes: TClientRes) => TServiceRes
  ): BiDirectionalAdapter<TServiceReq, TClientReq, TClientRes, TServiceRes> {
    return new BiDirectionalAdapter<TServiceReq, TClientReq, TClientRes, TServiceRes>({
      name: `${this.name}_inverted`,
      service: this.service,
      endpoint: this.endpoint,
      transformRequest: inverseReqFn,
      transformResponse: inverseResFn,
      metadata: { ...this.metadata, inverted: true },
    });
  }
}

/**
 * Factory helper for constructing bidirectional adapters.
 */
export function createBiDirectionalAdapter<
  TClientReq = unknown,
  TServiceReq = unknown,
  TServiceRes = unknown,
  TClientRes = unknown,
>(
  config: BiDirectionalConfig<TClientReq, TServiceReq, TServiceRes, TClientRes>
): BiDirectionalAdapter<TClientReq, TServiceReq, TServiceRes, TClientRes> {
  return new BiDirectionalAdapter<TClientReq, TServiceReq, TServiceRes, TClientRes>(config);
}
