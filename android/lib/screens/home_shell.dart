import 'package:flutter/material.dart';
import '../services/engine_client.dart';
import '../services/firebase_service.dart';
import '../theme/app_theme.dart';
import '../services/ble_service.dart';
import 'dashboard_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';

class HomeShell extends StatefulWidget {
  final EngineClient engineClient;
  final FirebaseService firebaseService;
  final BleService? bleService;
  final VoidCallback onSignOut;

  const HomeShell({
    super.key,
    required this.engineClient,
    required this.firebaseService,
    this.bleService,
    required this.onSignOut,
  });

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final screens = [
      DashboardScreen(
        engineClient: widget.engineClient,
        bleService: widget.bleService,
      ),
      HistoryScreen(firebaseService: widget.firebaseService),
      SettingsScreen(
        engineClient: widget.engineClient,
        firebaseService: widget.firebaseService,
        onSignOut: widget.onSignOut,
      ),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: AppColors.darkBorder, width: 0.8)),
        ),
        child: NavigationBar(
          selectedIndex: _currentIndex,
          backgroundColor: AppColors.twitterBlack,
          indicatorColor: const Color(0xFF2F3336),
          onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.dashboard_outlined, color: AppColors.twitterTextSecondary),
              selectedIcon: Icon(Icons.dashboard, color: AppColors.white),
              label: 'Console',
            ),
            NavigationDestination(
              icon: Icon(Icons.history_outlined, color: AppColors.twitterTextSecondary),
              selectedIcon: Icon(Icons.history, color: AppColors.white),
              label: 'Trials History',
            ),
            NavigationDestination(
              icon: Icon(Icons.settings_outlined, color: AppColors.twitterTextSecondary),
              selectedIcon: Icon(Icons.settings, color: AppColors.white),
              label: 'Settings',
            ),
          ],
        ),
      ),
    );
  }
}
