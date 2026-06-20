import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/admin_provider.dart';
import '../auth/login_screen.dart';
import '../../widgets/app_drawer.dart';

class AdminDashboard extends StatefulWidget {
  const AdminDashboard({Key? key}) : super(key: key);

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AdminProvider>(context, listen: false).fetchStudents();
    });
  }

  void _logout() async {
    await Provider.of<AuthProvider>(context, listen: false).logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final adminProvider = Provider.of<AdminProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user;

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7F6),
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: const Text(
          'Dashboard Admin',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: const Color(0xFF203A43),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: _logout,
          ),
        ],
      ),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24.0),
            decoration: const BoxDecoration(
              color: Color(0xFF203A43),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(32),
                bottomRight: Radius.circular(32),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hola, ${user?.firstName ?? 'Admin'} 👋',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  user?.email ?? '',
                  style: const TextStyle(color: Colors.white70),
                ),
              ],
            ),
          ),
          const Padding(
            padding: EdgeInsets.all(20.0),
            child: Text(
              'Estudiantes Registrados',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F2027),
              ),
            ),
          ),
          Expanded(
            child: adminProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : adminProvider.errorMessage != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline, color: Colors.red, size: 48),
                            const SizedBox(height: 16),
                            Text(adminProvider.errorMessage!),
                            ElevatedButton(
                              onPressed: () => adminProvider.fetchStudents(),
                              child: const Text('Reintentar'),
                            )
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: () => adminProvider.fetchStudents(),
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: adminProvider.students.length,
                          itemBuilder: (context, index) {
                            final student = adminProvider.students[index];
                            final progress = student.socialHoursRequired > 0
                                ? (student.socialHoursCompleted / student.socialHoursRequired)
                                : 0.0;
                                
                            return Card(
                              margin: const EdgeInsets.only(bottom: 16),
                              elevation: 2,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(16.0),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 28,
                                      backgroundColor: const Color(0xFF2C5364),
                                      child: Text(
                                        student.firstName.isNotEmpty 
                                          ? student.firstName[0].toUpperCase() 
                                          : 'S',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 16),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            '${student.firstName} ${student.lastName}',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 16,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            student.programName,
                                            style: TextStyle(
                                              color: Colors.grey.shade600,
                                              fontSize: 13,
                                            ),
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            children: [
                                              Expanded(
                                                child: LinearProgressIndicator(
                                                  value: progress > 1.0 ? 1.0 : progress,
                                                  backgroundColor: Colors.grey.shade200,
                                                  color: progress >= 1.0 
                                                    ? Colors.green 
                                                    : Colors.teal,
                                                  minHeight: 6,
                                                ),
                                              ),
                                              const SizedBox(width: 12),
                                              Text(
                                                '${student.socialHoursCompleted.toStringAsFixed(0)}/${student.socialHoursRequired}h',
                                                style: const TextStyle(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 12,
                                                ),
                                              ),
                                            ],
                                          )
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: student.status == 'ACTIVE' 
                                            ? Colors.green.withOpacity(0.1) 
                                            : Colors.red.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        student.status,
                                        style: TextStyle(
                                          color: student.status == 'ACTIVE' 
                                              ? Colors.green.shade700 
                                              : Colors.red.shade700,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
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
          ),
        ],
      ),
    );
  }
}
