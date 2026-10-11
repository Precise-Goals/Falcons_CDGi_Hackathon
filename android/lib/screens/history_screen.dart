import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
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
      backgroundColor: AppColors.twitterBlack,
      appBar: AppBar(
        title: Text(
          'AGENTIC TRIAL HISTORY',
          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 0.5),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.white),
            onPressed: _loadHistory,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.white))
          : _trials.isEmpty
              ? Center(
                  child: Text(
                    'No trial history recorded yet.',
                    style: GoogleFonts.poppins(color: AppColors.twitterTextSecondary, fontSize: 13),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: _trials.length,
                  itemBuilder: (context, index) {
                    final trial = _trials[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      color: AppColors.darkPatch,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: AppColors.darkBorder),
                      ),
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
                                  style: GoogleFonts.firaCode(
                                    fontSize: 10,
                                    color: AppColors.twitterTextSecondary,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF221215),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.4)),
                                  ),
                                  child: Text(
                                    trial.sha.length > 15 ? trial.sha.substring(0, 15) : trial.sha,
                                    style: GoogleFonts.firaCode(
                                      fontSize: 9,
                                      color: const Color(0xFFFF6B6B),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              trial.title,
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.twitterTextLight,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              trial.action,
                              style: GoogleFonts.poppins(fontSize: 12, color: AppColors.twitterTextSecondary),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(Icons.verified, size: 14, color: AppColors.success),
                                const SizedBox(width: 4),
                                Text(
                                  'Verdict: ${trial.verdict} (${(trial.confidence * 100).toInt()}% conf)',
                                  style: GoogleFonts.poppins(
                                    fontSize: 11,
                                    color: AppColors.twitterTextLight,
                                    fontWeight: FontWeight.w600,
                                  ),
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

