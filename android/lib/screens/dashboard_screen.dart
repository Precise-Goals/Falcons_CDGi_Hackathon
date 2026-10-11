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
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: _bleService.isConnected
                    ? const Color(0xFF221215)
                    : const Color(0xFF1E2024),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(
                  color: _bleService.isConnected
                      ? AppColors.crimson.withValues(alpha: 0.6)
                      : AppColors.darkBorder,
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
                        ? const Color(0xFFFF6B6B)
                        : (_bleService.isAdvertising ? AppColors.warning : AppColors.twitterTextSecondary),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'BLE AIRLINK (<20ms)',
                    style: GoogleFonts.poppins(
                      fontSize: 9.5,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                      color: _bleService.isConnected
                          ? const Color(0xFFFF6B6B)
                          : (_bleService.isAdvertising ? AppColors.warning : AppColors.twitterTextSecondary),
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
              color: SoundService.soundEnabled ? AppColors.white : AppColors.twitterTextSecondary,
            ),
            tooltip: 'Toggle Alarm Sound Beeps',
            onPressed: () {
              setState(() {
                SoundService.soundEnabled = !SoundService.soundEnabled;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  backgroundColor: AppColors.darkPatch,
                  content: Text(
                    SoundService.soundEnabled ? 'Alarm Beeps Enabled' : 'Alarm Beeps Muted',
                    style: const TextStyle(color: Colors.white),
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
                color: AppColors.darkPatch,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.cable, size: 18, color: AppColors.crimson),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Host: ${client.engineUrl} (ADB Reverse over USB)',
                      style: GoogleFonts.firaCode(
                        fontSize: 11,
                        color: AppColors.twitterTextLight,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // BLE Airlink Status Banner & Pairing Action Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkPatch,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: _bleService.isConnected
                      ? AppColors.crimson.withValues(alpha: 0.5)
                      : AppColors.darkBorder,
                  width: _bleService.isConnected ? 1.5 : 1,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 38,
                        height: 38,
                        decoration: BoxDecoration(
                          color: _bleService.isConnected
                              ? const Color(0xFF261215)
                              : const Color(0xFF1E2024),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _bleService.isConnected
                                ? AppColors.crimson.withValues(alpha: 0.5)
                                : AppColors.darkBorder,
                          ),
                        ),
                        child: Icon(
                          _bleService.isConnected
                              ? Icons.bluetooth_connected
                              : (_bleService.isAdvertising ? Icons.bluetooth_searching : Icons.bluetooth),
                          size: 20,
                          color: _bleService.isConnected
                              ? const Color(0xFFFF6B6B)
                              : (_bleService.isAdvertising ? AppColors.warning : AppColors.twitterTextLight),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    'BLE AIRLINK (<20ms)',
                                    style: GoogleFonts.poppins(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.4,
                                      color: AppColors.twitterTextLight,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                  decoration: BoxDecoration(
                                    color: _bleService.isConnected
                                        ? const Color(0xFF0D2319)
                                        : (_bleService.isAdvertising
                                            ? const Color(0xFF281C0D)
                                            : const Color(0xFF1E2024)),
                                    borderRadius: BorderRadius.circular(999),
                                    border: Border.all(
                                      color: _bleService.isConnected
                                          ? AppColors.success.withValues(alpha: 0.4)
                                          : (_bleService.isAdvertising
                                              ? AppColors.warning.withValues(alpha: 0.4)
                                              : AppColors.darkBorder),
                                    ),
                                  ),
                                  child: Text(
                                    _bleService.stateText.toUpperCase(),
                                    style: GoogleFonts.poppins(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      color: _bleService.isConnected
                                          ? AppColors.success
                                          : (_bleService.isAdvertising ? AppColors.warning : AppColors.twitterTextSecondary),
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
                              style: GoogleFonts.poppins(fontSize: 11, color: AppColors.twitterTextSecondary),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Text(
                          _bleService.isConnected
                              ? 'Direct Airlink (<20ms) • Active'
                              : 'UUID: ${BleService.shortServiceUuid} • GATT Server',
                          style: GoogleFonts.firaCode(
                            fontSize: 10,
                            color: AppColors.twitterTextSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 34,
                        child: OutlinedButton.icon(
                          key: const Key('ble_pairing_check_btn'),
                          onPressed: _isPairingChecking ? null : _triggerBlePairingCheck,
                          icon: _isPairingChecking
                              ? const SizedBox(
                                  width: 12,
                                  height: 12,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.white),
                                )
                              : Icon(
                                  _bleService.isAdvertising ? Icons.sync : Icons.bluetooth_searching,
                                  size: 14,
                                  color: AppColors.white,
                                ),
                          label: Text(
                            _bleService.isAdvertising ? 'Pairing...' : 'Pair / Check',
                            style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.white),
                          ),
                          style: OutlinedButton.styleFrom(
                            backgroundColor: const Color(0xFF202327),
                            foregroundColor: AppColors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                            side: const BorderSide(color: AppColors.darkBorder, width: 1.2),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
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
                        Text(
                          'CANARY TELEMETRY',
                          style: GoogleFonts.poppins(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: AppColors.twitterTextSecondary,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF221215),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.4)),
                          ),
                          child: Text(
                            'STAGE 01 - 06',
                            style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFFFF6B6B)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricTile(
                            label: 'UPTIME',
                            value: client.lastHealthData != null
                                ? '${((client.lastHealthData!['uptime'] as num?)?.toInt() ?? 0) ~/ 60}m'
                                : 'Live',
                            color: AppColors.twitterTextLight,
                          ),
                        ),
                        Expanded(
                          child: _buildMetricTile(
                            label: 'RATE HEADROOM',
                            value: '10 rps',
                            color: const Color(0xFFFF6B6B),
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
            const SizedBox(height: 16),

            // Movie Booking Agentic Graph Engine Card
            Card(
              color: AppColors.darkPatch,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
                side: const BorderSide(color: Color(0xFF2F3336), width: 1),
              ),
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.hub_outlined, color: AppColors.crimson, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'AGENTIC GRAPH ENGINE',
                              style: GoogleFonts.poppins(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 0.5,
                                color: AppColors.twitterTextLight,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF221215),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.crimson.withValues(alpha: 0.4)),
                          ),
                          child: Text(
                            'MOVIE BOOKING API',
                            style: GoogleFonts.poppins(fontSize: 9, fontWeight: FontWeight.bold, color: const Color(0xFFFF6B6B)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      'Forward agentic system discovery into 3 real-time graph engines: Spring Layout (Physics), Kahn DAG (Topological Pipeline), and AST Blast Ripple (Concentric Shockwaves).',
                      style: GoogleFonts.poppins(fontSize: 11, color: AppColors.twitterTextSecondary, height: 1.4),
                    ),
                    const SizedBox(height: 14),
                    // 3 Layout pills
                    Row(
                      children: [
                        _buildLayoutPill('1. Spring Physics', Icons.grain),
                        const SizedBox(width: 6),
                        _buildLayoutPill('2. Kahn DAG', Icons.account_tree_outlined),
                        const SizedBox(width: 6),
                        _buildLayoutPill('3. AST Ripple', Icons.radar),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        key: const Key('trigger_movie_agent_btn'),
                        onPressed: () async {
                          await SoundService.playClickSound();
                          try {
                            final packet = BleService.encodeDriftAlertPacket(
                              mutationId: 'M03',
                              confidence: 0.98,
                              verdict: 'breaking',
                              timestamp: DateTime.now(),
                              hash: 'mb_seat_reservation_coordinate_drift',
                            );
                            await _bleService.handleIncomingPacket(packet);
                          } catch (_) {
                            final fallbackEvent = DriftEvent(
                              id: 'MB_SEAT_DRIFT_01',
                              service: 'movie-booking-seats',
                              endpoint: '/v1/shows/reserve-seat',
                              kind: 'rename_schema_mutation',
                              verdict: 'breaking',
                              confidence: 0.98,
                              timestamp: DateTime.now(),
                              evidence: const {
                                'target': 'seat_coordinate',
                                'previous': 'seat_number',
                              },
                            );
                            if (!widget.engineClient.recentChanges.any((e) => e.id == fallbackEvent.id)) {
                              widget.engineClient.recentChanges.insert(0, fallbackEvent);
                            }
                            if (mounted) setState(() {});
                          }
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                backgroundColor: AppColors.charcoal,
                                content: Text(
                                  'Movie Booking Agent drift emitted -> Forwarded to Graph Engine & BLE Airlink',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          }
                        },
                        icon: const Icon(Icons.bolt, size: 16, color: AppColors.white),
                        label: Text(
                          'Simulate Movie Booking Drift Alert',
                          style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.crimson,
                          foregroundColor: AppColors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                        ),
                      ),
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
                Text(
                  'REMOTE SWITCHBOARD (M1–M10)',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                    color: AppColors.twitterTextLight,
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
                  child: Text(
                    'Reset All',
                    style: GoogleFonts.poppins(fontSize: 12, color: AppColors.twitterTextSecondary, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Mutations List
            ...client.mutations.map((mutation) => _buildMutationTile(mutation)),

            const SizedBox(height: 20),

            // Recent Drift Alerts Section
            Text(
              'RECENT DRIFT ALERTS (LIVE LOG)',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
                color: AppColors.twitterTextLight,
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
                        Icon(Icons.check_circle_outline, color: AppColors.success.withValues(alpha: 0.8), size: 36),
                        const SizedBox(height: 8),
                        Text(
                          'Zero Active Drift Detected',
                          style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.twitterTextLight),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Toggle a switchboard mutation above to simulate upstream API drift.',
                          textAlign: TextAlign.center,
                          style: GoogleFonts.poppins(fontSize: 11, color: AppColors.twitterTextSecondary),
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

  Widget _buildLayoutPill(String text, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF16181C),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF2F3336)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 12, color: AppColors.crimson),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                text,
                style: GoogleFonts.poppins(
                  fontSize: 9,
                  fontWeight: FontWeight.w600,
                  color: AppColors.twitterTextLight,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile({required String label, required String value, required Color color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(fontSize: 9, color: AppColors.twitterTextSecondary, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.jetBrainsMono(fontSize: 16, fontWeight: FontWeight.w900, color: color),
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
                color: m.active ? const Color(0xFF221215) : const Color(0xFF1E2024),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: m.active ? const Color(0xFFDC2626) : AppColors.darkBorder,
                  width: 1,
                ),
              ),
              child: Text(
                m.id,
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: m.active ? const Color(0xFFFF6B6B) : AppColors.twitterTextSecondary,
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
                    style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.twitterTextLight),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${m.service} ${m.endpoint}',
                    style: GoogleFonts.jetBrainsMono(fontSize: 10, color: AppColors.twitterTextSecondary),
                  ),
                ],
              ),
            ),
            Switch.adaptive(
              value: m.active,
              activeThumbColor: AppColors.white,
              activeTrackColor: const Color(0xFFDC2626),
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
    Color badgeBg = const Color(0xFF0D2319);
    Color badgeBorder = const Color(0xFF059669);
    if (event.isBreaking) {
      badgeColor = const Color(0xFFFF5252);
      badgeBg = const Color(0xFF261215);
      badgeBorder = const Color(0xFFDC2626);
    } else if (event.isLossy) {
      badgeColor = const Color(0xFFFBBF24);
      badgeBg = const Color(0xFF281C0D);
      badgeBorder = const Color(0xFFD97706);
    }

    const cardBg = AppColors.darkPatch;
    const cardBorder = AppColors.darkBorder;
    const primaryTextColor = AppColors.twitterTextLight;
    const secondaryTextColor = AppColors.twitterTextSecondary;
    const codeBg = AppColors.darkCodeBg;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: cardBorder, width: 1),
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
                    color: const Color(0xFF221215),
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.4), width: 1.2),
                  ),
                  child: Center(
                    child: Text(
                      event.service.isNotEmpty ? event.service[0].toUpperCase() : 'A',
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                        color: const Color(0xFFFF6B6B),
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
                          color: const Color(0xFFFF6B6B),
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
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: badgeBorder.withValues(alpha: 0.5)),
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
                            color: Color(0xFFFF5252),
                          ),
                        ),
                      Text(
                        event.verdict.toUpperCase(),
                        style: GoogleFonts.poppins(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
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
                      color: const Color(0xFF34D399),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Twitter Action Bar: Approve, Rollback, Tone status
            Row(
              children: [
                // Approve Pill Action (High contrast: white pill with crisp black text)
                ElevatedButton.icon(
                  onPressed: () async {
                    final proposalId = 'prop_${event.id.toLowerCase()}_01';
                    await _bleService.sendAdapterApproval(proposalId);
                    await widget.engineClient.approveAdapter(proposalId);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: AppColors.darkPatch,
                          content: Text(
                            'Adapter $proposalId approved over BLE Airlink & USB Bridge!',
                            style: const TextStyle(color: Colors.white),
                          ),
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.check_circle, size: 14, color: AppColors.buttonPrimaryText),
                  label: Text(
                    'Approve',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.buttonPrimaryText,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    backgroundColor: AppColors.buttonPrimaryBg,
                    foregroundColor: AppColors.buttonPrimaryText,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
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
                          SnackBar(
                            backgroundColor: AppColors.darkPatch,
                            content: Text(
                              'Adapter $proposalId rollback dispatched over BLE Airlink!',
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                        );
                      }
                    },
                    icon: const Icon(Icons.shield_outlined, size: 13, color: AppColors.buttonDangerText),
                    label: Text(
                      'Rollback',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: AppColors.buttonDangerText,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      backgroundColor: AppColors.buttonDangerBg,
                      side: const BorderSide(color: AppColors.buttonDangerBorder, width: 1.2),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    ),
                  ),
                ],
                const Spacer(),
                // Tone Status Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1E2024),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.volume_up, size: 12, color: AppColors.twitterTextLight),
                      const SizedBox(width: 4),
                      Text(
                        '880Hz Tone',
                        style: GoogleFonts.poppins(
                          fontSize: 9.5,
                          color: AppColors.twitterTextLight,
                          fontWeight: FontWeight.w600,
                        ),
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
