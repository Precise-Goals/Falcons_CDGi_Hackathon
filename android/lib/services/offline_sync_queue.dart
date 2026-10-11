import 'dart:collection';

// Offline Sync Queue for Airlink Audit Log Replication
// Provides FIFO queuing, max-capacity eviction, and batch flushing
// for BLE airlink synchronization across companion devices. Zero external dependencies.

class AuditSyncEvent {
  final String eventId;
  final String serviceName;
  final String action;
  final int timestamp;
  final Map<String, dynamic> metadata;

  const AuditSyncEvent({
    required this.eventId,
    required this.serviceName,
    required this.action,
    required this.timestamp,
    this.metadata = const {},
  });

  Map<String, dynamic> toJson() => {
    'eventId': eventId,
    'serviceName': serviceName,
    'action': action,
    'timestamp': timestamp,
    'metadata': metadata,
  };

  factory AuditSyncEvent.fromJson(Map<String, dynamic> json) {
    return AuditSyncEvent(
      eventId: json['eventId'] as String,
      serviceName: json['serviceName'] as String,
      action: json['action'] as String,
      timestamp: json['timestamp'] as int,
      metadata: (json['metadata'] as Map<String, dynamic>?) ?? {},
    );
  }
}

class OfflineSyncQueue {
  final int maxCapacity;
  final Queue<AuditSyncEvent> _queue = Queue<AuditSyncEvent>();

  OfflineSyncQueue({this.maxCapacity = 500});

  /// Current number of queued events awaiting sync.
  int get length => _queue.length;

  /// True if no events are pending synchronization.
  bool get isEmpty => _queue.isEmpty;

  /// Enqueues an event into FIFO sync buffer. Evicts oldest event if buffer is full.
  void enqueue(AuditSyncEvent event) {
    if (_queue.length >= maxCapacity) {
      _queue.removeFirst(); // Drop oldest event on capacity overflow
    }
    _queue.addLast(event);
  }

  /// Peeks at the next pending event without dequeuing.
  AuditSyncEvent? peek() {
    return _queue.isNotEmpty ? _queue.first : null;
  }

  /// Drains up to [batchSize] events from the front of the queue.
  List<AuditSyncEvent> drainBatch({int batchSize = 50}) {
    final count = batchSize < _queue.length ? batchSize : _queue.length;
    final batch = <AuditSyncEvent>[];
    for (int i = 0; i < count; i++) {
      batch.add(_queue.removeFirst());
    }
    return batch;
  }

  /// Clears all pending sync events.
  void clear() {
    _queue.clear();
  }
}
