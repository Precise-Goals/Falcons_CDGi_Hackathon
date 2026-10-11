import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:intra_companion/models/drift_event.dart';

/**
 * ---------------------------------------------------------------------------
 * Pure Dart SHA-256 Cryptographic Digest Calculator (Zero-Dependency)
 * Implements FIPS 180-4 for cryptographic verification of BLE packet integrity
 * ---------------------------------------------------------------------------
 */
class RealSha256 {
  static const List<int> _k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  static int _rotr(int x, int n) => ((x >>> n) | (x << (32 - n))) & 0xFFFFFFFF;
  static int _ch(int x, int y, int z) => ((x & y) ^ (~x & z)) & 0xFFFFFFFF;
  static int _maj(int x, int y, int z) => ((x & y) ^ (x & z) ^ (y & z)) & 0xFFFFFFFF;
  static int _sigma0(int x) => (_rotr(x, 2) ^ _rotr(x, 13) ^ _rotr(x, 22)) & 0xFFFFFFFF;
  static int _sigma1(int x) => (_rotr(x, 6) ^ _rotr(x, 11) ^ _rotr(x, 25)) & 0xFFFFFFFF;
  static int _gamma0(int x) => (_rotr(x, 7) ^ _rotr(x, 18) ^ (x >>> 3)) & 0xFFFFFFFF;
  static int _gamma1(int x) => (_rotr(x, 17) ^ _rotr(x, 19) ^ (x >>> 10)) & 0xFFFFFFFF;

  static Uint8List digest(Uint8List message) {
    int h0 = 0x6a09e667;
    int h1 = 0xbb67ae85;
    int h2 = 0x3c6ef372;
    int h3 = 0xa54ff53a;
    int h4 = 0x510e527f;
    int h5 = 0x9b05688c;
    int h6 = 0x1f83d9ab;
    int h7 = 0x5be0cd19;

    final bitLength = message.length * 8;
    final padLength = ((message.length + 8) ~/ 64 + 1) * 64;
    final padded = Uint8List(padLength);
    padded.setRange(0, message.length, message);
    padded[message.length] = 0x80;

    final bdPadded = ByteData.sublistView(padded);
    bdPadded.setUint64(padLength - 8, bitLength, Endian.big);

    final w = List<int>.filled(64, 0);

    for (int chunk = 0; chunk < padLength; chunk += 64) {
      for (int i = 0; i < 16; i++) {
        w[i] = bdPadded.getUint32(chunk + i * 4, Endian.big);
      }
      for (int i = 16; i < 64; i++) {
        final s0 = _gamma0(w[i - 15]);
        final s1 = _gamma1(w[i - 2]);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) & 0xFFFFFFFF;
      }

      int a = h0;
      int b = h1;
      int c = h2;
      int d = h3;
      int e = h4;
      int f = h5;
      int g = h6;
      int h = h7;

      for (int i = 0; i < 64; i++) {
        final t1 = (h + _sigma1(e) + _ch(e, f, g) + _k[i] + w[i]) & 0xFFFFFFFF;
        final t2 = (_sigma0(a) + _maj(a, b, c)) & 0xFFFFFFFF;
        h = g;
        g = f;
        f = e;
        e = (d + t1) & 0xFFFFFFFF;
        d = c;
        c = b;
        b = a;
        a = (t1 + t2) & 0xFFFFFFFF;
      }

      h0 = (h0 + a) & 0xFFFFFFFF;
      h1 = (h1 + b) & 0xFFFFFFFF;
      h2 = (h2 + c) & 0xFFFFFFFF;
      h3 = (h3 + d) & 0xFFFFFFFF;
      h4 = (h4 + e) & 0xFFFFFFFF;
      h5 = (h5 + f) & 0xFFFFFFFF;
      h6 = (h6 + g) & 0xFFFFFFFF;
      h7 = (h7 + h) & 0xFFFFFFFF;
    }

    final out = Uint8List(32);
    final bdOut = ByteData.sublistView(out);
    bdOut.setUint32(0, h0, Endian.big);
    bdOut.setUint32(4, h1, Endian.big);
    bdOut.setUint32(8, h2, Endian.big);
    bdOut.setUint32(12, h3, Endian.big);
    bdOut.setUint32(16, h4, Endian.big);
    bdOut.setUint32(20, h5, Endian.big);
    bdOut.setUint32(24, h6, Endian.big);
    bdOut.setUint32(28, h7, Endian.big);
    return out;
  }

  static String hexDigest(String input) {
    final bytes = utf8.encode(input);
    final d = digest(Uint8List.fromList(bytes));
    return d.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  }
}

/**
 * ---------------------------------------------------------------------------
 * Intra BLE Packet Parser & Serializer for Flutter Mobile Companion
 * Conforms to ImprovementPlan.md Section 3 & 5
 * ---------------------------------------------------------------------------
 */
class IntraBlePacketCodec {
  static const int magicByte1 = 0x49; // 'I'
  static const int magicByte2 = 0x54; // 'T'
  static const int packetTypeAlert = 0x01;
  static const int expectedPacketLength = 45;

  /// Single Source of Truth: Canonical Engine Mutation Catalogue (M1 to M10)
  static const Map<String, Map<String, String>> mutationCatalogue = {
    'M1': {
      'service': 'users',
      'endpoint': 'GET /users',
      'kind': 'field_renamed',
      'desc': 'name -> display_name',
    },
    'M2': {
      'service': 'users',
      'endpoint': 'GET /users',
      'kind': 'semantic_format',
      'desc': 'First Last -> Last, First',
    },
    'M3': {
      'service': 'payments',
      'endpoint': 'POST /payments/charge',
      'kind': 'unit_shift',
      'desc': 'dollars -> cents integer multiplier x100',
    },
    'M4': {
      'service': 'analytics',
      'endpoint': 'POST /events',
      'kind': 'timestamp_format',
      'desc': 'Unix timestamp -> ISO 8601 string',
    },
    'M5': {
      'service': 'catalog',
      'endpoint': 'GET /products',
      'kind': 'pagination_change',
      'desc': 'Offset/limit -> opaque cursor token',
    },
    'M6': {
      'service': 'billing',
      'endpoint': 'GET /invoices',
      'kind': 'error_envelope',
      'desc': 'Raw error -> structured envelope',
    },
    'M7': {
      'service': 'inventory',
      'endpoint': 'GET /stock',
      'kind': 'null_coercion',
      'desc': 'Missing field coerced to null',
    },
    'M8': {
      'service': 'notifications',
      'endpoint': 'POST /dispatch',
      'kind': 'latency_regime',
      'desc': 'Response latency increased by 450ms',
    },
    'M9': {
      'service': 'auth',
      'endpoint': 'POST /oauth/token',
      'kind': 'rate_limit_reduced',
      'desc': 'Burst rate limit throttled from 100/s to 10/s',
    },
    'M10': {
      'service': 'users',
      'endpoint': 'GET /users',
      'kind': 'enum_drift',
      'desc': 'Enum value expanded beyond schema specification',
    },
  };

  /// Parses the compact 45-byte MTU-optimized BLE packet into a DriftEvent.
  static DriftEvent parseBinaryPacket(Uint8List bytes) {
    if (bytes.length != expectedPacketLength) {
      throw FormatException(
        'Invalid BLE packet length: expected $expectedPacketLength bytes, received ${bytes.length}',
      );
    }

    final byteData = ByteData.sublistView(bytes);

    // 1. Magic bytes
    final b1 = byteData.getUint8(0);
    final b2 = byteData.getUint8(1);
    if (b1 != magicByte1 || b2 != magicByte2) {
      throw FormatException(
        'Invalid BLE magic header: 0x${b1.toRadixString(16)} 0x${b2.toRadixString(16)}',
      );
    }

    // 2. Packet type
    final type = byteData.getUint8(2);
    if (type != packetTypeAlert) {
      throw FormatException('Unsupported packet type: $type');
    }

    // 3. Mutation ID (3 bytes ASCII)
    final mCode = String.fromCharCodes(bytes.sublist(3, 6));
    final mutationId = mCode.startsWith('M0') ? 'M${mCode.substring(2)}' : mCode;

    // 4. Confidence (2 bytes uint16 Big-Endian basis points)
    final confBp = byteData.getUint16(6, Endian.big);
    if (confBp > 10000) {
      throw RangeError.range(confBp, 0, 10000, 'confidence_bp');
    }
    final confidence = confBp / 10000.0;

    // 5. Verdict (1 byte)
    final verdictByte = byteData.getUint8(8);
    final String verdict;
    switch (verdictByte) {
      case 0:
        verdict = 'equivalent';
        break;
      case 1:
        verdict = 'breaking';
        break;
      case 2:
        verdict = 'lossy';
        break;
      default:
        throw FormatException('Invalid verdict code: $verdictByte');
    }

    // 6. Timestamp (4 bytes uint32 Big-Endian Unix epoch seconds)
    final epochSec = byteData.getUint32(9, Endian.big);
    final timestamp = DateTime.fromMillisecondsSinceEpoch(epochSec * 1000, isUtc: true);

    // 7. Cryptographic SHA-256 Digest (32 raw bytes -> 64 hex chars)
    final shaBytes = bytes.sublist(13, 45);
    final shaHex = shaBytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();

    // Map to real engine semantics
    final meta = mutationCatalogue[mutationId] ?? {
      'service': 'core',
      'endpoint': '/unknown',
      'kind': 'custom_drift',
      'desc': 'Dynamic mutation',
    };

    return DriftEvent(
      id: mutationId,
      service: meta['service']!,
      endpoint: meta['endpoint']!,
      kind: meta['kind']!,
      verdict: verdict,
      confidence: confidence,
      timestamp: timestamp,
      evidence: {
        'sha256': 'sha256:$shaHex',
        'rawSha256': shaHex,
        'basisPoints': confBp,
        'description': meta['desc']!,
        'transport': 'ble',
      },
    );
  }

  /// Parses UTF-8 JSON payload fallback into a DriftEvent.
  static DriftEvent parseJsonPacket(Uint8List utf8Bytes) {
    final jsonStr = utf8.decode(utf8Bytes);
    final map = jsonDecode(jsonStr) as Map<String, dynamic>;

    final rawId = map['id'] as String;
    final mutationId = rawId.startsWith('M0') ? 'M${rawId.substring(2)}' : rawId;
    final conf = (map['conf'] as num).toDouble();
    final verdict = map['verdict'] as String;
    final hash = map['hash'] as String;
    final tsMs = map['ts'] as int?;

    final timestamp = tsMs != null
        ? DateTime.fromMillisecondsSinceEpoch(tsMs, isUtc: true)
        : DateTime.now().toUtc();

    final meta = mutationCatalogue[mutationId] ?? {
      'service': 'core',
      'endpoint': '/',
      'kind': 'custom_drift',
      'desc': 'JSON drift alert',
    };

    return DriftEvent(
      id: mutationId,
      service: meta['service']!,
      endpoint: meta['endpoint']!,
      kind: meta['kind']!,
      verdict: verdict,
      confidence: conf,
      timestamp: timestamp,
      evidence: {
        'sha256': 'sha256:$hash',
        'rawSha256': hash,
        'transport': 'ble_json',
      },
    );
  }

  /// Serializes a DriftEvent into the 45-byte MTU-optimized binary packet.
  static Uint8List serializeBinaryPacket({
    required String mutationId,
    required double confidence,
    required String verdict,
    required DateTime timestamp,
    required String sha256Hex,
  }) {
    final buffer = Uint8List(expectedPacketLength);
    final bd = ByteData.sublistView(buffer);

    // Magic
    buffer[0] = magicByte1;
    buffer[1] = magicByte2;

    // Type
    buffer[2] = packetTypeAlert;

    // Mutation ID: Pad M1 -> M01, M10 -> M10
    String padded = mutationId.toUpperCase();
    if (RegExp(r'^M\d$').hasMatch(padded)) {
      padded = 'M0${padded.substring(1)}';
    }
    if (padded.length != 3) {
      throw ArgumentError('Mutation ID must format to 3 ASCII chars, got: $padded');
    }
    buffer[3] = padded.codeUnitAt(0);
    buffer[4] = padded.codeUnitAt(1);
    buffer[5] = padded.codeUnitAt(2);

    // Confidence in Basis Points
    final confBp = (confidence.clamp(0.0, 1.0) * 10000).round();
    bd.setUint16(6, confBp, Endian.big);

    // Verdict code
    final int vCode;
    switch (verdict.toLowerCase()) {
      case 'equivalent':
        vCode = 0;
        break;
      case 'breaking':
        vCode = 1;
        break;
      case 'lossy':
        vCode = 2;
        break;
      default:
        throw ArgumentError('Invalid verdict string: $verdict');
    }
    buffer[8] = vCode;

    // Timestamp (epoch seconds)
    final epochSec = (timestamp.millisecondsSinceEpoch ~/ 1000);
    bd.setUint32(9, epochSec, Endian.big);

    // SHA-256 Digest (32 bytes)
    final cleanHex = sha256Hex.startsWith('sha256:') ? sha256Hex.substring(7) : sha256Hex;
    if (cleanHex.length != 64) {
      throw ArgumentError('SHA-256 must be 64 hex characters');
    }
    for (int i = 0; i < 32; i++) {
      buffer[13 + i] = int.parse(cleanHex.substring(i * 2, i * 2 + 2), radix: 16);
    }

    return buffer;
  }
}

/**
 * ---------------------------------------------------------------------------
 * Android BLE Companion Unit Test Suite
 * ---------------------------------------------------------------------------
 */
void main() {
  group('Intra Android Companion BLE Subsystem Test Suite', () {
    test('Pure-Dart RealSha256 matches NIST standard test vectors exactly', () {
      // Empty string standard NIST SHA-256
      final emptyDigest = RealSha256.hexDigest('');
      expect(emptyDigest, equals('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));

      // "abc" standard NIST SHA-256
      final abcDigest = RealSha256.hexDigest('abc');
      expect(abcDigest, equals('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));

      // Real engine payload string
      final enginePayload = '{"service":"users","mutation":"M1","status":"drift_detected"}';
      final digest = RealSha256.hexDigest(enginePayload);
      expect(digest.length, equals(64));
      expect(RegExp(r'^[0-9a-f]{64}$').hasMatch(digest), isTrue);
    });

    test('Parses 45-byte binary BLE packet into DriftEvent preserving engine semantics', () {
      final realSha = RealSha256.hexDigest('M1_field_renamed_evidence');
      final now = DateTime.utc(2026, 10, 11, 14, 30, 0);

      final packetBytes = IntraBlePacketCodec.serializeBinaryPacket(
        mutationId: 'M1',
        confidence: 0.96,
        verdict: 'equivalent',
        timestamp: now,
        sha256Hex: realSha,
      );

      expect(packetBytes.length, equals(45));
      expect(packetBytes[0], equals(0x49)); // 'I'
      expect(packetBytes[1], equals(0x54)); // 'T'

      final event = IntraBlePacketCodec.parseBinaryPacket(packetBytes);

      // Verify DriftEvent engine semantics
      expect(event.id, equals('M1'));
      expect(event.service, equals('users'));
      expect(event.endpoint, equals('GET /users'));
      expect(event.kind, equals('field_renamed'));
      expect(event.verdict, equals('equivalent'));
      expect(event.confidence, closeTo(0.96, 0.0001));
      expect(event.timestamp.millisecondsSinceEpoch, equals(now.millisecondsSinceEpoch));

      // Check verdict flags
      expect(event.isEquivalent, isTrue);
      expect(event.isBreaking, isFalse);
      expect(event.isLossy, isFalse);

      // Verify evidence and SHA-256 integrity
      expect(event.evidence['sha256'], equals('sha256:$realSha'));
      expect(event.evidence['rawSha256'], equals(realSha));
      expect(event.evidence['basisPoints'], equals(9600));
      expect(event.evidence['transport'], equals('ble'));
    });

    test('Parses breaking and lossy drift events across catalogue mutations M1 to M10', () {
      final testCases = [
        {'id': 'M1', 'conf': 0.95, 'verdict': 'equivalent', 'isBreak': false, 'isEq': true, 'isLoss': false},
        {'id': 'M2', 'conf': 0.82, 'verdict': 'lossy', 'isBreak': false, 'isEq': false, 'isLoss': true},
        {'id': 'M3', 'conf': 0.92, 'verdict': 'equivalent', 'isBreak': false, 'isEq': true, 'isLoss': false},
        {'id': 'M4', 'conf': 0.94, 'verdict': 'equivalent', 'isBreak': false, 'isEq': true, 'isLoss': false},
        {'id': 'M5', 'conf': 0.96, 'verdict': 'equivalent', 'isBreak': false, 'isEq': true, 'isLoss': false},
        {'id': 'M6', 'conf': 0.88, 'verdict': 'breaking', 'isBreak': true, 'isEq': false, 'isLoss': false},
        {'id': 'M7', 'conf': 0.79, 'verdict': 'lossy', 'isBreak': false, 'isEq': false, 'isLoss': true},
        {'id': 'M8', 'conf': 0.98, 'verdict': 'breaking', 'isBreak': true, 'isEq': false, 'isLoss': false},
        {'id': 'M9', 'conf': 0.99, 'verdict': 'breaking', 'isBreak': true, 'isEq': false, 'isLoss': false},
        {'id': 'M10', 'conf': 0.72, 'verdict': 'breaking', 'isBreak': true, 'isEq': false, 'isLoss': false},
      ];

      for (final tc in testCases) {
        final id = tc['id'] as String;
        final conf = tc['conf'] as double;
        final verdict = tc['verdict'] as String;
        final now = DateTime.utc(2026, 10, 11, 15, 0, 0);
        final realSha = RealSha256.hexDigest('catalogue_test_$id');

        final packet = IntraBlePacketCodec.serializeBinaryPacket(
          mutationId: id,
          confidence: conf,
          verdict: verdict,
          timestamp: now,
          sha256Hex: realSha,
        );

        final event = IntraBlePacketCodec.parseBinaryPacket(packet);

        expect(event.id, equals(id));
        expect(event.verdict, equals(verdict));
        expect(event.confidence, closeTo(conf, 0.0001));
        expect(event.isBreaking, equals(tc['isBreak']));
        expect(event.isEquivalent, equals(tc['isEq']));
        expect(event.isLossy, equals(tc['isLoss']));
        expect(event.evidence['rawSha256'], equals(realSha));
      }
    });

    test('Rejects adversarial and corrupted BLE packets gracefully', () {
      // 1. Truncated packet
      final shortPacket = Uint8List(44);
      expect(
        () => IntraBlePacketCodec.parseBinaryPacket(shortPacket),
        throwsA(isA<FormatException>()),
      );

      // 2. Corrupted magic header
      final badMagic = Uint8List(45);
      badMagic[0] = 0x00;
      badMagic[1] = 0x00;
      expect(
        () => IntraBlePacketCodec.parseBinaryPacket(badMagic),
        throwsA(isA<FormatException>()),
      );

      // 3. Unsupported packet type
      final badType = Uint8List(45);
      badType[0] = 0x49;
      badType[1] = 0x54;
      badType[2] = 0xFE;
      expect(
        () => IntraBlePacketCodec.parseBinaryPacket(badType),
        throwsA(isA<FormatException>()),
      );

      // 4. Out-of-bounds confidence (> 10000 basis points)
      final badConf = Uint8List(45);
      badConf[0] = 0x49;
      badConf[1] = 0x54;
      badConf[2] = 0x01;
      badConf[3] = 'M'.codeUnitAt(0);
      badConf[4] = '0'.codeUnitAt(0);
      badConf[5] = '1'.codeUnitAt(0);
      ByteData.sublistView(badConf).setUint16(6, 15000, Endian.big); // 15000 > 10000 bp
      expect(
        () => IntraBlePacketCodec.parseBinaryPacket(badConf),
        throwsA(isA<RangeError>()),
      );

      // 5. Invalid verdict code (> 2)
      final badVerdict = Uint8List(45);
      badVerdict[0] = 0x49;
      badVerdict[1] = 0x54;
      badVerdict[2] = 0x01;
      badVerdict[3] = 'M'.codeUnitAt(0);
      badVerdict[4] = '0'.codeUnitAt(0);
      badVerdict[5] = '1'.codeUnitAt(0);
      badVerdict[8] = 0x99; // Invalid verdict code
      expect(
        () => IntraBlePacketCodec.parseBinaryPacket(badVerdict),
        throwsA(isA<FormatException>()),
      );
    });

    test('Parses JSON BLE fallback packet preserving engine semantics', () {
      final realSha = RealSha256.hexDigest('json_fallback_payload');
      final jsonPayload = jsonEncode({
        'id': 'M3',
        'conf': 0.92,
        'verdict': 'equivalent',
        'hash': realSha.substring(0, 16),
        'ts': 1760000000000,
      });

      final utf8Bytes = Uint8List.fromList(utf8.encode(jsonPayload));
      final event = IntraBlePacketCodec.parseJsonPacket(utf8Bytes);

      expect(event.id, equals('M3'));
      expect(event.service, equals('payments'));
      expect(event.endpoint, equals('POST /payments/charge'));
      expect(event.kind, equals('unit_shift'));
      expect(event.verdict, equals('equivalent'));
      expect(event.confidence, equals(0.92));
      expect(event.isEquivalent, isTrue);
      expect(event.evidence['transport'], equals('ble_json'));
      expect(event.evidence['rawSha256'], equals(realSha.substring(0, 16)));
    });

    test('Complete round-trip: serialization -> transmission simulation -> DriftEvent', () {
      final originTime = DateTime.utc(2026, 10, 11, 16, 45, 12);
      final shaHex = RealSha256.hexDigest('round_trip_tamper_check');

      // 1. Web client serializes
      final wireBytes = IntraBlePacketCodec.serializeBinaryPacket(
        mutationId: 'M10',
        confidence: 0.72,
        verdict: 'breaking',
        timestamp: originTime,
        sha256Hex: shaHex,
      );

      // 2. Transmitted over BLE GATT
      expect(wireBytes.length, equals(45));

      // 3. Android peripheral deserializes into DriftEvent
      final event = IntraBlePacketCodec.parseBinaryPacket(wireBytes);

      expect(event.id, equals('M10'));
      expect(event.service, equals('users'));
      expect(event.isBreaking, isTrue);
      expect(event.confidence, closeTo(0.72, 0.0001));
      expect(event.timestamp.millisecondsSinceEpoch, equals(originTime.millisecondsSinceEpoch));
      expect(event.evidence['rawSha256'], equals(shaHex));

      // 4. Verify DriftEvent JSON serialization round-trip
      final eventJson = event.toJson();
      expect(eventJson['id'], equals('M10'));
      expect(eventJson['verdict'], equals('breaking'));
      expect(eventJson['confidence'], closeTo(0.72, 0.0001));

      final restoredEvent = DriftEvent.fromJson(eventJson);
      expect(restoredEvent.id, equals('M10'));
      expect(restoredEvent.isBreaking, isTrue);
      expect(restoredEvent.evidence['rawSha256'], equals(shaHex));
    });
  });
}
