import 'dart:convert';
import '../core/constants.dart';
import '../models/student_model.dart';
import 'api_service.dart';

class AdminService {
  final ApiService _api = ApiService();

  Future<List<StudentModel>> getStudents({int skip = 0, int limit = 50}) async {
    final response = await _api.get(
      ApiConstants.studentsEndpoint, 
      queryParams: {
        'skip': skip.toString(),
        'limit': limit.toString(),
      }
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final List items = data['items'] ?? [];
      return items.map((e) => StudentModel.fromJson(e)).toList();
    } else {
      throw Exception('Error al obtener estudiantes');
    }
  }
}
