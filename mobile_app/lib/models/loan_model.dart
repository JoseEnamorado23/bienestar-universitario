import 'item_model.dart';

class StudentMiniModel {
  final int id;
  final String firstName;
  final String lastName;
  final String documentId;
  final String? programName;
  final String? email;
  final String? phone;

  StudentMiniModel({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.documentId,
    this.programName,
    this.email,
    this.phone,
  });

  factory StudentMiniModel.fromJson(Map<String, dynamic> json) {
    return StudentMiniModel(
      id: json['id'],
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      documentId: json['document_id'] ?? '',
      programName: json['program_name'],
      email: json['email'],
      phone: json['phone'],
    );
  }
}

class LoanModel {
  final int id;
  final int itemId;
  final int studentId;
  final String status;
  final String? rejectionReason;
  final DateTime? startTime;
  final DateTime? expectedReturnTime;
  final DateTime? returnedTime;
  final double hoursEarned;
  final DateTime createdAt;
  final ItemModel item;
  final StudentMiniModel student;

  LoanModel({
    required this.id,
    required this.itemId,
    required this.studentId,
    required this.status,
    this.rejectionReason,
    this.startTime,
    this.expectedReturnTime,
    this.returnedTime,
    required this.hoursEarned,
    required this.createdAt,
    required this.item,
    required this.student,
  });

  factory LoanModel.fromJson(Map<String, dynamic> json) {
    return LoanModel(
      id: json['id'],
      itemId: json['item_id'],
      studentId: json['student_id'],
      status: json['status'] ?? 'PENDING',
      rejectionReason: json['rejection_reason'],
      startTime: json['start_time'] != null ? DateTime.parse(json['start_time']) : null,
      expectedReturnTime: json['expected_return_time'] != null ? DateTime.parse(json['expected_return_time']) : null,
      returnedTime: json['returned_time'] != null ? DateTime.parse(json['returned_time']) : null,
      hoursEarned: (json['hours_earned'] ?? 0).toDouble(),
      createdAt: DateTime.parse(json['created_at']),
      item: ItemModel.fromJson(json['item'] ?? {}),
      student: StudentMiniModel.fromJson(json['student'] ?? {}),
    );
  }
}
