import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<void> login({required String email, required String password}) async {
    _setLoading(true);
    try {
      final data = await ApiService.instance.login(email, password);
      _user = User.fromJson(data['user'] as Map<String, dynamic>);
      final tokens = data['tokens'] as Map<String, dynamic>;
      ApiService.instance.setAuthToken(tokens['accessToken'] as String);
      await StorageService.instance.set('nexus_auth_tokens', tokens);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> register({required String email, required String password, required String username}) async {
    _setLoading(true);
    try {
      final data = await ApiService.instance.register(email, password, username);
      _user = User.fromJson(data['user'] as Map<String, dynamic>);
      final tokens = data['tokens'] as Map<String, dynamic>;
      ApiService.instance.setAuthToken(tokens['accessToken'] as String);
      await StorageService.instance.set('nexus_auth_tokens', tokens);
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    ApiService.instance.clearAuthToken();
    await StorageService.instance.remove('nexus_auth_tokens');
    _user = null;
    notifyListeners();
  }

  void _setLoading(bool v) {
    _isLoading = v;
    notifyListeners();
  }
}
