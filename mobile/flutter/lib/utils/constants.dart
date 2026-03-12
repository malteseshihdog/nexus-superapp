import 'package:flutter/material.dart';

class AppConstants {
  AppConstants._();

  static const String apiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://api.nexus-ide.com');

  static const Color colorPrimary = Color(0xFFE67E22);
  static const Color colorBackground = Color(0xFF111111);
  static const Color colorSurface = Color(0xFF1A1A1A);
  static const Color colorCard = Color(0xFF222222);
  static const Color colorSuccess = Color(0xFF27AE60);
  static const Color colorError = Color(0xFFE74C3C);

  static const double spacingXs = 4;
  static const double spacingSm = 8;
  static const double spacingMd = 16;
  static const double spacingLg = 24;
  static const double spacingXl = 32;
}
