class DriftEvent {
  final String id;
  final String service;
  final String endpoint;
  final String kind;
  final String verdict; // 'equivalent', 'lossy', 'breaking'
  final double confidence;
  final DateTime timestamp;
  final Map<String, dynamic> evidence;

  DriftEvent({
    required this.id,
    required this.service,
    required this.endpoint,
    required this.kind,
    required this.verdict,
    required this.confidence,
    required this.timestamp,
    this.evidence = const {},
  });

  bool get isBreaking => verdict == 'breaking';
  bool get isLossy => verdict == 'lossy';
  bool get isEquivalent => verdict == 'equivalent';

  factory DriftEvent.fromJson(Map<String, dynamic> json) {
    return DriftEvent(
      id: json['id'] as String? ?? 'CHG_UNKNOWN',
      service: json['service'] as String? ?? 'unknown',
      endpoint: json['endpoint'] as String? ?? '/',
      kind: json['kind'] as String? ?? 'unknown_drift',
      verdict: json['verdict'] as String? ?? 'unknown',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.85,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'] as String) ?? DateTime.now()
          : DateTime.now(),
      evidence: json['evidence'] as Map<String, dynamic>? ?? {},
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'service': service,
      'endpoint': endpoint,
      'kind': kind,
      'verdict': verdict,
      'confidence': confidence,
      'timestamp': timestamp.toIso8601String(),
      'evidence': evidence,
    };
  }
}

class SwitchboardMutation {
  final String id;
  final String name;
  final String service;
  final String endpoint;
  final String description;
  bool active;

  SwitchboardMutation({
    required this.id,
    required this.name,
    required this.service,
    required this.endpoint,
    required this.description,
    this.active = false,
  });

  factory SwitchboardMutation.fromJson(Map<String, dynamic> json) {
    return SwitchboardMutation(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      service: json['service'] as String? ?? '',
      endpoint: json['endpoint'] as String? ?? '',
      description: json['description'] as String? ?? '',
      active: json['active'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'service': service,
      'endpoint': endpoint,
      'description': description,
      'active': active,
    };
  }
}

class AgentTrialHistory {
  final String id;
  final String title;
  final String action;
  final DateTime timestamp;
  final String sha;
  final String verdict;
  final double confidence;

  AgentTrialHistory({
    required this.id,
    required this.title,
    required this.action,
    required this.timestamp,
    required this.sha,
    required this.verdict,
    required this.confidence,
  });

  factory AgentTrialHistory.fromJson(Map<String, dynamic> json) {
    return AgentTrialHistory(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      action: json['action'] as String? ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'] as String) ?? DateTime.now()
          : DateTime.now(),
      sha: json['sha'] as String? ?? 'sha256:0000',
      verdict: json['verdict'] as String? ?? 'equivalent',
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0.95,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'action': action,
      'timestamp': timestamp.toIso8601String(),
      'sha': sha,
      'verdict': verdict,
      'confidence': confidence,
    };
  }
}
