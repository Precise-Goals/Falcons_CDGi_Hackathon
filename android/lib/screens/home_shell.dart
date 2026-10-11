import 'package:flutter/material.dart';
import '../services/engine_client.dart';
import '../services/firebase_service.dart';
import '../theme/app_theme.dart';
import 'dashboard_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';

class HomeShell extends StatefulWidget {
  final EngineClient engineClient;
  final FirebaseService firebaseService;
  final VoidCallback onSignOut;

  const HomeShell({
    super.key,
    required this.engineClient,
    required this.firebaseService,
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
      DashboardScreen(engineClient: widget.engineClient),
      HistoryScreen(firebaseService: widget.firebaseService),
      SettingsScreen(
        engineClient: widget.engineClient,
        firebaseService: widget.firebaseService,
        onSignOut: widget.onSignOut,
      ),
    ];

    return Scaffold(
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        backgroundColor: Colors.white,
        indicatorColor: AppColors.crimson.withValues(alpha: 0.12),
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppColors.crimson),
            label: 'Console',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history, color: AppColors.crimson),
            label: 'Trials History',
          ),
          NavigationDestination(
            icon: Icon(Icons.settings_outlined),
            selectedIcon: Icon(Icons.settings, color: AppColors.crimson),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}
