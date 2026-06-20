import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/admin_provider.dart';
import 'providers/inventory_provider.dart';
import 'providers/loan_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/dashboard/admin_dashboard.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AdminProvider()),
        ChangeNotifierProvider(create: (_) => InventoryProvider()),
        ChangeNotifierProvider(create: (_) => LoanProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  bool _isLoading = true;
  bool _isLoggedIn = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  void _checkAuth() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final loggedIn = await authProvider.checkLoginStatus();
    setState(() {
      _isLoggedIn = loggedIn;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Bienestar Universitario',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primaryColor: const Color(0xFF203A43),
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF203A43)),
        useMaterial3: true,
        fontFamily: 'Roboto',
      ),
      home: _isLoading 
          ? const Scaffold(body: Center(child: CircularProgressIndicator()))
          : _isLoggedIn 
              ? const AdminDashboard()
              : const LoginScreen(),
    );
  }
}
