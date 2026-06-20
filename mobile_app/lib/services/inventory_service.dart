import 'dart:convert';
import '../core/constants.dart';
import '../models/item_model.dart';
import 'api_service.dart';

class InventoryService {
  final ApiService _api = ApiService();

  Future<List<ItemModel>> getInventory({int skip = 0, int limit = 50}) async {
    final response = await _api.get(
      ApiConstants.inventoryEndpoint,
      queryParams: {
        'skip': skip.toString(),
        'limit': limit.toString(),
      }
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((e) => ItemModel.fromJson(e)).toList();
    } else {
      throw Exception('Error al obtener inventario');
    }
  }
}
