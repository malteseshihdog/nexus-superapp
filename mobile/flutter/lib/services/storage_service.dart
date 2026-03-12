import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Persistent key-value storage backed by SharedPreferences.
class StorageService {
  StorageService._();
  static final instance = StorageService._();

  Future<T?> get<T>(String key) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(key);
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as T;
    } catch (_) {
      return null;
    }
  }

  Future<void> set<T>(String key, T value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, jsonEncode(value));
  }

  Future<void> remove(String key) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
