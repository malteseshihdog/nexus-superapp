import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  bool _isRegister = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _usernameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    if (_isRegister) {
      await auth.register(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
        username: _usernameCtrl.text.trim(),
      );
    } else {
      await auth.login(
        email: _emailCtrl.text.trim(),
        password: _passwordCtrl.text,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.spacingXl),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 48),
                Text(
                  'NEXUS IDE',
                  style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        color: AppConstants.colorPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Cloud Development Platform',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 40),
                if (_isRegister)
                  TextFormField(
                    controller: _usernameCtrl,
                    decoration: const InputDecoration(labelText: 'Username'),
                    validator: (v) => (v?.length ?? 0) < 3 ? 'Min 3 characters' : null,
                  ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                  validator: (v) => (v?.contains('@') ?? false) ? null : 'Invalid email',
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Password'),
                  validator: (v) => (v?.length ?? 0) >= 8 ? null : 'Min 8 characters',
                ),
                const SizedBox(height: 24),
                if (auth.error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(auth.error!, style: const TextStyle(color: Colors.redAccent)),
                  ),
                ElevatedButton(
                  onPressed: auth.isLoading ? null : _submit,
                  child: auth.isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text(_isRegister ? 'Create Account' : 'Sign In'),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => setState(() => _isRegister = !_isRegister),
                  child: Text(_isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
