import 'dart:typed_data';

/**
 * ---------------------------------------------------------------------------
 * Pure Dart CRC-16-CCITT & CRC-32 Frame Integrity Validator for BLE Packets
 * Zero external dependencies.
 * ---------------------------------------------------------------------------
 */
class BleCrcValidator {
  static const int _crc16Polynomial = 0x1021;
  static const int _crc32Polynomial = 0xEDB88320;

  /// Computes CRC-16-CCITT (False) checksum over raw byte payload.
  static int computeCrc16(List<int> bytes) {
    int crc = 0xFFFF;
    for (final byte in bytes) {
      crc ^= (byte << 8) & 0xFFFF;
      for (int i = 0; i < 8; i++) {
        if ((crc & 0x8000) != 0) {
          crc = ((crc << 1) ^ _crc16Polynomial) & 0xFFFF;
        } else {
          crc = (crc << 1) & 0xFFFF;
        }
      }
    }
    return crc & 0xFFFF;
  }

  /// Verifies payload matches expected 16-bit CRC checksum.
  static bool verifyCrc16(List<int> payload, int expectedCrc) {
    return computeCrc16(payload) == (expectedCrc & 0xFFFF);
  }

  /// Computes standard 32-bit CRC (IEEE 802.3).
  static int computeCrc32(List<int> bytes) {
    int crc = 0xFFFFFFFF;
    for (final byte in bytes) {
      crc ^= byte & 0xFF;
      for (int i = 0; i < 8; i++) {
        if ((crc & 1) != 0) {
          crc = ((crc >>> 1) ^ _crc32Polynomial) & 0xFFFFFFFF;
        } else {
          crc = (crc >>> 1) & 0xFFFFFFFF;
        }
      }
    }
    return (~crc) & 0xFFFFFFFF;
  }

  /// Appends 2-byte big-endian CRC16 checksum to packet.
  static Uint8List appendCrc16(Uint8List payload) {
    final crc = computeCrc16(payload);
    final buffer = Uint8List(payload.length + 2);
    buffer.setRange(0, payload.length, payload);
    buffer[payload.length] = (crc >> 8) & 0xFF;
    buffer[payload.length + 1] = crc & 0xFF;
    return buffer;
  }

  /// Validates frame integrity and extracts original payload without CRC bytes.
  static Uint8List? validateAndStripCrc16(Uint8List frame) {
    if (frame.length < 3) return null;
    final payloadLength = frame.length - 2;
    final payload = frame.sublist(0, payloadLength);
    final expectedCrc = (frame[payloadLength] << 8) | frame[payloadLength + 1];

    if (verifyCrc16(payload, expectedCrc)) {
      return Uint8List.fromList(payload);
    }
    return null;
  }
}
