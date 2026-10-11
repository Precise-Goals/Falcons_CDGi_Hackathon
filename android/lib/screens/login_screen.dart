import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/firebase_service.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  final FirebaseService firebaseService;
  final VoidCallback onLoginSuccess;

  const LoginScreen({
    super.key,
    required this.firebaseService,
    required this.onLoginSuccess,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'operator@intra.build');
  final _passwordController = TextEditingController();
  bool _isSignUp = false;
  bool _isLoading = false;
  String? _errorMessage;

  Future<void> _handleSubmit() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || !email.contains('@')) {
      setState(() => _errorMessage = 'Please enter a valid developer email address.');
      return;
    }
    if (password.length < 6) {
      setState(() => _errorMessage = 'Password must be at least 6 characters.');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (_isSignUp) {
        await widget.firebaseService.signUpWithEmailPassword(email, password);
      } else {
        await widget.firebaseService.signInWithEmailPassword(email, password);
      }

      if (mounted) {
        setState(() => _isLoading = false);
        widget.onLoginSuccess();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          final raw = e.toString().replaceAll('Exception: ', '');
          if (raw.contains('EMAIL_NOT_FOUND') || raw.contains('INVALID_LOGIN_CREDENTIALS')) {
            _errorMessage = 'Account not found or invalid credentials. Switch to "Create Account" to register.';
          } else if (raw.contains('EMAIL_EXISTS')) {
            _errorMessage = 'This email is already registered. Please sign in instead.';
          } else if (raw.contains('INVALID_PASSWORD')) {
            _errorMessage = 'Incorrect password. Please verify and retry.';
          } else {
            _errorMessage = raw;
          }
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.twitterBlack,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Top Brand Logo
                Center(
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: AppColors.darkPatch,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: AppColors.darkBorder),
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Image.asset(
                      'assets/logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Icon(
                        Icons.shield_outlined,
                        color: AppColors.crimson,
                        size: 36,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: Text(
                    'INTRA',
                    style: GoogleFonts.poppins(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                      color: AppColors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Center(
                  child: Text(
                    'Live Drift Alarm & Switchboard Remote Console',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      color: AppColors.twitterTextSecondary,
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // Card Container
                Card(
                  elevation: 0,
                  color: AppColors.darkPatch,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                    side: const BorderSide(color: AppColors.darkBorder),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(22.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF221215),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.4)),
                              ),
                              child: Text(
                                'REAL FIREBASE AUTH',
                                style: GoogleFonts.poppins(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: const Color(0xFFFF6B6B),
                                ),
                              ),
                            ),
                            const Spacer(),
                            const Icon(Icons.usb, size: 16, color: AppColors.twitterTextSecondary),
                            const SizedBox(width: 4),
                            Text(
                              'ADB Reverse (tcp:3001)',
                              style: GoogleFonts.firaCode(fontSize: 10, color: AppColors.twitterTextSecondary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Mode Selector (Sign In vs Register)
                        Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF0F1115),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.darkBorder),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() {
                                    _isSignUp = false;
                                    _errorMessage = null;
                                  }),
                                  borderRadius: BorderRadius.circular(10),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    decoration: BoxDecoration(
                                      color: !_isSignUp ? const Color(0xFF2F3336) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Center(
                                      child: Text(
                                        'Sign In',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: !_isSignUp ? FontWeight.w700 : FontWeight.normal,
                                          color: !_isSignUp ? AppColors.white : AppColors.twitterTextSecondary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: InkWell(
                                  onTap: () => setState(() {
                                    _isSignUp = true;
                                    _errorMessage = null;
                                  }),
                                  borderRadius: BorderRadius.circular(10),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    decoration: BoxDecoration(
                                      color: _isSignUp ? const Color(0xFF2F3336) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Center(
                                      child: Text(
                                        'Create Account',
                                        style: GoogleFonts.poppins(
                                          fontSize: 12,
                                          fontWeight: _isSignUp ? FontWeight.w700 : FontWeight.normal,
                                          color: _isSignUp ? AppColors.white : AppColors.twitterTextSecondary,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Email Field
                        TextField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          style: GoogleFonts.poppins(color: AppColors.white, fontSize: 13),
                          decoration: const InputDecoration(
                            labelText: 'Operator Email',
                            hintText: 'e.g. operator@company.com',
                            prefixIcon: Icon(Icons.email_outlined, size: 20, color: AppColors.twitterTextSecondary),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Password Field
                        TextField(
                          controller: _passwordController,
                          obscureText: true,
                          style: GoogleFonts.poppins(color: AppColors.white, fontSize: 13),
                          decoration: const InputDecoration(
                            labelText: 'Password',
                            hintText: 'Min 6 characters',
                            prefixIcon: Icon(Icons.lock_outline, size: 20, color: AppColors.twitterTextSecondary),
                          ),
                        ),
                        const SizedBox(height: 20),

                        if (_errorMessage != null) ...[
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: const Color(0xFF221215),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.5)),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline, size: 16, color: Color(0xFFFF5252)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _errorMessage!,
                                    style: GoogleFonts.poppins(color: const Color(0xFFFF6B6B), fontSize: 11),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                        ],

                        // High contrast Twitter pill button
                        ElevatedButton(
                          onPressed: _isLoading ? null : _handleSubmit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.buttonPrimaryBg,
                            foregroundColor: AppColors.buttonPrimaryText,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.buttonPrimaryText),
                                )
                              : Text(
                                  _isSignUp ? 'Create Firebase Operator Account' : 'Sign In via Firebase',
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.buttonPrimaryText,
                                  ),
                                ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Real status badge
                Center(
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Project horizon-1ba53 Live & Operational',
                        style: GoogleFonts.firaCode(
                          fontSize: 11,
                          color: AppColors.twitterTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
