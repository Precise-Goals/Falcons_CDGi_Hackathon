import 'package:flutter_test/flutter_test.dart';
import 'package:intra_companion/services/offline_sync_queue.dart';

void main() {
  group('Offline Sync Queue Test Suite', () {
    test('enqueues and preserves strict FIFO order', () {
      final queue = OfflineSyncQueue(maxCapacity: 10);
      final ev1 = AuditSyncEvent(
        eventId: 'evt-1',
        serviceName: 'stripe-billing',
        action: 'OBSERVE',
        timestamp: 1000,
      );
      final ev2 = AuditSyncEvent(
        eventId: 'evt-2',
        serviceName: 'fedex-shipping',
        action: 'DRIFT_DETECTED',
        timestamp: 2000,
      );

      queue.enqueue(ev1);
      queue.enqueue(ev2);

      expect(queue.length, equals(2));
      expect(queue.peek()?.eventId, equals('evt-1'));

      final batch = queue.drainBatch(batchSize: 1);
      expect(batch.length, equals(1));
      expect(batch.first.eventId, equals('evt-1'));
      expect(queue.length, equals(1));
      expect(queue.peek()?.eventId, equals('evt-2'));
    });

    test('evicts oldest elements when exceeding maximum capacity', () {
      final queue = OfflineSyncQueue(maxCapacity: 3);

      for (int i = 1; i <= 5; i++) {
        queue.enqueue(AuditSyncEvent(
          eventId: 'evt-$i',
          serviceName: 'service',
          action: 'PING',
          timestamp: i * 1000,
        ));
      }

      expect(queue.length, equals(3));
      // First two (evt-1, evt-2) should have been evicted; queue contains evt-3, evt-4, evt-5
      expect(queue.peek()?.eventId, equals('evt-3'));

      final all = queue.drainBatch(batchSize: 10);
      expect(all.map((e) => e.eventId).toList(), equals(['evt-3', 'evt-4', 'evt-5']));
      expect(queue.isEmpty, isTrue);
    });

    test('serializes and deserializes AuditSyncEvent faithfully', () {
      final event = AuditSyncEvent(
        eventId: 'evt-test-json',
        serviceName: 'twilio-sms',
        action: 'CIRCUIT_BREAK',
        timestamp: 1718000000,
        metadata: {'severity': 'P0', 'trigger': 'Wald_SPRT'},
      );

      final json = event.toJson();
      final restored = AuditSyncEvent.fromJson(json);

      expect(restored.eventId, equals(event.eventId));
      expect(restored.serviceName, equals(event.serviceName));
      expect(restored.action, equals(event.action));
      expect(restored.timestamp, equals(event.timestamp));
      expect(restored.metadata['severity'], equals('P0'));
    });

    test('clears all queued events instantly', () {
      final queue = OfflineSyncQueue();
      queue.enqueue(AuditSyncEvent(
        eventId: 'ev',
        serviceName: 'srv',
        action: 'ACT',
        timestamp: 1,
      ));
      expect(queue.isEmpty, isFalse);
      queue.clear();
      expect(queue.isEmpty, isTrue);
      expect(queue.length, equals(0));
    });
  });
}
