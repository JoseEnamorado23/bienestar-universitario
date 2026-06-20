import 'dart:convert';
import '../core/constants.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api = ApiService();

  Future<UserModel> login(String email, String password) async {
    final response = await _api.post(ApiConstants.loginEndpoint, {
      'email': email,
      'password': password,
    });

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _api.saveTokens(data['access_token'], data['refresh_token']);
      return await getCurrentUser();
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['detail'] ?? 'Error al iniciar sesión');
    }
  }

  Future<UserModel> getCurrentUser() async {
    final response = await _api.get(ApiConstants.meEndpoint);
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return UserModel.fromJson(data);
    } else {
      throw Exception('Sesión expirada o inválida');
    }
  }

  Future<void> logout() async {
    await _api.clearTokens();
  }

  Future<bool> isLoggedIn() async {
    final token = await _api.getAccessToken();
    return token != null && token.isNotEmpty;
  }
}
