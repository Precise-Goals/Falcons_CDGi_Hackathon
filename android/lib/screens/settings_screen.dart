import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
      SnackBar(content: Text('Copied $label to clipboard')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'COMPANION SETTINGS',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.5),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // User Session Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppColors.crimson,
                    child: Text(
                      widget.firebaseService.userEmail[0].toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.firebaseService.userEmail,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'ID: ${widget.firebaseService.userId}',
                          style: const TextStyle(fontSize: 11, color: Colors.black45, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ),
                  TextButton(
                    onPressed: widget.onSignOut,
                    child: const Text('Sign Out', style: TextStyle(color: AppColors.crimson, fontSize: 12)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // USB Bridge Setup Guide Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.usb, color: AppColors.crimson, size: 20),
                      const SizedBox(width: 8),
                      const Text(
                        'USB Cable (ADB Reverse) Commands',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'When your phone is plugged in with USB debugging enabled, run these commands in your PC terminal to bridge ports over the cable:',
                    style: TextStyle(fontSize: 11, color: Colors.black54),
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
            child: Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Connection Endpoints',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _engineUrlController,
                    decoration: const InputDecoration(
                      labelText: 'Engine REST URL',
                      helperText: 'Default 127.0.0.1:3001 for USB ADB Reverse',
                    ),
                  ),
                  const SizedBox(height: 14),
                  TextField(
                    controller: _simUrlController,
                    decoration: const InputDecoration(
                      labelText: 'Sim Services Switchboard URL',
                      helperText: 'Default 127.0.0.1:4000 for local Fastify sim',
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
                            const SnackBar(content: Text('Endpoint URLs updated successfully.')),
                          );
                        },
                        child: const Text('Save Endpoints'),
                      ),
                      const SizedBox(width: 8),
                      TextButton(
                        onPressed: () {
                          setState(() {
                            _engineUrlController.text = 'http://127.0.0.1:3001';
                            _simUrlController.text = 'http://127.0.0.1:4000';
                            widget.engineClient.engineUrl = 'http://127.0.0.1:3001';
                            widget.engineClient.simUrl = 'http://127.0.0.1:4000';
                          });
                        },
                        child: const Text('Reset Defaults'),
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
            child: SwitchListTile.adaptive(
              title: const Text('Audible Drift Alarm Beeps', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              subtitle: const Text('Plays high-frequency sound beep and vibration when API changes are detected', style: TextStyle(fontSize: 11)),
              value: SoundService.soundEnabled,
              activeThumbColor: AppColors.crimson,
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
        color: AppColors.charcoal,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              code,
              style: const TextStyle(
                fontFamily: 'monospace',
                fontSize: 11,
                color: Colors.white,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.copy, size: 16, color: Colors.white70),
            onPressed: () => _copyToClipboard(code, label),
          ),
        ],
      ),
    );
  }
}
