export interface IntraSdkConfig {
  engineUrl: string;
  apiKey?: string;
  appName?: string;
}

export class IntraClient {
  private config: IntraSdkConfig;
  private activeAdapters: Map<string, (data: unknown) => unknown> = new Map();

  constructor(config: IntraSdkConfig) {
    this.config = config;
  }

  public getConfig(): IntraSdkConfig {
    return this.config;
  }

  public registerAdapter(endpoint: string, transformer: (data: unknown) => unknown): void {
    this.activeAdapters.set(endpoint.toLowerCase(), transformer);
  }

  public removeAdapter(endpoint: string): void {
    this.activeAdapters.delete(endpoint.toLowerCase());
  }

  public adaptResponse<T>(endpoint: string, data: T): T {
    const adapter = this.activeAdapters.get(endpoint.toLowerCase());
    if (adapter) {
      return adapter(data) as T;
    }
    return data;
  }
}
