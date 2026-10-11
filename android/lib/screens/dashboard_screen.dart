import 'dart:async';
import 'package:flutter/material.dart';
import '../services/engine_client.dart';
import '../services/sound_service.dart';
import '../services/ble_service.dart';
import '../theme/app_theme.dart';
import '../models/drift_event.dart';

class DashboardScreen extends StatefulWidget {
  final EngineClient engineClient;
  final BleService? bleService;
  final bool autoStartMonitoring;

  const DashboardScreen({
    super.key,
    required this.engineClient,
    this.bleService,
    this.autoStartMonitoring = true,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isRefreshing = false;
  bool _isPairingChecking = false;
  late BleService _bleService;
  StreamSubscription<BleAirlinkState>? _bleStateSub;
  StreamSubscription<DriftEvent>? _bleAlertSub;

  @override
  void initState() {
    super.initState();
    _bleService = widget.bleService ?? BleService.instance;
    if (widget.autoStartMonitoring) {
      widget.engineClient.startMonitoring();
    }

    _bleStateSub = _bleService.onStateChanged.listen((_) {
      if (mounted) setState(() {});
    });

    _bleAlertSub = _bleService.onBleAlert.listen((event) {
      if (mounted) {
        setState(() {
          if (!widget.engineClient.recentChanges.any((e) => e.id == event.id)) {
            widget.engineClient.recentChanges.insert(0, event);
          }
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.charcoal,
            content: Row(
              children: [
                const Icon(Icons.bluetooth_audio, color: AppColors.crimson, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'BLE Alert (<20ms): ${event.id} (${event.service}) - ${event.verdict.toUpperCase()}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _bleStateSub?.cancel();
    _bleAlertSub?.cancel();
    widget.engineClient.stopMonitoring();
    super.dispose();
  }

  Future<void> _manualRefresh() async {
    setState(() => _isRefreshing = true);
    await widget.engineClient.pollSync();
    if (mounted) setState(() => _isRefreshing = false);
  }

  Future<void> _triggerBlePairingCheck() async {
    setState(() => _isPairingChecking = true);
    await SoundService.playClickSound();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Checking BLE Airlink and advertising GATT Peripheral...'),
        duration: Duration(milliseconds: 1200),
      ),
    );

    final success = await _bleService.checkPairing();
    if (mounted) {
      setState(() => _isPairingChecking = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: success ? AppColors.charcoal : AppColors.breaking,
          content: Row(
            children: [
              Icon(
                success ? Icons.bluetooth_connected : Icons.bluetooth_disabled,
                color: success ? AppColors.crimson : Colors.white,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  success
                      ? 'BLE Airlink Connected (<20ms direct GATT established)!'
                      : 'BLE Advertising Active (UUID: ${BleService.shortServiceUuid})',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ],
          ),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final client = widget.engineClient;
    final isOnline = client.isConnected;

    return Scaffold(
      appBar: AppBar(
        title: Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: 8,
          runSpacing: 4,
          children: [
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isOnline ? AppColors.success : AppColors.breaking,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  isOnline ? 'USB ACTIVE' : 'ENGINE OFFLINE',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.4,
                    color: isOnline ? AppColors.success : AppColors.breaking,
                  ),
                ),
              ],
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
              decoration: BoxDecoration(
                color: _bleService.isConnected
                    ? AppColors.crimson.withValues(alpha: 0.12)
                    : AppColors.creamSubtle,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(
                  color: _bleService.isConnected
                      ? AppColors.crimson.withValues(alpha: 0.6)
                      : AppColors.borderSubtle,
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    _bleService.isConnected
                        ? Icons.bluetooth_connected
                        : (_bleService.isAdvertising ? Icons.bluetooth_searching : Icons.bluetooth),
                    size: 12,
                    color: _bleService.isConnected
                        ? AppColors.crimson
                        : (_bleService.isAdvertising ? AppColors.warning : AppColors.charcoal),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'BLE AIRLINK (<20ms)',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.3,
                      color: _bleService.isConnected
                          ? AppColors.crimson
                          : (_bleService.isAdvertising ? AppColors.warning : AppColors.charcoal),
                    ),
                  ),
                ],
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
            const SizedBox(height: 8),

            // BLE Airlink Status Banner & Pairing Action Card
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _bleService.isConnected
                      ? AppColors.crimson.withValues(alpha: 0.5)
                      : AppColors.borderSubtle,
                  width: _bleService.isConnected ? 1.5 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: _bleService.isConnected
                          ? AppColors.crimson.withValues(alpha: 0.1)
                          : AppColors.creamSubtle,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      _bleService.isConnected
                          ? Icons.bluetooth_connected
                          : (_bleService.isAdvertising ? Icons.bluetooth_searching : Icons.bluetooth),
                      size: 20,
                      color: _bleService.isConnected
                          ? AppColors.crimson
                          : (_bleService.isAdvertising ? AppColors.warning : AppColors.charcoal),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'BLE AIRLINK (<20ms)',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.4,
                                color: AppColors.charcoal,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: _bleService.isConnected
                                    ? AppColors.success.withValues(alpha: 0.12)
                                    : (_bleService.isAdvertising
                                        ? AppColors.warning.withValues(alpha: 0.12)
                                        : AppColors.charcoal.withValues(alpha: 0.08)),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                _bleService.stateText.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: _bleService.isConnected
                                      ? AppColors.success
                                      : (_bleService.isAdvertising ? AppColors.warning : Colors.black54),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _bleService.isConnected
                              ? 'GATT Peripheral Active • Latency: ${_bleService.latencyMs}ms'
                              : (_bleService.isAdvertising
                                  ? 'Advertising Intra GATT Service (${BleService.shortServiceUuid})...'
                                  : 'GATT Peripheral Ready • Zero-Cable Direct Link'),
                          style: const TextStyle(fontSize: 10, color: Colors.black54),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    key: const Key('ble_pairing_check_btn'),
                    onPressed: _isPairingChecking ? null : _triggerBlePairingCheck,
                    icon: _isPairingChecking
                        ? const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.crimson),
                          )
                        : Icon(
                            _bleService.isAdvertising ? Icons.sync : Icons.bluetooth_searching,
                            size: 14,
                            color: AppColors.crimson,
                          ),
                    label: Text(
                      _bleService.isAdvertising ? 'Pairing...' : 'Pair / Check',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.crimson),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      side: const BorderSide(color: AppColors.crimson, width: 1.2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
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
                    final proposalId = 'prop_${event.id.toLowerCase()}_01';
                    await _bleService.sendAdapterApproval(proposalId);
                    await widget.engineClient.approveAdapter(proposalId);
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Adapter $proposalId approved over BLE Airlink & USB Bridge!')),
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
                if (event.isBreaking || event.isLossy) ...[
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final proposalId = 'prop_${event.id.toLowerCase()}_01';
                      await _bleService.sendAdapterRollback(proposalId);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Adapter $proposalId rollback dispatched over BLE Airlink!')),
                        );
                      }
                    },
                    icon: const Icon(Icons.undo, size: 14, color: AppColors.breaking),
                    label: const Text('Rollback', style: TextStyle(fontSize: 11, color: AppColors.breaking)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      side: const BorderSide(color: AppColors.breaking, width: 1.2),
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
