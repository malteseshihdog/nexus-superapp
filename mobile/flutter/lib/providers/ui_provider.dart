import 'package:flutter/foundation.dart';

class UiProvider extends ChangeNotifier {
  bool _isDark = true;
  bool _isOnline = true;

  bool get isDark => _isDark;
  bool get isOnline => _isOnline;

  void toggleTheme() {
    _isDark = !_isDark;
    notifyListeners();
  }

  void setOnline(bool online) {
    _isOnline = online;
    notifyListeners();
  }
}
