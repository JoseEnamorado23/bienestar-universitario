import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../core/constants.dart';

class ApiService {
  final _storage = const FlutterSecureStorage();
  
  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    return await http.post(
      url,
      headers: headers,
      body: jsonEncode(body),
    );
  }

  Future<http.Response> get(String endpoint, {Map<String, String>? queryParams}) async {
    var url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    if (queryParams != null) {
      url = url.replace(queryParameters: queryParams);
    }
    final headers = await _getHeaders();
    return await http.get(url, headers: headers);
  }

  Future<http.Response> put(String endpoint, [Map<String, dynamic>? body]) async {
    final url = Uri.parse('${ApiConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    return await http.put(
      url,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
  }

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }
}
