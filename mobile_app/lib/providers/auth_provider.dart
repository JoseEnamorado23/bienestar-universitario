import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  
  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<bool> checkLoginStatus() async {
    _setLoading(true);
    try {
      final loggedIn = await _authService.isLoggedIn();
      if (loggedIn) {
        _user = await _authService.getCurrentUser();
        _setLoading(false);
        return true;
      }
    } catch (e) {
      // Token might be expired
      await logout();
    }
    _setLoading(false);
    return false;
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    _errorMessage = null;
    try {
      _user = await _authService.login(email, password);
      _setLoading(false);
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      return false;
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    _user = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
