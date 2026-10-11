import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:intra_companion/services/crc_validator.dart';

void main() {
  group('BLE CRC Frame Integrity Validator Test Suite', () {
    test('computes deterministic CRC-16 checksums matching standard vectors', () {
      final input = utf8.encode('123456789');
      final crc = BleCrcValidator.computeCrc16(input);

      // Standard CRC-16-CCITT False on '123456789' is 0x29B1
      expect(crc, equals(0x29B1));
      expect(BleCrcValidator.verifyCrc16(input, 0x29B1), isTrue);
      expect(BleCrcValidator.verifyCrc16(input, 0x0000), isFalse);
    });

    test('roundtrips packet frame through append and strip helpers', () {
      final rawPacket = Uint8List.fromList([0x01, 0x02, 0x03, 0xAA, 0xBB, 0xCC]);
      final framed = BleCrcValidator.appendCrc16(rawPacket);

      expect(framed.length, equals(rawPacket.length + 2));

      final stripped = BleCrcValidator.validateAndStripCrc16(framed);
      expect(stripped, isNotNull);
      expect(stripped, equals(rawPacket));
    });

    test('detects and rejects single-bit frame corruption', () {
      final rawPacket = Uint8List.fromList([0x10, 0x20, 0x30, 0x40]);
      final framed = BleCrcValidator.appendCrc16(rawPacket);

      // Corrupt 1 bit in payload
      framed[1] ^= 0x01;

      final corrupted = BleCrcValidator.validateAndStripCrc16(framed);
      expect(corrupted, isNull);
    });

    test('computes standard IEEE 802.3 CRC-32 checksums', () {
      final input = utf8.encode('123456789');
      final crc32 = BleCrcValidator.computeCrc32(input);

      // Standard CRC-32 on '123456789' is 0xCBF43926
      expect(crc32, equals(0xCBF43926));
      expect(BleCrcValidator.verifyCrc32(input, 0xCBF43926), isTrue);
    });
  });
}
