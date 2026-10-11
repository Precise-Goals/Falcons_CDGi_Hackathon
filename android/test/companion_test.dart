import 'package:flutter_test/flutter_test.dart';
import 'package:intra_companion/models/drift_event.dart';
import 'package:intra_companion/theme/app_theme.dart';
import 'package:intra_companion/services/sound_service.dart';

void main() {
  group('Intra Mobile Companion Test Suite', () {
    test('DriftEvent parsing and classification', () {
      final jsonEquivalent = {
        'id': 'M1',
        'service': 'users',
        'endpoint': '/users',
        'kind': 'field_renamed',
        'verdict': 'equivalent',
        'confidence': 0.96,
        'evidence': {'oldField': 'name', 'newField': 'display_name'},
      };

      final eventEq = DriftEvent.fromJson(jsonEquivalent);
      expect(eventEq.id, equals('M1'));
      expect(eventEq.service, equals('users'));
      expect(eventEq.isEquivalent, isTrue);
      expect(eventEq.isBreaking, isFalse);
      expect(eventEq.confidence, equals(0.96));

      final jsonBreaking = {
        'id': 'M10',
        'service': 'users',
        'endpoint': '/users',
        'kind': 'enum_drift',
        'verdict': 'breaking',
        'confidence': 0.72,
      };

      final eventBrk = DriftEvent.fromJson(jsonBreaking);
      expect(eventBrk.isBreaking, isTrue);
      expect(eventBrk.isEquivalent, isFalse);
    });

    test('SwitchboardMutation defaults and JSON round-trip', () {
      final m = SwitchboardMutation(
        id: 'M3',
        name: 'Unit & Scale Shift',
        service: 'payments',
        endpoint: '/payments/charge',
        description: 'Converts float dollars to integer cents',
        active: true,
      );

      final json = m.toJson();
      expect(json['id'], equals('M3'));
      expect(json['active'], isTrue);

      final parsed = SwitchboardMutation.fromJson(json);
      expect(parsed.id, equals('M3'));
      expect(parsed.active, isTrue);
    });

    test('AgentTrialHistory serialization', () {
      final now = DateTime.now();
      final trial = AgentTrialHistory(
        id: 'trial_99',
        title: 'M5 Pagination Adapted',
        action: 'Cursor Injected',
        timestamp: now,
        sha: 'sha256:abc12345',
        verdict: 'equivalent',
        confidence: 0.95,
      );

      final json = trial.toJson();
      final parsed = AgentTrialHistory.fromJson(json);

      expect(parsed.id, equals('trial_99'));
      expect(parsed.sha, equals('sha256:abc12345'));
      expect(parsed.verdict, equals('equivalent'));
    });

    test('AppColors palette adheres to Washi & Crimson design system', () {
      expect(AppColors.crimson.toARGB32(), equals(0xFFC8102E));
      expect(AppColors.cream.toARGB32(), equals(0xFFFAF7F2));
      expect(AppColors.charcoal.toARGB32(), equals(0xFF0A0A0A));
    });

    test('SoundService toggles sound state reliably', () {
      SoundService.soundEnabled = true;
      expect(SoundService.soundEnabled, isTrue);

      SoundService.soundEnabled = false;
      expect(SoundService.soundEnabled, isFalse);

      SoundService.soundEnabled = true;
    });
  });
}
