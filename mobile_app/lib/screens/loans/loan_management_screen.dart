import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/loan_provider.dart';
import '../../widgets/app_drawer.dart';

class LoanManagementScreen extends StatefulWidget {
  const LoanManagementScreen({Key? key}) : super(key: key);

  @override
  State<LoanManagementScreen> createState() => _LoanManagementScreenState();
}

class _LoanManagementScreenState extends State<LoanManagementScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LoanProvider>(context, listen: false).fetchAllLoans();
    });
  }

  void _approveLoan(int loanId) async {
    final provider = Provider.of<LoanProvider>(context, listen: false);
    await provider.approveLoan(loanId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(provider.errorMessage ?? 'Préstamo aprobado')),
    );
  }

  void _returnLoan(int loanId) async {
    final provider = Provider.of<LoanProvider>(context, listen: false);
    await provider.returnLoan(loanId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(provider.errorMessage ?? 'Préstamo retornado')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final loanProvider = Provider.of<LoanProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestión de Préstamos', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF203A43),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      drawer: const AppDrawer(),
      body: loanProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => loanProvider.fetchAllLoans(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: loanProvider.loans.length,
                itemBuilder: (context, index) {
                  final loan = loanProvider.loans[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                loan.item.name,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                              ),
                              Chip(
                                label: Text(loan.status, style: const TextStyle(fontSize: 10, color: Colors.white)),
                                backgroundColor: _getStatusColor(loan.status),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text('Estudiante: ${loan.student.firstName} ${loan.student.lastName}'),
                          Text('Fecha: ${loan.createdAt.toLocal().toString().split('.')[0]}'),
                          if (loan.status == 'SOLICITADO')
                            Padding(
                              padding: const EdgeInsets.only(top: 16.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () => _approveLoan(loan.id),
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                                      child: const Text('Aprobar', style: TextStyle(color: Colors.white)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: ElevatedButton(
                                      onPressed: () {}, // Implement Reject later
                                      style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                                      child: const Text('Rechazar', style: TextStyle(color: Colors.white)),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          if (loan.status == 'ACTIVO')
                            Padding(
                              padding: const EdgeInsets.only(top: 16.0),
                              child: SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () => _returnLoan(loan.id),
                                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                                  child: const Text('Registrar Devolución', style: TextStyle(color: Colors.white)),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'SOLICITADO': return Colors.orange;
      case 'ACTIVO': return Colors.green;
      case 'DEVUELTO': return Colors.grey;
      case 'RECHAZADO': return Colors.red;
      default: return Colors.blue;
    }
  }
}
