import 'package:flutter/material.dart';
import '../models/item_model.dart';
import '../services/inventory_service.dart';

class InventoryProvider extends ChangeNotifier {
  final InventoryService _inventoryService = InventoryService();
  
  List<ItemModel> _items = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<ItemModel> get items => _items;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchInventory() async {
    _setLoading(true);
    _errorMessage = null;
    try {
      _items = await _inventoryService.getInventory();
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
