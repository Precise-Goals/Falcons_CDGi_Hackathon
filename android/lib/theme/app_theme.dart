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

  // Twitter/X Minimalist Material Red & Black Palette (with alternating patches)
  static const Color twitterBlack = Color(0xFF0A0A0A);
  static const Color darkPatch = Color(0xFF16181C);
  static const Color darkBorder = Color(0xFF2F3336);
  static const Color lightPatch = Color(0xFFFAF7F2);
  static const Color lightBorder = Color(0xFFE1E8ED);
  static const Color crimsonPatch = Color(0xFF1F080A);
  static const Color crimsonLightPatch = Color(0xFFFFF0F2);
  static const Color twitterTextSecondary = Color(0xFF71767B);
  static const Color twitterTextLight = Color(0xFFE7E9EA);
}

class AppTheme {
  /// Minimalistic Material Twitter-style UI for Red and Black with uniform Poppins typography
  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.poppinsTextTheme();

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.twitterBlack,
      primaryColor: AppColors.crimson,
      fontFamily: GoogleFonts.poppins().fontFamily,
      textTheme: baseTextTheme.apply(
        bodyColor: AppColors.twitterTextLight,
        displayColor: AppColors.twitterTextLight,
      ),
      colorScheme: const ColorScheme.dark(
        primary: AppColors.crimson,
        onPrimary: AppColors.white,
        surface: AppColors.darkPatch,
        onSurface: AppColors.twitterTextLight,
        secondary: AppColors.crimson,
        error: AppColors.breaking,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.twitterBlack,
        foregroundColor: AppColors.white,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.poppins(
          color: AppColors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
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
          backgroundColor: AppColors.crimson,
          foregroundColor: AppColors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999), // Twitter pill button
          ),
          textStyle: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkPatch,
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
          borderSide: const BorderSide(color: AppColors.crimson, width: 1.5),
        ),
      ),
    );
  }
}
