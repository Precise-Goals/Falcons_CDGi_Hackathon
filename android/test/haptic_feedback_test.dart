import 'package:flutter_test/flutter_test.dart';
import 'package:intra_companion/services/haptic_feedback_service.dart';

void main() {
  group('Haptic Vibration Sequence Generator Test Suite', () {
    test('generates critical circuit breaker waveform with high amplitude pulses', () {
      final waveform = HapticPatternGenerator.criticalCircuitBreakWaveform();

      expect(waveform.label, equals('CRITICAL_CIRCUIT_BREAK'));
      expect(waveform.timingsMs.length, equals(6));
      expect(waveform.amplitudes.length, equals(6));
      expect(waveform.amplitudes, contains(255));
      expect(waveform.totalDurationMs, equals(760));
    });

    test('generates semantic drift warning waveform with double pulse', () {
      final waveform = HapticPatternGenerator.warningWaveform();

      expect(waveform.label, equals('SEMANTIC_DRIFT_WARNING'));
      expect(waveform.timingsMs.length, equals(4));
      expect(waveform.amplitudes.length, equals(4));
      expect(waveform.amplitudes[1], equals(180));
      expect(waveform.totalDurationMs, equals(300));
    });

    test('generates canary promotion waveform with ascending amplitudes', () {
      final waveform = HapticPatternGenerator.promoteWaveform();

      expect(waveform.label, equals('CANARY_PROMOTED_OK'));
      expect(waveform.timingsMs.length, equals(6));
      // Amplitudes should strictly ascend for active pulses
      expect(waveform.amplitudes[1], lessThan(waveform.amplitudes[3]));
      expect(waveform.amplitudes[3], lessThan(waveform.amplitudes[5]));
    });

    test('generates subtle neutral tick for UI mutations', () {
      final waveform = HapticPatternGenerator.neutralTick();

      expect(waveform.label, equals('NEUTRAL_TICK'));
      expect(waveform.totalDurationMs, equals(20));
      expect(waveform.amplitudes.last, equals(120));
    });

    test('maps all HapticSeverity enum values to dedicated non-null waveforms', () {
      for (final severity in HapticSeverity.values) {
        final pattern = HapticPatternGenerator.patternForSeverity(severity);
        expect(pattern, isNotNull);
        expect(pattern.timingsMs.length, equals(pattern.amplitudes.length));
        expect(pattern.totalDurationMs, greaterThan(0));
      }
    });
  });
}
