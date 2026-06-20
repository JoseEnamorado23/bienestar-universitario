import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/inventory_provider.dart';
import '../../providers/loan_provider.dart';
import '../../widgets/app_drawer.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({Key? key}) : super(key: key);

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<InventoryProvider>(context, listen: false).fetchInventory();
    });
  }

  void _requestLoan(BuildContext context, int itemId) async {
    final loanProvider = Provider.of<LoanProvider>(context, listen: false);
    final success = await loanProvider.requestLoan(itemId);
    
    if (!context.mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(success ? 'Préstamo solicitado exitosamente' : (loanProvider.errorMessage ?? 'Error al solicitar préstamo')),
        backgroundColor: success ? Colors.green : Colors.red,
      ),
    );

    if (success) {
      Provider.of<InventoryProvider>(context, listen: false).fetchInventory();
    }
  }

  @override
  Widget build(BuildContext context) {
    final inventoryProvider = Provider.of<InventoryProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Inventario', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF203A43),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      drawer: const AppDrawer(),
      body: inventoryProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : inventoryProvider.errorMessage != null
              ? Center(child: Text(inventoryProvider.errorMessage!))
              : RefreshIndicator(
                  onRefresh: () => inventoryProvider.fetchInventory(),
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.75,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: inventoryProvider.items.length,
                    itemBuilder: (context, index) {
                      final item = inventoryProvider.items[index];
                      final isAvailable = item.availableQuantity > 0 && item.status == 'ACTIVE';

                      return Card(
                        elevation: 4,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: Container(
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade200,
                                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                                ),
                                child: const Icon(Icons.sports_basketball, size: 48, color: Colors.grey),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.name,
                                    style: const TextStyle(fontWeight: FontWeight.bold),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Disponibles: ${item.availableQuantity}',
                                    style: TextStyle(
                                      color: isAvailable ? Colors.green : Colors.red,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      onPressed: isAvailable ? () => _requestLoan(context, item.id) : null,
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(vertical: 8),
                                        backgroundColor: const Color(0xFF2C5364),
                                        foregroundColor: Colors.white,
                                      ),
                                      child: const Text('Solicitar', style: TextStyle(fontSize: 12)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
