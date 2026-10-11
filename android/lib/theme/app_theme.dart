import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Intra Washi & Crimson Palette
  static const Color crimson = Color(0xFFC8102E);
  static const Color crimsonHover = Color(0xFFA00C24);
  static const Color cream = Color(0xFFFAF7F2);
  static const Color creamSubtle = Color(0xFFF3EFE8);
  static const Color charcoal = Color(0xFF0A0A0A);
  static const Color darkCard = Color(0xFF141414);
  static const Color white = Color(0xFFFFFFFF);

  // Semantic status colors
  static const Color success = Color(0xFF059669);
  static const Color warning = Color(0xFFD97706);
  static const Color breaking = Color(0xFFDC2626);
  static const Color borderSubtle = Color(0x1A0A0A0A);

  // Twitter/X Minimalist Material Dark Palette (Zero white background patches, high-contrast buttons)
  static const Color twitterBlack = Color(0xFF000000);
  static const Color darkPatch = Color(0xFF16181C);
  static const Color darkCardElevated = Color(0xFF1E2024);
  static const Color darkBorder = Color(0xFF2F3336);
  static const Color darkBorderSubtle = Color(0xFF222529);
  static const Color darkCodeBg = Color(0xFF0D0E11);
  static const Color lightPatch = Color(0xFF16181C); // Remapped from white to dark surface
  static const Color lightBorder = Color(0xFF2F3336);
  static const Color crimsonPatch = Color(0xFF1A0A0D);
  static const Color crimsonLightPatch = Color(0xFF1E0E12); // Remapped from white to dark tint
  static const Color twitterTextSecondary = Color(0xFF71767B);
  static const Color twitterTextLight = Color(0xFFE7E9EA);
  static const Color twitterTextMuted = Color(0xFF536471);

  // High-contrast Twitter/X pill button palette
  static const Color buttonPrimaryBg = Color(0xFFFFFFFF); // High-contrast white pill
  static const Color buttonPrimaryText = Color(0xFF000000); // 100% crisp readable jet black
  static const Color buttonSecondaryBg = Color(0xFF202327); // Dark secondary pill
  static const Color buttonSecondaryText = Color(0xFFFFFFFF);
  static const Color buttonDangerBg = Color(0xFF1F1114);
  static const Color buttonDangerBorder = Color(0xFFDC2626);
  static const Color buttonDangerText = Color(0xFFFF5252);
}

class AppTheme {
  /// Minimalistic Material Twitter-style UI for Red and Black with uniform Poppins typography
  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.poppinsTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.twitterBlack,
      primaryColor: AppColors.buttonPrimaryBg,
      fontFamily: GoogleFonts.poppins().fontFamily,
      textTheme: baseTextTheme.apply(
        bodyColor: AppColors.twitterTextLight,
        displayColor: AppColors.twitterTextLight,
      ),
      colorScheme: const ColorScheme.dark(
        primary: AppColors.buttonPrimaryBg,
        onPrimary: AppColors.buttonPrimaryText,
        surface: AppColors.darkPatch,
        onSurface: AppColors.twitterTextLight,
        secondary: AppColors.crimson,
        onSecondary: AppColors.white,
        error: AppColors.breaking,
        onError: AppColors.white,
        outline: AppColors.darkBorder,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.twitterBlack,
        foregroundColor: AppColors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.poppins(
          color: AppColors.white,
          fontSize: 16,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkPatch,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.darkBorder, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.buttonPrimaryBg,
          foregroundColor: AppColors.buttonPrimaryText,
          disabledBackgroundColor: const Color(0xFF2F3336),
          disabledForegroundColor: AppColors.twitterTextSecondary,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999), // Twitter pill button
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: AppColors.twitterTextLight,
          disabledForegroundColor: AppColors.twitterTextSecondary,
          side: const BorderSide(color: AppColors.darkBorder, width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.twitterTextLight,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          textStyle: GoogleFonts.poppins(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.twitterBlack,
        indicatorColor: const Color(0xFF2F3336),
        surfaceTintColor: Colors.transparent,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.white);
          }
          return GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.twitterTextSecondary);
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: AppColors.white, size: 22);
          }
          return const IconThemeData(color: AppColors.twitterTextSecondary, size: 22);
        }),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkPatch,
        hintStyle: GoogleFonts.poppins(color: AppColors.twitterTextSecondary, fontSize: 13),
        labelStyle: GoogleFonts.poppins(color: AppColors.twitterTextSecondary, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.white, width: 1.5),
        ),
      ),
    );
  }
}

