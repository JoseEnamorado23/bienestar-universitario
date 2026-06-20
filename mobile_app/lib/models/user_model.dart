class UserModel {
  final int id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String? role;
  final List<String> permissions;
  final String status;
  final bool isVerified;

  UserModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    this.role,
    required this.permissions,
    required this.status,
    required this.isVerified,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      phone: json['phone'],
      role: json['role'],
      permissions: List<String>.from(json['permissions'] ?? []),
      status: json['status'] ?? 'ACTIVE',
      isVerified: json['is_verified'] ?? false,
    );
  }
}
