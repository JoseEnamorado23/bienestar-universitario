class StudentModel {
  final int id;
  final String email;
  final String firstName;
  final String lastName;
  final String status;
  final bool isVerified;
  final String? nationalId;
  final String? phone;
  final String programName;
  final double socialHoursCompleted;
  final int socialHoursRequired;
  final String? blockReason;

  StudentModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.status,
    required this.isVerified,
    this.nationalId,
    this.phone,
    required this.programName,
    required this.socialHoursCompleted,
    required this.socialHoursRequired,
    this.blockReason,
  });

  factory StudentModel.fromJson(Map<String, dynamic> json) {
    return StudentModel(
      id: json['id'],
      email: json['email'],
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      status: json['status'] ?? 'INACTIVE',
      isVerified: json['is_verified'] ?? false,
      nationalId: json['national_id'],
      phone: json['phone'],
      programName: json['program_name'] ?? 'Sin programa',
      // Convert to double in case it comes as int
      socialHoursCompleted: (json['social_hours_completed'] ?? 0).toDouble(),
      socialHoursRequired: json['social_hours_required'] ?? 0,
      blockReason: json['block_reason'],
    );
  }
}
