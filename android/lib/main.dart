import 'package:flutter/material.dart';
import 'services/firebase_service.dart';
import 'services/engine_client.dart';
import 'theme/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final firebaseService = FirebaseService();
  await firebaseService.init();

  final engineClient = EngineClient(firebaseService: firebaseService);

  runApp(IntraCompanionApp(
    firebaseService: firebaseService,
    engineClient: engineClient,
  ));
}

class IntraCompanionApp extends StatefulWidget {
  final FirebaseService firebaseService;
  final EngineClient engineClient;

  const IntraCompanionApp({
    super.key,
    required this.firebaseService,
    required this.engineClient,
  });

  @override
  State<IntraCompanionApp> createState() => _IntraCompanionAppState();
}

class _IntraCompanionAppState extends State<IntraCompanionApp> {
  late bool _isAuthenticated;

  @override
  void initState() {
    super.initState();
    _isAuthenticated = widget.firebaseService.isAuthenticated;
  }

  void _onLoginSuccess() {
    setState(() => _isAuthenticated = true);
  }

  void _onSignOut() async {
    await widget.firebaseService.signOut();
    setState(() => _isAuthenticated = false);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Intra',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: _isAuthenticated
          ? HomeShell(
              engineClient: widget.engineClient,
              firebaseService: widget.firebaseService,
              onSignOut: _onSignOut,
            )
          : LoginScreen(
              firebaseService: widget.firebaseService,
              onLoginSuccess: _onLoginSuccess,
            ),
    );
  }
}
