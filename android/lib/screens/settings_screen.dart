import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/engine_client.dart';
import '../services/firebase_service.dart';
import '../services/sound_service.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatefulWidget {
  final EngineClient engineClient;
  final FirebaseService firebaseService;
  final VoidCallback onSignOut;

  const SettingsScreen({
    super.key,
    required this.engineClient,
    required this.firebaseService,
    required this.onSignOut,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final TextEditingController _engineUrlController;
  late final TextEditingController _simUrlController;

  @override
  void initState() {
    super.initState();
    _engineUrlController = TextEditingController(text: widget.engineClient.engineUrl);
    _simUrlController = TextEditingController(text: widget.engineClient.simUrl);
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: AppColors.darkPatch,
        content: Text('Copied $label to clipboard', style: const TextStyle(color: Colors.white)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.twitterBlack,
      appBar: AppBar(
        title: Text(
          'COMPANION SETTINGS',
          style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w700, letterSpacing: 0.5),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // User Session Card
          Card(
            color: AppColors.darkPatch,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.darkBorder),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: const Color(0xFF221215),
                    child: Text(
                      widget.firebaseService.userEmail[0].toUpperCase(),
                      style: GoogleFonts.poppins(color: const Color(0xFFFF6B6B), fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.firebaseService.userEmail,
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            color: AppColors.twitterTextLight,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'ID: ${widget.firebaseService.userId}',
                          style: GoogleFonts.firaCode(fontSize: 11, color: AppColors.twitterTextSecondary),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: widget.onSignOut,
                    child: Text(
                      'Sign Out',
                      style: GoogleFonts.poppins(color: const Color(0xFFFF5252), fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // USB Bridge Setup Guide Card
          Card(
            color: AppColors.darkPatch,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.darkBorder),
            ),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.usb, color: AppColors.crimson, size: 20),
                      const SizedBox(width: 8),
                      Text(
                        'USB Cable (ADB Reverse) Commands',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: AppColors.twitterTextLight,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'When your phone is plugged in with USB debugging enabled, run these commands in your PC terminal to bridge ports over the cable:',
                    style: GoogleFonts.poppins(fontSize: 11, color: AppColors.twitterTextSecondary),
                  ),
                  const SizedBox(height: 12),
                  _buildCodeSnippet(
                    'adb reverse tcp:3001 tcp:3001\nadb reverse tcp:4000 tcp:4000',
                    'ADB Commands',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Connection Endpoints Card
          Card(
            color: AppColors.darkPatch,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.darkBorder),
            ),
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Connection Endpoints',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      color: AppColors.twitterTextLight,
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _engineUrlController,
                    style: GoogleFonts.firaCode(fontSize: 12, color: AppColors.twitterTextLight),
                    decoration: InputDecoration(
                      labelText: 'Engine REST URL',
                      helperText: 'Default 127.0.0.1:3001 for USB ADB Reverse',
                      helperStyle: GoogleFonts.poppins(fontSize: 10, color: AppColors.twitterTextSecondary),
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _simUrlController,
                    style: GoogleFonts.firaCode(fontSize: 12, color: AppColors.twitterTextLight),
                    decoration: InputDecoration(
                      labelText: 'Sim Services Switchboard URL',
                      helperText: 'Default 127.0.0.1:4000 for local Fastify sim',
                      helperStyle: GoogleFonts.poppins(fontSize: 10, color: AppColors.twitterTextSecondary),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            widget.engineClient.engineUrl = _engineUrlController.text.trim();
                            widget.engineClient.simUrl = _simUrlController.text.trim();
                          });
                          widget.engineClient.pollSync();
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: AppColors.darkPatch,
                              content: Text('Endpoint URLs updated successfully.', style: const TextStyle(color: Colors.white)),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.buttonPrimaryBg,
                          foregroundColor: AppColors.buttonPrimaryText,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                        ),
                        child: Text(
                          'Save Endpoints',
                          style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.buttonPrimaryText),
                        ),
                      ),
                      const SizedBox(width: 10),
                      OutlinedButton(
                        onPressed: () {
                          setState(() {
                            _engineUrlController.text = 'http://127.0.0.1:3001';
                            _simUrlController.text = 'http://127.0.0.1:4000';
                            widget.engineClient.engineUrl = 'http://127.0.0.1:3001';
                            widget.engineClient.simUrl = 'http://127.0.0.1:4000';
                          });
                        },
                        style: OutlinedButton.styleFrom(
                          backgroundColor: const Color(0xFF202327),
                          foregroundColor: AppColors.white,
                          side: const BorderSide(color: AppColors.darkBorder),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                        child: Text(
                          'Reset Defaults',
                          style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.white),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Sound Alarm Toggle Card
          Card(
            color: AppColors.darkPatch,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppColors.darkBorder),
            ),
            child: SwitchListTile.adaptive(
              title: Text(
                'Audible Drift Alarm Beeps',
                style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.twitterTextLight),
              ),
              subtitle: Text(
                'Plays high-frequency sound beep and vibration when API changes are detected',
                style: GoogleFonts.poppins(fontSize: 11, color: AppColors.twitterTextSecondary),
              ),
              value: SoundService.soundEnabled,
              activeThumbColor: AppColors.white,
              activeTrackColor: const Color(0xFFDC2626),
              onChanged: (val) {
                setState(() => SoundService.soundEnabled = val);
                if (val) SoundService.playAlarmBeep();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCodeSnippet(String code, String label) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.darkCodeBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              code,
              style: GoogleFonts.firaCode(
                fontSize: 11,
                color: AppColors.white,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.copy, size: 16, color: AppColors.twitterTextSecondary),
            onPressed: () => _copyToClipboard(code, label),
          ),
        ],
      ),
    );
  }
}

