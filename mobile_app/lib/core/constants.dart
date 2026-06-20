class ApiConstants {
  // Para emulador Android usar 10.0.2.2, para iOS / Web usar localhost o 127.0.0.1
  // IP local (192.168.1.4) para probar en un dispositivo físico real
  static const String baseUrl = 'http://192.168.1.4:8000/api/v1';

  static const String loginEndpoint = '/auth/login';
  static const String meEndpoint = '/auth/me';
  static const String studentsEndpoint = '/admin/students';

  // Inventory Endpoints
  static const String inventoryEndpoint = '/inventory/';

  // Loan Endpoints
  static const String loansEndpoint = '/loans/';
  static const String myLoansEndpoint = '/loans/my-loans';
  static const String requestLoanEndpoint = '/loans/request';
}
