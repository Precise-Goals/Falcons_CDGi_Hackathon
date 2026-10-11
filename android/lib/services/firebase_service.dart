import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/drift_event.dart';

class FirebaseService {
  static const String _userKey = 'intra_user_session';
  static const String _historyKey = 'intra_agent_trials_history';

  String? _currentUserEmail;
  String? _currentUserId;
  bool _isAuthenticated = false;

  bool get isAuthenticated => _isAuthenticated;
  String get userEmail => _currentUserEmail ?? 'guest.developer@intra.build';
  String get userId => _currentUserId ?? 'usr_guest_01';

  /// Initialize and load cached session
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final savedUser = prefs.getString(_userKey);
    if (savedUser != null) {
      final data = jsonDecode(savedUser) as Map<String, dynamic>;
      _currentUserEmail = data['email'] as String?;
      _currentUserId = data['id'] as String?;
      _isAuthenticated = true;
    }
  }

  /// Sign in with Firebase Email & Password
  Future<bool> signInWithEmailPassword(String email, String password) async {
    // Simulates standard Firebase Auth sign-in with client credential validation
    await Future.delayed(const Duration(milliseconds: 600));

    if (email.contains('@') && password.length >= 6) {
      _currentUserEmail = email;
      _currentUserId = 'usr_fb_${email.split('@').first}';
      _isAuthenticated = true;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_userKey, jsonEncode({
        'email': _currentUserEmail,
        'id': _currentUserId,
        'timestamp': DateTime.now().toIso8601String(),
      }));

      // Record login audit in history
      await recordTrial(AgentTrialHistory(
        id: 'trial_${DateTime.now().millisecondsSinceEpoch}',
        title: 'Developer Authenticated ($email)',
        action: 'Firebase Session Established',
        timestamp: DateTime.now(),
        sha: 'sha256:fb_auth_established',
        verdict: 'equivalent',
        confidence: 1.0,
      ));

      return true;
    }
    return false;
  }

  /// Guest / Demo mode sign-in
  Future<void> signInAsDemo() async {
    _currentUserEmail = 'demo.operator@intra.build';
    _currentUserId = 'usr_demo_usb';
    _isAuthenticated = true;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode({
      'email': _currentUserEmail,
      'id': _currentUserId,
      'timestamp': DateTime.now().toIso8601String(),
    }));
  }

  /// Sign out
  Future<void> signOut() async {
    _currentUserEmail = null;
    _currentUserId = null;
    _isAuthenticated = false;

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  /// Save agent trial / alert into Firestore / local history
  Future<void> recordTrial(AgentTrialHistory trial) async {
    final prefs = await SharedPreferences.getInstance();
    final list = await getTrialsHistory();
    list.insert(0, trial);

    // Keep latest 50 trials
    final trimmed = list.take(50).map((t) => t.toJson()).toList();
    await prefs.setString(_historyKey, jsonEncode(trimmed));
  }

  /// Fetch history of trials
  Future<List<AgentTrialHistory>> getTrialsHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_historyKey);
    if (raw == null) {
      // Seed default initial trial records
      return [
        AgentTrialHistory(
          id: 'trial_seed_01',
          title: 'M1 Field Rename (name -> display_name)',
          action: 'Synthesized In-Process Adapter',
          timestamp: DateTime.now().subtract(const Duration(minutes: 15)),
          sha: 'sha256:4a8cfb2c8901',
          verdict: 'equivalent',
          confidence: 0.96,
        ),
        AgentTrialHistory(
          id: 'trial_seed_02',
          title: 'M3 Unit Shift (Float Dollars -> Integer Cents)',
          action: 'Quantile-Ratio Constancy Verified',
          timestamp: DateTime.now().subtract(const Duration(hours: 1)),
          sha: 'sha256:19e2613e9ed7',
          verdict: 'equivalent',
          confidence: 0.98,
        ),
      ];
    }

    try {
      final decoded = jsonDecode(raw) as List<dynamic>;
      return decoded.map((e) => AgentTrialHistory.fromJson(e as Map<String, dynamic>)).toList();
    } catch (_) {
      return [];
    }
  }
}
