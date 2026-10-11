import 'package:flutter/services.dart';

class SoundService {
  static bool soundEnabled = true;

  /// Plays an audible alarm beep and triggers haptic vibration
  static Future<void> playAlarmBeep({bool isCritical = false}) async {
    if (!soundEnabled) return;

    try {
      // 1. Trigger native alert sound
      await SystemSound.play(SystemSoundType.alert);

      // 2. Heavy haptic vibration pattern for drift notification
      if (isCritical) {
        await HapticFeedback.heavyImpact();
        await Future.delayed(const Duration(milliseconds: 150));
        await HapticFeedback.heavyImpact();
      } else {
        await HapticFeedback.mediumImpact();
      }
    } catch (_) {
      // Graceful fallback if platform does not support hardware feedback
    }
  }

  /// Subtle click sound for UI actions
  static Future<void> playClickSound() async {
    if (!soundEnabled) return;
    try {
      await SystemSound.play(SystemSoundType.click);
      await HapticFeedback.selectionClick();
    } catch (_) {}
  }
}
