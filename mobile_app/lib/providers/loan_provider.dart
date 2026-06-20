import 'package:flutter/material.dart';
import '../models/loan_model.dart';
import '../services/loan_service.dart';

class LoanProvider extends ChangeNotifier {
  final LoanService _loanService = LoanService();
  
  List<LoanModel> _loans = [];
  List<LoanModel> _myLoans = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<LoanModel> get loans => _loans;
  List<LoanModel> get myLoans => _myLoans;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchAllLoans() async {
    _setLoading(true);
    _errorMessage = null;
    try {
      _loans = await _loanService.getAllLoans();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }
    _setLoading(false);
  }

  Future<void> fetchMyLoans() async {
    _setLoading(true);
    _errorMessage = null;
    try {
      _myLoans = await _loanService.getMyLoans();
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    }
    _setLoading(false);
  }

  Future<bool> requestLoan(int itemId) async {
    _setLoading(true);
    try {
      await _loanService.requestLoan(itemId);
      await fetchMyLoans();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      return false;
    }
  }

  Future<bool> approveLoan(int loanId) async {
    _setLoading(true);
    try {
      await _loanService.approveLoan(loanId);
      await fetchAllLoans();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      return false;
    }
  }

  Future<bool> returnLoan(int loanId) async {
    _setLoading(true);
    try {
      await _loanService.returnLoan(loanId);
      await fetchAllLoans();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
      _setLoading(false);
      return false;
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
