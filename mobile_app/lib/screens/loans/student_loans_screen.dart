import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/loan_provider.dart';
import '../../widgets/app_drawer.dart';

class StudentLoansScreen extends StatefulWidget {
  const StudentLoansScreen({Key? key}) : super(key: key);

  @override
  State<StudentLoansScreen> createState() => _StudentLoansScreenState();
}

class _StudentLoansScreenState extends State<StudentLoansScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<LoanProvider>(context, listen: false).fetchMyLoans();
    });
  }

  @override
  Widget build(BuildContext context) {
    final loanProvider = Provider.of<LoanProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Préstamos', style: TextStyle(color: Colors.white)),
        backgroundColor: const Color(0xFF203A43),
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      drawer: const AppDrawer(),
      body: loanProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => loanProvider.fetchMyLoans(),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: loanProvider.myLoans.length,
                itemBuilder: (context, index) {
                  final loan = loanProvider.myLoans[index];
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
                          Text('Fecha de solicitud: ${loan.createdAt.toLocal().toString().split('.')[0]}'),
                          if (loan.status == 'DEVUELTO')
                            Text('Horas ganadas: ${loan.hoursEarned}', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                          if (loan.status == 'RECHAZADO')
                            Text('Motivo: ${loan.rejectionReason ?? ''}', style: const TextStyle(color: Colors.red)),
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
