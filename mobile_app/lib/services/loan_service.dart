import 'dart:convert';
import '../core/constants.dart';
import '../models/loan_model.dart';
import 'api_service.dart';

class LoanService {
  final ApiService _api = ApiService();

  Future<List<LoanModel>> getAllLoans({int skip = 0, int limit = 50}) async {
    final response = await _api.get(
      ApiConstants.loansEndpoint,
      queryParams: {
        'skip': skip.toString(),
        'limit': limit.toString(),
      }
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final List items = data['items'] ?? [];
      return items.map((e) => LoanModel.fromJson(e)).toList();
    } else {
      throw Exception('Error al obtener préstamos');
    }
  }

  Future<List<LoanModel>> getMyLoans() async {
    final response = await _api.get(ApiConstants.myLoansEndpoint);

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => LoanModel.fromJson(e)).toList();
    } else {
      throw Exception('Error al obtener tus préstamos');
    }
  }

  Future<LoanModel> requestLoan(int itemId) async {
    final response = await _api.post(
      ApiConstants.requestLoanEndpoint,
      {'item_id': itemId},
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return LoanModel.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['detail'] ?? 'Error al solicitar préstamo');
    }
  }

  Future<void> approveLoan(int loanId) async {
    final response = await _api.put('${ApiConstants.loansEndpoint}$loanId/approve');
    if (response.statusCode != 200) {
      throw Exception('Error al aprobar préstamo');
    }
  }

  Future<void> rejectLoan(int loanId, String reason) async {
    final response = await _api.put(
      '${ApiConstants.loansEndpoint}$loanId/reject',
      {'reason': reason},
    );
    if (response.statusCode != 200) {
      throw Exception('Error al rechazar préstamo');
    }
  }

  Future<void> returnLoan(int loanId) async {
    final response = await _api.put('${ApiConstants.loansEndpoint}$loanId/return');
    if (response.statusCode != 200) {
      throw Exception('Error al retornar préstamo');
    }
  }
}
