import 'package:flutter/material.dart';
import '../models/student_model.dart';
import '../services/admin_service.dart';

class AdminProvider extends ChangeNotifier {
  final AdminService _adminService = AdminService();
  
  List<StudentModel> _students = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<StudentModel> get students => _students;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchStudents() async {
    _setLoading(true);
    _errorMessage = null;
    try {
      _students = await _adminService.getStudents();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }
    _setLoading(false);
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
