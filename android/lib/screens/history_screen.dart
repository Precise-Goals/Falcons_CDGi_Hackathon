import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/firebase_service.dart';
import '../models/drift_event.dart';
import '../theme/app_theme.dart';

class HistoryScreen extends StatefulWidget {
  final FirebaseService firebaseService;

  const HistoryScreen({super.key, required this.firebaseService});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<AgentTrialHistory> _trials = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    final list = await widget.firebaseService.getTrialsHistory();
    if (mounted) {
      setState(() {
        _trials = list;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM d, HH:mm:ss');

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'AGENTIC TRIAL HISTORY',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.5),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadHistory,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.crimson))
          : _trials.isEmpty
              ? const Center(
                  child: Text(
                    'No trial history recorded yet.',
                    style: TextStyle(color: Colors.black54),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: _trials.length,
                  itemBuilder: (context, index) {
                    final trial = _trials[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  dateFormat.format(trial.timestamp),
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: Colors.black45,
                                    fontFamily: 'monospace',
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppColors.crimson.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    trial.sha.length > 15 ? trial.sha.substring(0, 15) : trial.sha,
                                    style: const TextStyle(
                                      fontSize: 9,
                                      fontFamily: 'monospace',
                                      color: AppColors.crimson,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              trial.title,
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              trial.action,
                              style: const TextStyle(fontSize: 12, color: Colors.black54),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.verified, size: 14, color: AppColors.success),
                                const SizedBox(width: 4),
                                Text(
                                  'Verdict: ${trial.verdict} (${(trial.confidence * 100).toInt()}% conf)',
                                  style: const TextStyle(fontSize: 11, color: Colors.black87),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
