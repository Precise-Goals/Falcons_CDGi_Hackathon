import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  INTRA_BLE_CONFIG,
  IntraBleManager,
  bleManager,
} from './bleManager';
import { computeSha256 } from './crypto';

/**
 * -----------------------------------------------------------------------------
 * Intra BLE Packet Protocol Utilities & Helper Codec (MTU Optimized 45-Byte Wire Format)
 * Conforms to ImprovementPlan.md Section 3.2 & Section 4
 * -----------------------------------------------------------------------------
 */

export const BLE_PACKET_CONSTANTS = {
  MAGIC_BYTE_1: 0x49, // ASCII 'I'
  MAGIC_BYTE_2: 0x54, // ASCII 'T'
  PACKET_TYPE_ALERT: 0x01,
  PACKET_TYPE_ACTION: 0x02,
  PACKET_TYPE_HEARTBEAT: 0x03,
  PACKET_TYPE_TELEMETRY: 0x04,
  TOTAL_PACKET_LENGTH: 45,
} as const;

export type BleVerdict = 'equivalent' | 'breaking' | 'lossy';

export interface BleDriftAlert {
  mutationId: string;
  confidence: number;
  verdict: BleVerdict;
  epochSeconds: number;
  sha256Hex: string;
}

export function scaleConfidenceToBasisPoints(confidence: number): number {
  if (Number.isNaN(confidence)) {
    throw new TypeError('Confidence cannot be NaN');
  }
  const clamped = Math.max(0, Math.min(1.0, confidence));
  return Math.round(clamped * 10000);
}

export function scaleBasisPointsToConfidence(bp: number): number {
  if (bp < 0 || bp > 10000 || !Number.isInteger(bp)) {
    throw new RangeError(`Basis points must be an integer between 0 and 10000, received ${bp}`);
  }
  return bp / 10000;
}

export function verdictToByte(verdict: BleVerdict): number {
  switch (verdict) {
    case 'equivalent':
      return 0x00;
    case 'breaking':
      return 0x01;
    case 'lossy':
      return 0x02;
    default:
      throw new Error(`Invalid verdict: ${verdict}`);
  }
}

export function byteToVerdict(byte: number): BleVerdict {
  switch (byte) {
    case 0x00:
      return 'equivalent';
    case 0x01:
      return 'breaking';
    case 0x02:
      return 'lossy';
    default:
      throw new Error(`Invalid verdict byte: ${byte}`);
  }
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('sha256:') ? hex.slice(7) : hex;
  if (clean.length !== 64) {
    throw new Error(`Invalid SHA-256 hex length: expected 64 chars, received ${clean.length}`);
  }
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const byteHex = clean.substring(i * 2, i * 2 + 2);
    const parsed = parseInt(byteHex, 16);
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid hexadecimal byte at position ${i * 2}: "${byteHex}"`);
    }
    bytes[i] = parsed;
  }
  return bytes;
}

export function bytesToHex(bytes: Uint8Array): string {
  if (bytes.length !== 32) {
    throw new Error(`Invalid byte array length for SHA-256: expected 32, received ${bytes.length}`);
  }
  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function serializeBlePacket(alert: BleDriftAlert): Uint8Array {
  const buffer = new ArrayBuffer(BLE_PACKET_CONSTANTS.TOTAL_PACKET_LENGTH);
  const view = new DataView(buffer);
  const uint8 = new Uint8Array(buffer);

  // 1. Magic Bytes (0..1)
  uint8[0] = BLE_PACKET_CONSTANTS.MAGIC_BYTE_1;
  uint8[1] = BLE_PACKET_CONSTANTS.MAGIC_BYTE_2;

  // 2. Packet Type (2)
  uint8[2] = BLE_PACKET_CONSTANTS.PACKET_TYPE_ALERT;

  // 3. Mutation ID (3..5): 3 ASCII chars ("M01" to "M10")
  let formattedId = alert.mutationId.toUpperCase();
  if (/^M\d$/.test(formattedId)) {
    formattedId = `M0${formattedId.slice(1)}`;
  }
  if (formattedId.length !== 3) {
    throw new Error(`Mutation ID must format to exactly 3 ASCII chars, got: ${formattedId}`);
  }
  uint8[3] = formattedId.charCodeAt(0);
  uint8[4] = formattedId.charCodeAt(1);
  uint8[5] = formattedId.charCodeAt(2);

  // 4. Confidence in Basis Points (6..7): uint16 Big-Endian
  const confBp = scaleConfidenceToBasisPoints(alert.confidence);
  view.setUint16(6, confBp, false);

  // 5. Verdict (8): uint8
  uint8[8] = verdictToByte(alert.verdict);

  // 6. Time (9..12): uint32 Big-Endian Unix epoch seconds
  view.setUint32(9, alert.epochSeconds >>> 0, false);

  // 7. SHA-256 Digest (13..44): 32 raw bytes
  const shaBytes = hexToBytes(alert.sha256Hex);
  uint8.set(shaBytes, 13);

  return uint8;
}

export function parseBlePacket(bytes: Uint8Array): BleDriftAlert {
  if (bytes.length !== BLE_PACKET_CONSTANTS.TOTAL_PACKET_LENGTH) {
    throw new Error(
      `Invalid BLE packet length: expected ${BLE_PACKET_CONSTANTS.TOTAL_PACKET_LENGTH} bytes, got ${bytes.length}`
    );
  }

  if (
    bytes[0] !== BLE_PACKET_CONSTANTS.MAGIC_BYTE_1 ||
    bytes[1] !== BLE_PACKET_CONSTANTS.MAGIC_BYTE_2
  ) {
    throw new Error(
      `Invalid BLE packet magic bytes: 0x${bytes[0].toString(16)} 0x${bytes[1].toString(16)}`
    );
  }

  if (bytes[2] !== BLE_PACKET_CONSTANTS.PACKET_TYPE_ALERT) {
    throw new Error(`Unsupported BLE packet type: ${bytes[2]}`);
  }

  const idRaw = String.fromCharCode(bytes[3], bytes[4], bytes[5]);
  const mutationId = idRaw.startsWith('M0') ? `M${idRaw.slice(2)}` : idRaw;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const confBp = view.getUint16(6, false);
  const confidence = scaleBasisPointsToConfidence(confBp);

  const verdict = byteToVerdict(bytes[8]);
  const epochSeconds = view.getUint32(9, false);

  const shaBytes = bytes.subarray(13, 45);
  const sha256Hex = bytesToHex(shaBytes);

  return {
    mutationId,
    confidence,
    verdict,
    epochSeconds,
    sha256Hex,
  };
}

/**
 * -----------------------------------------------------------------------------
 * Unit Test Suite
 * -----------------------------------------------------------------------------
 */

describe('Web Bluetooth Low Energy (BLE) Client & Auto-Connect Subsystem', () => {
  const REAL_MUTATIONS = [
    { id: 'M1', name: 'Field Rename', verdict: 'equivalent' as BleVerdict, confidence: 0.95 },
    { id: 'M2', name: 'Name Format Shift', verdict: 'lossy' as BleVerdict, confidence: 0.82 },
    { id: 'M3', name: 'Amount Unit Shift', verdict: 'equivalent' as BleVerdict, confidence: 0.92 },
    { id: 'M4', name: 'ISO Timestamp Shift', verdict: 'equivalent' as BleVerdict, confidence: 0.94 },
    { id: 'M5', name: 'Cursor Pagination', verdict: 'equivalent' as BleVerdict, confidence: 0.96 },
    { id: 'M6', name: 'Error Envelope Shift', verdict: 'breaking' as BleVerdict, confidence: 0.88 },
    { id: 'M7', name: 'Null Coercion Drift', verdict: 'lossy' as BleVerdict, confidence: 0.79 },
    { id: 'M8', name: 'Latency Degradation', verdict: 'breaking' as BleVerdict, confidence: 0.98 },
    { id: 'M9', name: 'Rate Limit Reduction', verdict: 'breaking' as BleVerdict, confidence: 0.99 },
    { id: 'M10', name: 'Enum Expansion', verdict: 'breaking' as BleVerdict, confidence: 0.72 },
  ];

  let mockAlertChar: any;
  let mockActionChar: any;
  let mockHeartbeatChar: any;
  let mockService: any;
  let mockGattServer: any;
  let mockDevice: any;
  let actionListeners: Record<string, ((event: any) => void)[]> = {};
  let deviceListeners: Record<string, ((event: any) => void)[]> = {};

  beforeEach(() => {
    actionListeners = {};
    deviceListeners = {};

    mockAlertChar = {
      uuid: INTRA_BLE_CONFIG.CHARACTERISTICS.DRIFT_ALERT,
      writeValueWithoutResponse: vi.fn().mockResolvedValue(undefined),
      writeValue: vi.fn().mockResolvedValue(undefined),
    };

    mockActionChar = {
      uuid: INTRA_BLE_CONFIG.CHARACTERISTICS.ADAPTER_ACTION,
      startNotifications: vi.fn().mockResolvedValue(undefined),
      stopNotifications: vi.fn().mockResolvedValue(undefined),
      addEventListener: vi.fn((type: string, listener: any) => {
        if (!actionListeners[type]) actionListeners[type] = [];
        actionListeners[type].push(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: any) => {
        if (actionListeners[type]) {
          actionListeners[type] = actionListeners[type].filter((l) => l !== listener);
        }
      }),
    };

    mockHeartbeatChar = {
      uuid: INTRA_BLE_CONFIG.CHARACTERISTICS.HEARTBEAT,
      writeValueWithoutResponse: vi.fn().mockResolvedValue(undefined),
    };

    mockService = {
      uuid: INTRA_BLE_CONFIG.SERVICE_UUID,
      getCharacteristic: vi.fn().mockImplementation(async (uuid: string) => {
        if (uuid === INTRA_BLE_CONFIG.CHARACTERISTICS.DRIFT_ALERT) return mockAlertChar;
        if (uuid === INTRA_BLE_CONFIG.CHARACTERISTICS.ADAPTER_ACTION) return mockActionChar;
        if (uuid === INTRA_BLE_CONFIG.CHARACTERISTICS.HEARTBEAT) return mockHeartbeatChar;
        throw new Error(`Unknown characteristic ${uuid}`);
      }),
    };

    mockGattServer = {
      connected: true,
      connect: vi.fn().mockResolvedValue(null),
      disconnect: vi.fn(() => {
        mockGattServer.connected = false;
      }),
      getPrimaryService: vi.fn().mockResolvedValue(mockService),
    };
    mockGattServer.connect.mockResolvedValue(mockGattServer);

    mockDevice = {
      id: 'intra_companion_dev_01',
      name: 'Intra Android Companion',
      gatt: mockGattServer,
      addEventListener: vi.fn((type: string, listener: any) => {
        if (!deviceListeners[type]) deviceListeners[type] = [];
        deviceListeners[type].push(listener);
      }),
      removeEventListener: vi.fn((type: string, listener: any) => {
        if (deviceListeners[type]) {
          deviceListeners[type] = deviceListeners[type].filter((l) => l !== listener);
        }
      }),
    };

    if (!('navigator' in globalThis)) {
      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        configurable: true,
        writable: true,
      });
    }

    // Set up navigator.bluetooth mock via defineProperty
    Object.defineProperty(globalThis.navigator, 'bluetooth', {
      value: {
        getDevices: vi.fn().mockResolvedValue([mockDevice]),
        requestDevice: vi.fn().mockResolvedValue(mockDevice),
      },
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    bleManager.disconnect();
    vi.clearAllMocks();
  });

  describe('1. INTRA_BLE_CONFIG Architecture & Characteristic UUIDs', () => {
    it('verifies INTRA_BLE_CONFIG service and characteristic UUID specification', () => {
      expect(INTRA_BLE_CONFIG.SERVICE_UUID).toBe('19e2613e-9ed7-3d97-0af0-6bca28e799e5');
      expect(INTRA_BLE_CONFIG.CHARACTERISTICS.DRIFT_ALERT).toBe('19e2613e-9ed7-3d97-0af0-6bca28e70001');
      expect(INTRA_BLE_CONFIG.CHARACTERISTICS.ADAPTER_ACTION).toBe('19e2613e-9ed7-3d97-0af0-6bca28e70002');
      expect(INTRA_BLE_CONFIG.CHARACTERISTICS.HEARTBEAT).toBe('19e2613e-9ed7-3d97-0af0-6bca28e70003');
      expect(INTRA_BLE_CONFIG.CHARACTERISTICS.TELEMETRY).toBe('19e2613e-9ed7-3d97-0af0-6bca28e70004');

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
      expect(INTRA_BLE_CONFIG.SERVICE_UUID).toMatch(uuidRegex);
    });
  });

  describe('2. Compact Binary BLE Packet Serialization (45-Byte MTU Optimized)', () => {
    it('serializes exactly 45 bytes conforming to the binary BLE MTU specification', async () => {
      const realSha = await computeSha256(JSON.stringify({ mutation: 'M1', test: 'mtu_wire_check' }));
      const nowSec = Math.floor(Date.now() / 1000);

      const alert: BleDriftAlert = {
        mutationId: 'M1',
        confidence: 0.96,
        verdict: 'equivalent',
        epochSeconds: nowSec,
        sha256Hex: realSha,
      };

      const packet = serializeBlePacket(alert);
      expect(packet.length).toBe(45);
      expect(packet[0]).toBe(0x49); // 'I'
      expect(packet[1]).toBe(0x54); // 'T'
      expect(packet[2]).toBe(0x01); // Drift Alert type

      // Mutation ID padded: "M01"
      expect(packet[3]).toBe('M'.charCodeAt(0));
      expect(packet[4]).toBe('0'.charCodeAt(0));
      expect(packet[5]).toBe('1'.charCodeAt(0));

      // Confidence in bp: 9600 = 0x2580 -> big-endian [0x25, 0x80]
      expect(packet[6]).toBe(0x25);
      expect(packet[7]).toBe(0x80);

      // Verdict: equivalent -> 0x00
      expect(packet[8]).toBe(0x00);

      // Timestamp: 4 bytes big endian
      const dv = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
      expect(dv.getUint32(9, false)).toBe(nowSec);

      // Raw SHA-256: 32 bytes
      const extractedSha = bytesToHex(packet.subarray(13, 45));
      expect(extractedSha).toBe(realSha);
    });

    it('performs bidirectional round-trip encoding and decoding across all 10 catalogue mutations (M1-M10)', async () => {
      const epochSeconds = 1760000000;

      for (const mut of REAL_MUTATIONS) {
        const payloadData = { mutation: mut.id, name: mut.name, timestamp: epochSeconds };
        const realSha = await computeSha256(JSON.stringify(payloadData));

        const original: BleDriftAlert = {
          mutationId: mut.id,
          confidence: mut.confidence,
          verdict: mut.verdict,
          epochSeconds,
          sha256Hex: realSha,
        };

        const serialized = serializeBlePacket(original);
        expect(serialized.length).toBe(45);

        const parsed = parseBlePacket(serialized);
        expect(parsed.mutationId).toBe(mut.id);
        expect(parsed.confidence).toBeCloseTo(mut.confidence, 4);
        expect(parsed.verdict).toBe(mut.verdict);
        expect(parsed.epochSeconds).toBe(epochSeconds);
        expect(parsed.sha256Hex).toBe(realSha);
      }
    });

    it('rejects invalid or corrupted binary packets', () => {
      const shortPacket = new Uint8Array(44);
      expect(() => parseBlePacket(shortPacket)).toThrowError(/Invalid BLE packet length/);

      const invalidMagic = new Uint8Array(45);
      invalidMagic[0] = 0x00;
      invalidMagic[1] = 0x00;
      invalidMagic[2] = 0x01;
      expect(() => parseBlePacket(invalidMagic)).toThrowError(/Invalid BLE packet magic bytes/);

      const invalidType = new Uint8Array(45);
      invalidType[0] = 0x49;
      invalidType[1] = 0x54;
      invalidType[2] = 0x99;
      expect(() => parseBlePacket(invalidType)).toThrowError(/Unsupported BLE packet type/);
    });
  });

  describe('3. Confidence Scaling & Basis Points Precision', () => {
    it('scales standard float probabilities into exact integer basis points', () => {
      expect(scaleConfidenceToBasisPoints(0.0)).toBe(0);
      expect(scaleConfidenceToBasisPoints(0.5)).toBe(5000);
      expect(scaleConfidenceToBasisPoints(0.72)).toBe(7200);
      expect(scaleConfidenceToBasisPoints(0.82)).toBe(8200);
      expect(scaleConfidenceToBasisPoints(0.95)).toBe(9500);
      expect(scaleConfidenceToBasisPoints(0.96)).toBe(9600);
      expect(scaleConfidenceToBasisPoints(1.0)).toBe(10000);
    });

    it('deserializes basis points back into accurate float confidence', () => {
      expect(scaleBasisPointsToConfidence(0)).toBe(0.0);
      expect(scaleBasisPointsToConfidence(5000)).toBe(0.5);
      expect(scaleBasisPointsToConfidence(9600)).toBe(0.96);
      expect(scaleBasisPointsToConfidence(10000)).toBe(1.0);
    });

    it('clamps boundary extremes safely and rejects invalid numeric inputs', () => {
      expect(scaleConfidenceToBasisPoints(-0.25)).toBe(0);
      expect(scaleConfidenceToBasisPoints(1.5)).toBe(10000);
      expect(() => scaleConfidenceToBasisPoints(NaN)).toThrowError(TypeError);

      expect(() => scaleBasisPointsToConfidence(-1)).toThrowError(RangeError);
      expect(() => scaleBasisPointsToConfidence(10001)).toThrowError(RangeError);
      expect(() => scaleBasisPointsToConfidence(5000.5)).toThrowError(RangeError);
    });
  });

  describe('4. SHA-256 Cryptographic Integrity & Tamper Resistance', () => {
    it('computes real WebCrypto SHA-256 digest and validates bit-level hex serialization', async () => {
      const samplePayload = '{"service":"users","endpoint":"GET /users","mutation":"rename"}';
      const realSha = await computeSha256(samplePayload);
      expect(realSha).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(realSha)).toBe(true);

      const bytes = hexToBytes(realSha);
      expect(bytes.length).toBe(32);

      const reconstructedHex = bytesToHex(bytes);
      expect(reconstructedHex).toBe(realSha);
    });

    it('detects payload tampering when single byte in hash is modified', async () => {
      const realSha = await computeSha256('authentic_payload_data');
      const alert: BleDriftAlert = {
        mutationId: 'M3',
        confidence: 0.92,
        verdict: 'equivalent',
        epochSeconds: 1760000100,
        sha256Hex: realSha,
      };

      const packet = serializeBlePacket(alert);
      packet[15] ^= 0xff; // Flip bits in hash digest

      const parsed = parseBlePacket(packet);
      expect(parsed.sha256Hex).not.toBe(realSha);
    });
  });

  describe('5. Web Bluetooth Browser Environment & Fallback Behavior', () => {
    it('reports isSupported correctly based on browser navigator.bluetooth support', () => {
      expect(bleManager.isSupported).toBe(true);

      const oldBt = (navigator as any).bluetooth;
      delete (navigator as any).bluetooth;
      const mgr = IntraBleManager.getInstance();
      expect(mgr.isSupported).toBe(false);

      Object.defineProperty(navigator, 'bluetooth', {
        value: oldBt,
        configurable: true,
        writable: true,
      });
    });

    it('performs zero-click auto-reconnect using navigator.bluetooth.getDevices', async () => {
      let connectionState = false;
      const unsubscribe = bleManager.onConnectionChange((connected) => {
        connectionState = connected;
      });

      const connected = await bleManager.connect();
      expect(connected).toBe(true);
      expect(bleManager.isConnected).toBe(true);
      expect(bleManager.deviceName).toBe('Intra Android Companion');
      expect(connectionState).toBe(true);
      expect((navigator as any).bluetooth.getDevices).toHaveBeenCalled();
      expect(mockGattServer.getPrimaryService).toHaveBeenCalledWith(INTRA_BLE_CONFIG.SERVICE_UUID);
      expect(mockActionChar.startNotifications).toHaveBeenCalled();

      unsubscribe();
    });

    it('falls back to interactive requestDevice when getDevices returns empty', async () => {
      (navigator as any).bluetooth.getDevices = vi.fn().mockResolvedValue([]);
      const connected = await bleManager.connect();

      expect(connected).toBe(true);
      expect((navigator as any).bluetooth.requestDevice).toHaveBeenCalledWith({
        filters: [
          { services: [INTRA_BLE_CONFIG.SERVICE_UUID] },
          { namePrefix: 'Intra' },
        ],
        optionalServices: [INTRA_BLE_CONFIG.SERVICE_UUID],
      });
    });

    it('dispatches compact MTU-optimized JSON alert packet to alertChar', async () => {
      await bleManager.connect();

      const dispatched = await bleManager.dispatchDriftAlert(
        'M1',
        0.96,
        'equivalent',
        'sha256:4f88e28f119e73b2'
      );

      expect(dispatched).toBe(true);
      expect(mockAlertChar.writeValueWithoutResponse).toHaveBeenCalledTimes(1);

      const packetCall = mockAlertChar.writeValueWithoutResponse.mock.calls[0][0];
      const decoded = JSON.parse(new TextDecoder().decode(packetCall));

      expect(decoded.id).toBe('M1');
      expect(decoded.conf).toBe(0.96);
      expect(decoded.verdict).toBe('equivalent');
      expect(decoded.hash).toBe('4f88e28f119e73b2');
      expect(typeof decoded.ts).toBe('number');
    });

    it('receives mobile approval packets and triggers onAdapterAction callback', async () => {
      await bleManager.connect();

      let receivedAction: any = null;
      const unsubscribe = bleManager.onAdapterAction((action) => {
        receivedAction = action;
      });

      const payload = JSON.stringify({
        proposalId: 'prop_m1_01',
        confirm: true,
      });
      const encoded = new TextEncoder().encode(payload);
      const dataView = new DataView(encoded.buffer);

      const event = {
        target: {
          value: dataView,
        },
      };

      const listeners = actionListeners['characteristicvaluechanged'] || [];
      expect(listeners.length).toBeGreaterThan(0);
      listeners.forEach((listener) => listener(event));

      expect(receivedAction).toEqual({
        proposalId: 'prop_m1_01',
        confirm: true,
      });

      unsubscribe();
    });

    it('handles clean disconnect and notifies connection listeners', async () => {
      let connectionState: boolean | null = null;
      bleManager.onConnectionChange((connected) => {
        connectionState = connected;
      });

      await bleManager.connect();
      expect(connectionState).toBe(true);

      bleManager.disconnect();
      expect(mockGattServer.disconnect).toHaveBeenCalled();
      expect(bleManager.isConnected).toBe(false);
      expect(connectionState).toBe(false);
    });

    it('handles unexpected GATT server disconnection event gracefully', async () => {
      await bleManager.connect();
      expect(bleManager.isConnected).toBe(true);

      const disconnectHandlers = deviceListeners['gattserverdisconnected'] || [];
      expect(disconnectHandlers.length).toBeGreaterThan(0);

      mockGattServer.connected = false;
      disconnectHandlers.forEach((h) => h({}));

      expect(bleManager.isConnected).toBe(false);
    });
  });
});
