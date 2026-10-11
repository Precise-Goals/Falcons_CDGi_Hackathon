import 'package:flutter/material.dart';
import '../services/engine_client.dart';
import '../services/sound_service.dart';
import '../theme/app_theme.dart';
import '../models/drift_event.dart';

class DashboardScreen extends StatefulWidget {
  final EngineClient engineClient;

  const DashboardScreen({super.key, required this.engineClient});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isRefreshing = false;

  @override
  void initState() {
    super.initState();
    widget.engineClient.startMonitoring();
  }

  Future<void> _manualRefresh() async {
    setState(() => _isRefreshing = true);
    await widget.engineClient.pollSync();
    if (mounted) setState(() => _isRefreshing = false);
  }

  @override
  Widget build(BuildContext context) {
    final client = widget.engineClient;
    final isOnline = client.isConnected;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 10,
              height: 10,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isOnline ? AppColors.success : AppColors.breaking,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              isOnline ? 'USB BRIDGE ACTIVE' : 'ENGINE OFFLINE',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: isOnline ? AppColors.success : AppColors.breaking,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(
              SoundService.soundEnabled ? Icons.volume_up : Icons.volume_off,
              color: SoundService.soundEnabled ? AppColors.crimson : Colors.black45,
            ),
            tooltip: 'Toggle Alarm Sound Beeps',
            onPressed: () {
              setState(() {
                SoundService.soundEnabled = !SoundService.soundEnabled;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    SoundService.soundEnabled ? 'Alarm Beeps Enabled' : 'Alarm Beeps Muted',
                  ),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
          IconButton(
            icon: _isRefreshing
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.crimson),
                  )
                : const Icon(Icons.refresh),
            onPressed: _manualRefresh,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _manualRefresh,
        color: AppColors.crimson,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // Connection Info Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: AppColors.creamSubtle,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Row(
                children: [
                  const Icon(Icons.cable, size: 18, color: AppColors.crimson),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Host: ${client.engineUrl} (ADB Reverse over USB)',
                      style: const TextStyle(fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Live Telemetry Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'CANARY TELEMETRY',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: Colors.black54,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.crimson.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            'STAGE 01 - 06',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppColors.crimson),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            label: 'UPTIME',
                            value: client.lastHealthData != null
                                ? '${((client.lastHealthData!['uptime'] as num?)?.toInt() ?? 0) ~/ 60}m'
                                : 'Live',
                            color: AppColors.charcoal,
                          ),
                        ),
                        Expanded(
                          child: _buildMetricTile(
                            label: 'RATE HEADROOM',
                            value: '10 rps',
                            color: AppColors.crimson,
                          ),
                        ),
                        Expanded(
                          child: _buildMetricTile(
                            label: 'CANARIES',
                            value: '2 Active',
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 20),

            // Remote Switchboard Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'REMOTE SWITCHBOARD (M1–M10)',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: AppColors.charcoal,
                  ),
                ),
                TextButton(
                  onPressed: () async {
                    await client.resetAllMutations();
                    setState(() {});
                    if (!context.mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('All mutations reset to baseline.')),
                    );
                  },
                  child: const Text(
                    'Reset All',
                    style: TextStyle(fontSize: 12, color: AppColors.crimson, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Mutations List
            ...client.mutations.map((mutation) => _buildMutationTile(mutation)),

            const SizedBox(height: 20),

            // Recent Drift Alerts Section
            const Text(
              'RECENT DRIFT ALERTS (LIVE LOG)',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: AppColors.charcoal,
              ),
            ),
            const SizedBox(height: 8),

            if (client.recentChanges.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(Icons.check_circle_outline, color: AppColors.success.withValues(alpha: 0.6), size: 36),
                        const SizedBox(height: 8),
                        const Text(
                          'Zero Active Drift Detected',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Toggle a switchboard mutation above to simulate upstream API drift.',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 11, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              ...client.recentChanges.map((event) => _buildDriftEventTile(event)),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile({required String label, required String value, required Color color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 9, color: Colors.black45, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: color, fontFamily: 'monospace'),
        ),
      ],
    );
  }

  Widget _buildMutationTile(SwitchboardMutation m) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: m.active ? AppColors.crimson : AppColors.creamSubtle,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                m.id,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'monospace',
                  color: m.active ? Colors.white : AppColors.charcoal,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    m.name,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${m.service} ${m.endpoint}',
                    style: const TextStyle(fontSize: 10, color: Colors.black54, fontFamily: 'monospace'),
                  ),
                ],
              ),
            ),
            Switch.adaptive(
              value: m.active,
              activeThumbColor: AppColors.crimson,
              onChanged: (_) async {
                await widget.engineClient.toggleMutation(m.id);
                setState(() {});
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDriftEventTile(DriftEvent event) {
    Color badgeColor = AppColors.success;
    if (event.isBreaking) {
      badgeColor = AppColors.breaking;
    } else if (event.isLossy) {
      badgeColor = AppColors.warning;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    event.verdict.toUpperCase(),
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: badgeColor),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${(event.confidence * 100).toInt()}% Conf.',
                  style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.black54),
                ),
                const Spacer(),
                const Icon(Icons.volume_up, size: 14, color: AppColors.crimson),
                const SizedBox(width: 4),
                const Text('Beep Emitted', style: TextStyle(fontSize: 10, color: AppColors.crimson)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '${event.id}: ${event.kind}',
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              '${event.service} &bull; ${event.endpoint}',
              style: const TextStyle(fontSize: 11, color: Colors.black54, fontFamily: 'monospace'),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                ElevatedButton.icon(
                  onPressed: () async {
                    await widget.engineClient.approveAdapter('prop_${event.id.toLowerCase()}_01');
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Adapter prop_${event.id.toLowerCase()}_01 approved and promoted!')),
                      );
                    }
                  },
                  icon: const Icon(Icons.check, size: 16),
                  label: const Text('Approve Adapter', style: TextStyle(fontSize: 11)),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    backgroundColor: AppColors.charcoal,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
