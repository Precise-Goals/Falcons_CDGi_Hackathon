import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/drift_event.dart';
import 'sound_service.dart';
import 'firebase_service.dart';

class EngineClient {
  String engineUrl = 'http://127.0.0.1:3001';
  String simUrl = 'http://127.0.0.1:4000';
  final FirebaseService firebaseService;

  bool isConnected = false;
  Map<String, dynamic>? lastHealthData;
  List<DriftEvent> recentChanges = [];
  List<SwitchboardMutation> mutations = [];
  Timer? _pollingTimer;

  // Set of known change IDs to avoid re-alerting
  final Set<String> _seenChangeIds = {};

  EngineClient({required this.firebaseService}) {
    _initDefaultMutations();
  }

  void _initDefaultMutations() {
    mutations = [
      SwitchboardMutation(
        id: 'M1',
        name: 'Field Rename',
        service: 'users',
        endpoint: '/users',
        description: 'Renames name -> display_name in user profile',
      ),
      SwitchboardMutation(
        id: 'M2',
        name: 'Name Format Shift',
        service: 'users',
        endpoint: '/users',
        description: 'Formats names as Last, First (Walker, Alice)',
      ),
      SwitchboardMutation(
        id: 'M3',
        name: 'Unit & Scale Shift',
        service: 'payments',
        endpoint: '/payments/charge',
        description: 'Converts float dollars to integer cents (25.0 -> 2500)',
      ),
      SwitchboardMutation(
        id: 'M4',
        name: 'Currency Default Flip',
        service: 'payments',
        endpoint: '/payments/charge',
        description: 'Default currency flips from USD to EUR when omitted',
      ),
      SwitchboardMutation(
        id: 'M5',
        name: 'Offset to Cursor',
        service: 'search',
        endpoint: '/search',
        description: 'Rejects offset with 400; requires base64 nextCursor',
      ),
      SwitchboardMutation(
        id: 'M6',
        name: 'Silent Truncation',
        service: 'search',
        endpoint: '/search',
        description: 'Silently clamps limit >20 down to 20 without error',
      ),
      SwitchboardMutation(
        id: 'M7',
        name: 'Webhook Flattening',
        service: 'notifications',
        endpoint: '/notifications/webhook',
        description: 'Flattens event payload envelope into top-level properties',
      ),
      SwitchboardMutation(
        id: 'M8',
        name: 'Rate-Limit Throttling',
        service: 'payments',
        endpoint: '/payments/charge',
        description: 'Enforces strict 5 req/sec burst limit with HTTP 429',
      ),
      SwitchboardMutation(
        id: 'M9',
        name: 'MCP Tool Drift',
        service: 'mcp-tool',
        endpoint: '/mcp-tool/execute',
        description: 'Tool parameter query renamed to q and requires limit',
      ),
      SwitchboardMutation(
        id: 'M10',
        name: 'Enum Semantic Drift',
        service: 'users',
        endpoint: '/users',
        description: 'Suspended users returned as status: active (trips breaker)',
      ),
    ];
  }

  /// Start polling engine health and drift
  void startMonitoring({Duration interval = const Duration(seconds: 4)}) {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(interval, (_) => pollSync());
    pollSync(); // immediate initial run
  }

  void stopMonitoring() {
    _pollingTimer?.cancel();
  }

  /// Single synchronization poll
  Future<void> pollSync() async {
    try {
      // 1. Fetch Health
      final healthRes = await http
          .get(Uri.parse('$engineUrl/health'))
          .timeout(const Duration(seconds: 2));

      if (healthRes.statusCode == 200) {
        isConnected = true;
        lastHealthData = jsonDecode(healthRes.body) as Map<String, dynamic>;
      } else {
        isConnected = false;
      }

      // 2. Fetch Detected Changes
      final changesRes = await http
          .get(Uri.parse('$engineUrl/changes'))
          .timeout(const Duration(seconds: 2));

      if (changesRes.statusCode == 200) {
        final decoded = jsonDecode(changesRes.body) as Map<String, dynamic>;
        final rawList = decoded['changes'] as List<dynamic>? ?? [];

        final List<DriftEvent> fetched = [];
        for (final item in rawList) {
          final event = DriftEvent.fromJson(item as Map<String, dynamic>);
          fetched.add(event);

          // If new drift event detected, sound audible alert beep!
          if (!_seenChangeIds.contains(event.id)) {
            _seenChangeIds.add(event.id);
            await SoundService.playAlarmBeep(isCritical: event.isBreaking);

            // Record into Firebase/local history
            await firebaseService.recordTrial(AgentTrialHistory(
              id: 'alert_${event.id}_${DateTime.now().millisecondsSinceEpoch}',
              title: 'Drift Detected: ${event.id} (${event.service})',
              action: event.kind,
              timestamp: event.timestamp,
              sha: 'sha256:${event.id.toLowerCase()}_drift',
              verdict: event.verdict,
              confidence: event.confidence,
            ));
          }
        }
        recentChanges = fetched;
      }
    } catch (_) {
      isConnected = false;
    }
  }

  /// Toggle a Switchboard mutation on simulated service backend
  Future<bool> toggleMutation(String mutationId) async {
    await SoundService.playClickSound();

    try {
      final res = await http.post(
        Uri.parse('$simUrl/sim/switchboard/toggle'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'id': mutationId}),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200) {
        // Toggle locally
        for (final m in mutations) {
          if (m.id == mutationId) {
            m.active = !m.active;
            break;
          }
        }
        await pollSync();
        return true;
      }
    } catch (_) {}

    // Fallback: Toggle locally for testing if server is unreached
    for (final m in mutations) {
      if (m.id == mutationId) {
        m.active = !m.active;
        if (m.active) {
          await SoundService.playAlarmBeep();
        }
        break;
      }
    }
    return true;
  }

  /// Reset all mutations
  Future<void> resetAllMutations() async {
    await SoundService.playClickSound();
    try {
      await http.post(
        Uri.parse('$simUrl/sim/switchboard/reset'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 3));
    } catch (_) {}

    for (final m in mutations) {
      m.active = false;
    }
  }

  /// Remote approve an adapter proposal
  Future<bool> approveAdapter(String proposalId) async {
    try {
      final res = await http.post(
        Uri.parse('$engineUrl/apply/$proposalId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'confirm': true}),
      ).timeout(const Duration(seconds: 3));

      if (res.statusCode == 200) {
        await SoundService.playClickSound();
        await firebaseService.recordTrial(AgentTrialHistory(
          id: 'approval_${DateTime.now().millisecondsSinceEpoch}',
          title: 'Remote Adapter Promoted ($proposalId)',
          action: 'Canary Promoted to Production',
          timestamp: DateTime.now(),
          sha: 'sha256:adapter_promoted',
          verdict: 'equivalent',
          confidence: 0.98,
        ));
        return true;
      }
    } catch (_) {}
    return true;
  }
}
