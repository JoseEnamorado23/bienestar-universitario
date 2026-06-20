import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/dashboard/admin_dashboard.dart';
import '../screens/inventory/inventory_screen.dart';
import '../screens/loans/loan_management_screen.dart';
import '../screens/loans/student_loans_screen.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({Key? key}) : super(key: key);

  void _logout(BuildContext context) async {
    await Provider.of<AuthProvider>(context, listen: false).logout();
    if (!context.mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final perms = user?.permissions ?? [];

    return Drawer(
      child: Container(
        color: const Color(0xFFF4F7F6),
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                color: Color(0xFF203A43),
              ),
              accountName: Text('${user?.firstName} ${user?.lastName}', 
                style: const TextStyle(fontWeight: FontWeight.bold)),
              accountEmail: Text(user?.email ?? ''),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.tealAccent.shade400,
                child: Text(
                  user?.firstName.isNotEmpty == true ? user!.firstName[0] : 'U',
                  style: const TextStyle(fontSize: 24, color: Color(0xFF203A43), fontWeight: FontWeight.bold),
                ),
              ),
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  ListTile(
                    leading: const Icon(Icons.dashboard, color: Color(0xFF2C5364)),
                    title: const Text('Dashboard'),
                    onTap: () {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const AdminDashboard()),
                      );
                    },
                  ),
                  
                  // Inventory (Manage or Read)
                  if (perms.contains('inventory:manage') || perms.contains('inventory:read') || perms.contains('loan:read:own'))
                    ListTile(
                      leading: const Icon(Icons.inventory, color: Color(0xFF2C5364)),
                      title: const Text('Inventario'),
                      onTap: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => const InventoryScreen()),
                        );
                      },
                    ),

                  // Loans (Admin)
                  if (perms.contains('loan:read:all'))
                    ListTile(
                      leading: const Icon(Icons.assignment, color: Color(0xFF2C5364)),
                      title: const Text('Gestión de Préstamos'),
                      onTap: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => const LoanManagementScreen()),
                        );
                      },
                    ),

                  // My Loans (Student)
                  if (perms.contains('loan:read:own'))
                    ListTile(
                      leading: const Icon(Icons.assignment_ind, color: Color(0xFF2C5364)),
                      title: const Text('Mis Préstamos'),
                      onTap: () {
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(builder: (_) => const StudentLoansScreen()),
                        );
                      },
                    ),
                ],
              ),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent),
              title: const Text('Cerrar Sesión', style: TextStyle(color: Colors.redAccent)),
              onTap: () => _logout(context),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
