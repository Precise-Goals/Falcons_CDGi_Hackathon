// Haptic Vibration Sequence Generator for Drift & Circuit Break Alerts
// Generates deterministic millisecond waveform timings and amplitudes
// for Android vibration effect actuators. Zero external dependencies.

enum HapticSeverity {
  neutral,
  warning,
  critical,
  recovery,
}

class HapticWaveform {
  final String label;
  final List<int> timingsMs;
  final List<int> amplitudes;
  final bool repeat;

  const HapticWaveform({
    required this.label,
    required this.timingsMs,
    required this.amplitudes,
    this.repeat = false,
  });

  int get totalDurationMs => timingsMs.fold(0, (acc, val) => acc + val);
}

class HapticPatternGenerator {
  /// Generates P0 Critical Circuit Breaker Waveform (rapid triple heavy pulse).
  static HapticWaveform criticalCircuitBreakWaveform() {
    return const HapticWaveform(
      label: 'CRITICAL_CIRCUIT_BREAK',
      timingsMs: [0, 150, 80, 150, 80, 300],
      amplitudes: [0, 255, 0, 255, 0, 255],
    );
  }

  /// Generates P1 Semantic Drift Warning Waveform (double medium pulse).
  static HapticWaveform warningWaveform() {
    return const HapticWaveform(
      label: 'SEMANTIC_DRIFT_WARNING',
      timingsMs: [0, 100, 100, 100],
      amplitudes: [0, 180, 0, 180],
    );
  }

  /// Generates Canary Promotion / Adapter Active Success Waveform (ascending chime-like pattern).
  static HapticWaveform promoteWaveform() {
    return const HapticWaveform(
      label: 'CANARY_PROMOTED_OK',
      timingsMs: [0, 50, 50, 80, 50, 120],
      amplitudes: [0, 100, 0, 160, 0, 220],
    );
  }

  /// Generates light tactile tick for switchboard mutation or UI interaction.
  static HapticWaveform neutralTick() {
    return const HapticWaveform(
      label: 'NEUTRAL_TICK',
      timingsMs: [0, 20],
      amplitudes: [0, 120],
    );
  }

  /// Resolves waveform pattern by alert severity level.
  static HapticWaveform patternForSeverity(HapticSeverity severity) {
    switch (severity) {
      case HapticSeverity.critical:
        return criticalCircuitBreakWaveform();
      case HapticSeverity.warning:
        return warningWaveform();
      case HapticSeverity.recovery:
        return promoteWaveform();
      case HapticSeverity.neutral:
        return neutralTick();
    }
  }
}
