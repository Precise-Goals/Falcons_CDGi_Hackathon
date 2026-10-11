import 'package:flutter/material.dart';

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
}

class AppTheme {
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: AppColors.cream,
      primaryColor: AppColors.crimson,
      colorScheme: const ColorScheme.light(
        primary: AppColors.crimson,
        onPrimary: AppColors.white,
        surface: AppColors.white,
        onSurface: AppColors.charcoal,
        secondary: AppColors.charcoal,
        error: AppColors.breaking,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.cream,
        foregroundColor: AppColors.charcoal,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: AppColors.charcoal,
          fontSize: 18,
          fontWeight: FontWeight.bold,
          letterSpacing: -0.2,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: AppColors.borderSubtle, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.crimson,
          foregroundColor: AppColors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.borderSubtle),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.borderSubtle),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.crimson, width: 1.5),
        ),
      ),
    );
  }
}
