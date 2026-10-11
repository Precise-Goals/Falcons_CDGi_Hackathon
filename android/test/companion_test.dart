import 'package:flutter_test/flutter_test.dart';
import 'package:intra_companion/models/drift_event.dart';
import 'package:intra_companion/theme/app_theme.dart';
import 'package:intra_companion/services/sound_service.dart';
import 'package:intra_companion/services/ble_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

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

    test('BleService GATT UUIDs and configuration conform to ImprovementPlan.md', () {
      expect(BleService.serviceUuid, equals('19e2613e-9ed7-3d97-0af0-6bca28e799e5'));
      expect(BleService.charDriftAlert, equals('19e2613e-9ed7-3d97-0af0-6bca28e70001'));
      expect(BleService.charAdapterAction, equals('19e2613e-9ed7-3d97-0af0-6bca28e70002'));
      expect(BleService.charHeartbeat, equals('19e2613e-9ed7-3d97-0af0-6bca28e70003'));
      expect(BleService.charTelemetry, equals('19e2613e-9ed7-3d97-0af0-6bca28e70004'));
    });

    test('BleService encodes and parses 45-byte compact binary drift alert packet', () {
      final now = DateTime.utc(2026, 10, 11, 12, 0, 0);
      const testHash = 'c8a41234567890abcdef1234567890abcdef1234567890abcdef1234567890ab';
      final packet = BleService.encodeDriftAlertPacket(
        mutationId: 'M1',
        confidence: 0.96,
        verdict: 'equivalent',
        timestamp: now,
        hash: testHash,
      );

      expect(packet.length, equals(45));
      expect(packet[0], equals(0x49));
      expect(packet[1], equals(0x54));
      expect(packet[2], equals(0x01));

      final parsed = BleService.parsePacket(packet);
      expect(parsed.mutationId, equals('M1'));
      expect(parsed.confidence, closeTo(0.96, 0.001));
      expect(parsed.verdict, equals('equivalent'));
      expect(parsed.timestamp.toUtc().millisecondsSinceEpoch, equals(now.millisecondsSinceEpoch));
      expect(parsed.hash, equals('sha256:$testHash'));

      final driftEvent = parsed.toDriftEvent();
      expect(driftEvent.id, equals('M1'));
      expect(driftEvent.service, equals('users'));
      expect(driftEvent.endpoint, equals('/users'));
      expect(driftEvent.kind, equals('field_renamed'));
      expect(driftEvent.evidence['transport'], equals('ble_gatt_airlink'));
      expect(driftEvent.evidence['latency'], equals('<20ms'));
    });

    test('BleService parses breaking drift alert with accurate confidence and timestamp', () {
      final now = DateTime.utc(2026, 10, 11, 12, 30, 0);
      final packet = BleService.encodeDriftAlertPacket(
        mutationId: 'M10',
        confidence: 0.825,
        verdict: 'breaking',
        timestamp: now,
        hash: 'sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      );

      final parsed = BleService.parsePacket(packet);
      expect(parsed.mutationId, equals('M10'));
      expect(parsed.confidence, closeTo(0.825, 0.001));
      expect(parsed.verdict, equals('breaking'));
      final driftEvent = parsed.toDriftEvent();
      expect(driftEvent.isBreaking, isTrue);
      expect(driftEvent.service, equals('users'));
    });

    test('BleService handles incoming packet: triggers alert tone, heavy impact, and emits to onBleAlert', () async {
      final bleService = BleService();
      final List<DriftEvent> receivedAlerts = [];
      final sub = bleService.onBleAlert.listen((e) => receivedAlerts.add(e));

      final now = DateTime.utc(2026, 10, 11, 13, 0, 0);
      final packet = BleService.encodeDriftAlertPacket(
        mutationId: 'M3',
        confidence: 0.99,
        verdict: 'breaking',
        timestamp: now,
        hash: 'sha256:aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899',
      );

      final event = await bleService.handleIncomingPacket(packet);
      await Future.delayed(const Duration(milliseconds: 50));

      expect(receivedAlerts.length, equals(1));
      expect(receivedAlerts.first.id, equals('M3'));
      expect(receivedAlerts.first.service, equals('payments'));
      expect(receivedAlerts.first.isBreaking, isTrue);
      expect(event.id, equals('M3'));
      expect(bleService.alertsReceivedCount, equals(1));

      await sub.cancel();
      bleService.dispose();
    });

    test('BleService dispatches adapter approval and rollback over airlink bridge', () async {
      final bleService = BleService();
      final List<Map<String, dynamic>> dispatchedActions = [];
      final sub = bleService.onAdapterActionSent.listen((action) => dispatchedActions.add(action));

      final approved = await bleService.sendAdapterApproval('prop_m1_01');
      await Future<void>.delayed(const Duration(milliseconds: 20));
      expect(approved, isTrue);
      expect(dispatchedActions.length, equals(1));
      expect(dispatchedActions.first['action'], equals('approve'));
      expect(dispatchedActions.first['proposalId'], equals('prop_m1_01'));

      final rolledBack = await bleService.sendAdapterRollback('prop_m10_01');
      await Future<void>.delayed(const Duration(milliseconds: 20));
      expect(rolledBack, isTrue);
      expect(dispatchedActions.length, equals(2));
      expect(dispatchedActions.last['action'], equals('rollback'));
      expect(dispatchedActions.last['proposalId'], equals('prop_m10_01'));

      await sub.cancel();
      bleService.dispose();
    });

    test('BleService transitions through airlink states during pairing check', () async {
      final bleService = BleService();
      expect(bleService.state, equals(BleAirlinkState.disconnected));

      await bleService.startAdvertising();
      expect(bleService.isAdvertising, isTrue);
      expect(bleService.stateText, equals('Advertising'));

      final success = await bleService.checkPairing();
      expect(success, isTrue);
      expect(bleService.isConnected, isTrue);
      expect(bleService.latencyMs, lessThan(20));
      expect(bleService.stateText, equals('Connected'));

      await bleService.stopAdvertising();
      expect(bleService.state, equals(BleAirlinkState.disconnected));
      bleService.dispose();
    });
  });
}
