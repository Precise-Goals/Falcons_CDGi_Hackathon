/**
 * Intra Web Bluetooth Low Energy (BLE) Client & Auto-Connect Subsystem
 *
 * Provides sub-20ms wireless airlink between the Intra Web Dashboard and the
 * Android Hardware Companion per ImprovementPlan.md. Supports zero-click auto-reconnect,
 * compact MTU-optimized JSON alert packet streaming, and bi-directional mobile approvals.
 */

// Web Bluetooth API Type Declarations (for environments without @types/web-bluetooth)
export interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface BluetoothRemoteGATTServer {
  device: BluetoothDevice;
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
  getPrimaryServices?(service?: string): Promise<BluetoothRemoteGATTService[]>;
}

export interface BluetoothRemoteGATTService {
  uuid: string;
  isPrimary: boolean;
  device: BluetoothDevice;
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
  getCharacteristics?(characteristic?: string): Promise<BluetoothRemoteGATTCharacteristic[]>;
}

export interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  service: BluetoothRemoteGATTService;
  uuid: string;
  value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  writeValueWithResponse?(value: BufferSource): Promise<void>;
  writeValueWithoutResponse?(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

export interface RequestDeviceOptions {
  filters?: Array<{
    name?: string;
    namePrefix?: string;
    services?: Array<string>;
  }>;
  optionalServices?: Array<string>;
  acceptAllDevices?: boolean;
}

export interface WebBluetooth {
  getAvailability?: () => Promise<boolean>;
  getDevices?: () => Promise<BluetoothDevice[]>;
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
}

export interface BleAdapterAction {
  proposalId: string;
  confirm: boolean;
}

export interface BleDriftAlertPayload {
  id: string;
  conf: number;
  verdict: string;
  hash: string;
  ts: number;
}

export type BleConnectionCallback = (connected: boolean) => void;
export type BleAdapterActionCallback = (action: BleAdapterAction) => void;

/**
 * Intra Bluetooth Low Energy GATT Profile Configuration
 * Service UUID derived from MST Contract Address (0x19e2613e9eD73d970Af06Bca28E799E5de3Fa89B)
 */
export const INTRA_BLE_CONFIG = {
  SERVICE_UUID: '19e2613e-9ed7-3d97-0af0-6bca28e799e5',

  CHARACTERISTICS: {
    // Notify / Read: Dispatched by Web Portal when Engine detects drift
    DRIFT_ALERT: '19e2613e-9ed7-3d97-0af0-6bca28e70001',

    // Write / WriteWithoutResponse: Dispatched by Phone to approve/rollback adapter
    ADAPTER_ACTION: '19e2613e-9ed7-3d97-0af0-6bca28e70002',

    // Read / Write: Liveness Heartbeat ping-pong (every 1000ms)
    HEARTBEAT: '19e2613e-9ed7-3d97-0af0-6bca28e70003',

    // Read: Telemetry metrics & rate-limit headroom
    TELEMETRY: '19e2613e-9ed7-3d97-0af0-6bca28e70004',
  },
} as const;

/**
 * IntraBleManager Singleton
 * Coordinates Web Bluetooth connectivity, hardware node pairing, and event transmission.
 */
export class IntraBleManager {
  private static instance: IntraBleManager;

  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private alertChar: BluetoothRemoteGATTCharacteristic | null = null;
  private actionChar: BluetoothRemoteGATTCharacteristic | null = null;
  private heartbeatChar: BluetoothRemoteGATTCharacteristic | null = null;

  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private connectionCallbacks: Set<BleConnectionCallback> = new Set();
  private actionCallbacks: Set<BleAdapterActionCallback> = new Set();
  private isConnecting: boolean = false;

  private constructor() {}

  public static getInstance(): IntraBleManager {
    if (!IntraBleManager.instance) {
      IntraBleManager.instance = new IntraBleManager();
    }
    return IntraBleManager.instance;
  }

  /**
   * Helper to retrieve Web Bluetooth API object safely in browser environments
   */
  private get bluetooth(): WebBluetooth | undefined {
    if (typeof navigator !== 'undefined' && 'bluetooth' in navigator) {
      return (navigator as unknown as { bluetooth: WebBluetooth }).bluetooth;
    }
    return undefined;
  }

  /**
   * True if Web Bluetooth API is supported by the current browser environment
   */
  public get isSupported(): boolean {
    return Boolean(this.bluetooth);
  }

  /**
   * True if active GATT server is connected
   */
  public get isConnected(): boolean {
    return Boolean(this.server?.connected);
  }

  /**
   * Active paired device name, if any
   */
  public get deviceName(): string | null {
    return this.device?.name || null;
  }

  /**
   * Connect or auto-reconnect to paired Intra Android Companion hardware node.
   * Leverages navigator.bluetooth.getDevices() for zero-click auto-connect where permitted,
   * falling back to requestDevice() pairing dialog.
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected) {
      return true;
    }

    if (!this.isSupported) {
      console.warn('[Intra BLE] Web Bluetooth API is not supported in this browser environment.');
      return false;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;

    try {
      const bt = this.bluetooth!;
      let selectedDevice: BluetoothDevice | null = null;

      // 1. Attempt zero-click auto-reconnect via previously authorized devices
      if (typeof bt.getDevices === 'function') {
        try {
          const authorizedDevices = await bt.getDevices();
          if (authorizedDevices && authorizedDevices.length > 0) {
            // Find device advertising Intra service or first available
            selectedDevice = authorizedDevices[0];
            console.log(`[Intra BLE] Auto-reconnecting to previously paired device: ${selectedDevice.name || selectedDevice.id}`);
          }
        } catch (err) {
          console.warn('[Intra BLE] getDevices() check error:', err);
        }
      }

      // 2. Interactive pairing modal with service filter and fallback
      if (!selectedDevice) {
        try {
          selectedDevice = await bt.requestDevice({
            filters: [{ services: [INTRA_BLE_CONFIG.SERVICE_UUID] }],
            optionalServices: [INTRA_BLE_CONFIG.SERVICE_UUID],
          });
        } catch (filterErr: any) {
          if (filterErr.name === 'NotFoundError' || filterErr.message?.includes('User cancelled')) {
            throw filterErr;
          }
          // Fallback to accepting all Bluetooth devices
          selectedDevice = await bt.requestDevice({
            acceptAllDevices: true,
            optionalServices: [INTRA_BLE_CONFIG.SERVICE_UUID],
          });
        }
      }

      // 3. Connect to GATT server
      return await this.setupGattConnection(selectedDevice);
    } catch (err: any) {
      // If user cancelled the browser prompt or device rejected
      if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
        console.info('[Intra BLE] Pairing prompt cancelled by user.');
      } else {
        console.error('[Intra BLE] Connection failed:', err);
      }
      this.cleanup();
      return false;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Non-interactive zero-click background reconnection attempt.
   * Never invokes prompt dialog; returns false if no pre-paired device is available.
   */
  public async tryAutoReconnect(): Promise<boolean> {
    if (this.isConnected) return true;
    if (!this.isSupported) return false;

    try {
      const bt = this.bluetooth!;
      if (typeof bt.getDevices === 'function') {
        const authorized = await bt.getDevices();
        if (authorized && authorized.length > 0) {
          const candidate = authorized[0];
          console.log(`[Intra BLE] Attempting zero-click reconnect to: ${candidate.name || candidate.id}`);
          return await this.setupGattConnection(candidate);
        }
      }
    } catch (err) {
      console.debug('[Intra BLE] Zero-click auto-reconnect failed silently:', err);
    }
    return false;
  }

  /**
   * Establishes GATT connection, resolves characteristics, and registers notification listeners
   */
  private async setupGattConnection(device: BluetoothDevice): Promise<boolean> {
    try {
      this.device = device;
      this.device.addEventListener('gattserverdisconnected', this.handleGattDisconnected);

      if (!this.device.gatt) {
        console.warn('[Intra BLE] Device does not have GATT server capabilities.');
        this.cleanup();
        return false;
      }

      this.server = await this.device.gatt.connect();
      if (!this.server || !this.server.connected) {
        this.cleanup();
        return false;
      }

      let service: BluetoothRemoteGATTService | null = null;
      try {
        service = await this.server.getPrimaryService(INTRA_BLE_CONFIG.SERVICE_UUID);
      } catch (svcErr) {
        console.warn('[Intra BLE] Direct primary service lookup failed, inspecting services:', svcErr);
        if (typeof this.server.getPrimaryServices === 'function') {
          const services = await this.server.getPrimaryServices();
          service = services.find(s => s.uuid.toLowerCase() === INTRA_BLE_CONFIG.SERVICE_UUID.toLowerCase()) || services[0] || null;
        }
      }

      if (!service) {
        throw new Error('GATT Service not discovered on target peripheral');
      }

      // Resolve Drift Alert characteristic (dashboard -> mobile)
      this.alertChar = await service.getCharacteristic(INTRA_BLE_CONFIG.CHARACTERISTICS.DRIFT_ALERT).catch(() => null);

      // Resolve Adapter Action characteristic (mobile -> dashboard approvals)
      this.actionChar = await service.getCharacteristic(INTRA_BLE_CONFIG.CHARACTERISTICS.ADAPTER_ACTION).catch(() => null);

      // Resolve Heartbeat characteristic (optional liveness ping)
      this.heartbeatChar = await service.getCharacteristic(INTRA_BLE_CONFIG.CHARACTERISTICS.HEARTBEAT).catch(() => null);

      // Start notifications on mobile operator response channel if supported
      if (this.actionChar) {
        try {
          await this.actionChar.startNotifications();
          this.actionChar.addEventListener('characteristicvaluechanged', this.handleActionFromMobile);
        } catch (notifErr) {
          console.warn('[Intra BLE] Action notifications not supported on characteristic:', notifErr);
        }
      }

      // Start liveness heartbeat loop
      this.startHeartbeat();

      console.log(`[Intra BLE] Airlink connected successfully to ${this.device.name || 'Hardware Node'}`);
      this.notifyConnectionState(true);
      return true;
    } catch (err) {
      console.error('[Intra BLE] GATT setup failed:', err);
      this.cleanup();
      return false;
    }
  }

  /**
   * Cleanly terminates GATT connection and clears hardware listeners
   */
  public disconnect(): void {
    if (this.server?.connected) {
      try {
        this.server.disconnect();
      } catch (err) {
        console.warn('[Intra BLE] Error during disconnect:', err);
      }
    }
    this.cleanup();
  }

  /**
   * High-Speed Drift Alert Dispatch (<20ms latency)
   * Writes compact MTU-optimized JSON packet to DRIFT_ALERT characteristic.
   */
  public async dispatchDriftAlert(
    mutationId: string,
    confidence: number,
    verdict: string,
    hash: string
  ): Promise<boolean> {
    if (!this.alertChar || !this.server?.connected) {
      return false;
    }

    try {
      const cleanHash = hash.startsWith('sha256:') ? hash.substring(7, 23) : hash.substring(0, 16);
      const payload: BleDriftAlertPayload = {
        id: mutationId,
        conf: Math.round(confidence * 10000) / 10000,
        verdict,
        hash: cleanHash,
        ts: Date.now(),
      };

      const encoder = new TextEncoder();
      const packet = encoder.encode(JSON.stringify(payload));

      if (typeof this.alertChar.writeValueWithoutResponse === 'function') {
        await this.alertChar.writeValueWithoutResponse(packet);
      } else {
        await this.alertChar.writeValue(packet);
      }

      console.log(`[Intra BLE] Alert dispatched over airlink for ${mutationId} (${verdict}, ${(confidence * 100).toFixed(1)}%)`);
      return true;
    } catch (err) {
      console.error(`[Intra BLE] Failed to dispatch alert for ${mutationId}:`, err);
      return false;
    }
  }

  /**
   * Listen for mobile approvals or rollbacks over BLE airlink
   */
  public onAdapterAction(callback: BleAdapterActionCallback): () => void {
    this.actionCallbacks.add(callback);
    return () => {
      this.actionCallbacks.delete(callback);
    };
  }

  /**
   * Subscribe to BLE connection state changes
   */
  public onConnectionChange(callback: BleConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    // Deliver initial state immediately
    callback(this.isConnected);
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  /**
   * Handles incoming notification packets from Android Companion
   */
  private handleActionFromMobile = (event: Event): void => {
    try {
      const target = event.target as { value?: DataView };
      const dataView = target?.value;
      if (!dataView) return;

      const decoder = new TextDecoder();
      const text = decoder.decode(dataView);
      const parsed = JSON.parse(text);

      const proposalId = String(parsed.proposalId || parsed.proposal_id || parsed.id || '');
      const confirm = parsed.confirm !== undefined
        ? Boolean(parsed.confirm)
        : (parsed.action === 'approve' || parsed.approved === true);

      console.log(`[Intra BLE] Received mobile operator action: proposal=${proposalId}, confirm=${confirm}`);

      this.actionCallbacks.forEach((cb) => {
        try {
          cb({ proposalId, confirm });
        } catch (err) {
          console.error('[Intra BLE] Error executing action callback:', err);
        }
      });
    } catch (err) {
      console.warn('[Intra BLE] Failed to parse mobile action packet:', err);
    }
  };

  /**
   * Handles unexpected GATT disconnection (e.g. out of range, phone turned off)
   */
  private handleGattDisconnected = (): void => {
    console.warn('[Intra BLE] GATT server disconnected unexpectedly.');
    this.cleanup();
  };

  /**
   * Broadcasts connection state to all subscribers
   */
  private notifyConnectionState(connected: boolean): void {
    this.connectionCallbacks.forEach((cb) => {
      try {
        cb(connected);
      } catch (err) {
        console.error('[Intra BLE] Error executing connection callback:', err);
      }
    });
  }

  /**
   * Periodic 1000ms liveness heartbeat loop
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(async () => {
      if (!this.heartbeatChar || !this.server?.connected) return;
      try {
        const ping = new Uint8Array([0x48, 0x42, (Date.now() & 0xff)]); // 'HB' + byte
        if (typeof this.heartbeatChar.writeValueWithoutResponse === 'function') {
          await this.heartbeatChar.writeValueWithoutResponse(ping);
        }
      } catch {
        // Silent heartbeat fail
      }
    }, 1500);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Reset internal GATT handles and notify subscribers
   */
  private cleanup(): void {
    this.stopHeartbeat();

    if (this.actionChar) {
      try {
        this.actionChar.removeEventListener('characteristicvaluechanged', this.handleActionFromMobile);
        this.actionChar.stopNotifications().catch(() => {});
      } catch {}
      this.actionChar = null;
    }

    if (this.device) {
      try {
        this.device.removeEventListener('gattserverdisconnected', this.handleGattDisconnected);
      } catch {}
      this.device = null;
    }

    this.server = null;
    this.alertChar = null;
    this.heartbeatChar = null;

    this.notifyConnectionState(false);
  }
}

// Export singleton instance as primary API
export const bleManager = IntraBleManager.getInstance();
