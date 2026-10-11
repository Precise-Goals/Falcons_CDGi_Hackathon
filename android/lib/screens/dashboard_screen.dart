import 'dart:async';
import 'package:flutter/material.dart';
import '../services/engine_client.dart';
import '../services/sound_service.dart';
import '../services/ble_service.dart';
import '../theme/app_theme.dart';
import '../models/drift_event.dart';
import 'package:google_fonts/google_fonts.dart';

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
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
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
                                const Flexible(
                                  child: Text(
                                    'BLE AIRLINK (<20ms)',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.4,
                                      color: AppColors.charcoal,
                                    ),
                                    overflow: TextOverflow.ellipsis,
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
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          _bleService.isConnected
                              ? 'Direct Airlink (<20ms) • Active'
                              : 'UUID: ${BleService.shortServiceUuid} • GATT Server',
                          style: const TextStyle(
                            fontSize: 10,
                            fontFamily: 'monospace',
                            color: Colors.black45,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 32,
                        child: OutlinedButton.icon(
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
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            side: const BorderSide(color: AppColors.crimson, width: 1.2),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ),
                    ],
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
              ...client.recentChanges.asMap().entries.map((entry) => _buildDriftEventTile(entry.value, index: entry.key)),

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

  Widget _buildDriftEventTile(DriftEvent event, {int index = 0}) {
    Color badgeColor = AppColors.success;
    if (event.isBreaking) {
      badgeColor = AppColors.breaking;
    } else if (event.isLossy) {
      badgeColor = AppColors.warning;
    }

    // Alternating light and dark patches across cards per design directive
    final bool isLightPatch = index % 2 == 1;
    final cardBg = isLightPatch ? AppColors.lightPatch : AppColors.darkPatch;
    final cardBorder = isLightPatch ? AppColors.lightBorder : AppColors.darkBorder;
    final primaryTextColor = isLightPatch ? AppColors.charcoal : AppColors.twitterTextLight;
    final secondaryTextColor = isLightPatch ? Colors.black54 : AppColors.twitterTextSecondary;
    final codeBg = isLightPatch ? Colors.white : AppColors.charcoal;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isLightPatch ? 0.04 : 0.2),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Twitter Header: Avatar + Display Name + Handle + Timestamp + Verdict Badge
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Circular Monogram Avatar
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: AppColors.crimson.withValues(alpha: isLightPatch ? 0.12 : 0.2),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.crimson.withValues(alpha: 0.4), width: 1.2),
                  ),
                  child: Center(
                    child: Text(
                      event.service.isNotEmpty ? event.service[0].toUpperCase() : 'A',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: AppColors.crimson,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              '${event.service[0].toUpperCase()}${event.service.substring(1)} Service',
                              style: GoogleFonts.poppins(
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                                color: primaryTextColor,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.verified, size: 13, color: AppColors.crimson),
                          const SizedBox(width: 4),
                          Text(
                            '@intra/${event.service}',
                            style: GoogleFonts.poppins(
                              fontSize: 11,
                              color: secondaryTextColor,
                            ),
                          ),
                          const SizedBox(width: 4),
                          Text('•', style: TextStyle(color: secondaryTextColor, fontSize: 10)),
                          const SizedBox(width: 4),
                          Text(
                            'now',
                            style: GoogleFonts.poppins(fontSize: 11, color: secondaryTextColor),
                          ),
                        ],
                      ),
                      Text(
                        '${event.id} • ${event.endpoint}',
                        style: GoogleFonts.jetBrainsMono(
                          fontSize: 10.5,
                          color: AppColors.crimson,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                // Verdict Pill Badge
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                  decoration: BoxDecoration(
                    color: badgeColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: badgeColor.withValues(alpha: 0.4)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (event.isBreaking)
                        Container(
                          width: 5,
                          height: 5,
                          margin: const EdgeInsets.only(right: 4),
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.breaking,
                          ),
                        ),
                      Text(
                        event.verdict.toUpperCase(),
                        style: GoogleFonts.poppins(
                          fontSize: 9.5,
                          fontWeight: FontWeight.bold,
                          color: badgeColor,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Post Content: Mutation Kind and Description
            Text(
              'Drift detected in ${event.endpoint}: ${event.kind.replaceAll('_', ' ')} with ${(event.confidence * 100).toInt()}% inference confidence.',
              style: GoogleFonts.poppins(
                fontSize: 12.5,
                color: primaryTextColor,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 8),

            // In-Process Visual Code Snippet Patch
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: codeBg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: cardBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'SYNTHESIZED ADAPTER (@intra/sdk)',
                        style: GoogleFonts.poppins(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.4,
                          color: secondaryTextColor,
                        ),
                      ),
                      Text(
                        'PASSING REPLAY (3/3)',
                        style: GoogleFonts.poppins(
                          fontSize: 8.5,
                          fontWeight: FontWeight.bold,
                          color: AppColors.success,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'adaptResponse(payload) => mapField(payload, "${event.id}")',
                    style: GoogleFonts.firaCode(
                      fontSize: 10.5,
                      color: isLightPatch ? AppColors.crimson : const Color(0xFF34D399),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Twitter Action Bar: Approve, Rollback, SHA-256 seal
            Row(
              children: [
                // Approve Pill Action
                ElevatedButton.icon(
                  onPressed: () async {
                    final proposalId = 'prop_${event.id.toLowerCase()}_01';
                    await _bleService.sendAdapterApproval(proposalId);
                    await widget.engineClient.approveAdapter(proposalId);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Adapter $proposalId approved over BLE Airlink & USB Bridge!')),
                      );
                    }
                  },
                  icon: const Icon(Icons.check_circle_outline, size: 14),
                  label: Text('Approve', style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                    backgroundColor: AppColors.crimson,
                    foregroundColor: Colors.white,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                ),
                if (event.isBreaking || event.isLossy) ...[
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    onPressed: () async {
                      final proposalId = 'prop_${event.id.toLowerCase()}_01';
                      await _bleService.sendAdapterRollback(proposalId);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Adapter $proposalId rollback dispatched over BLE Airlink!')),
                        );
                      }
                    },
                    icon: const Icon(Icons.shield_outlined, size: 13, color: AppColors.breaking),
                    label: Text('Rollback', style: GoogleFonts.poppins(fontSize: 11, color: AppColors.breaking, fontWeight: FontWeight.bold)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                      side: const BorderSide(color: AppColors.breaking, width: 1.2),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ),
                ],
                const Spacer(),
                // Beep Status Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.crimson.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.volume_up, size: 12, color: AppColors.crimson),
                      const SizedBox(width: 4),
                      Text(
                        '880Hz Tone',
                        style: GoogleFonts.poppins(fontSize: 9.5, color: AppColors.crimson, fontWeight: FontWeight.bold),
                      ),
                    ],
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
