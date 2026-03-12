import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/ui_provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final ui = context.watch<UiProvider>();
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: const AppBar(title: Text('Settings')),
      body: ListView(
        children: [
          _Section(title: 'Account', children: [
            ListTile(title: const Text('Email'), trailing: Text(auth.user?.email ?? '—', style: const TextStyle(color: Colors.grey))),
            ListTile(title: const Text('Username'), trailing: Text(auth.user?.username ?? '—', style: const TextStyle(color: Colors.grey))),
          ]),
          _Section(title: 'Appearance', children: [
            SwitchListTile(
              title: const Text('Dark Mode'),
              value: ui.isDark,
              activeColor: AppConstants.colorPrimary,
              onChanged: (_) => ui.toggleTheme(),
            ),
          ]),
          _Section(title: 'Account Actions', children: [
            ListTile(
              title: const Text('Sign Out', style: TextStyle(color: Colors.redAccent)),
              onTap: () => auth.logout(),
            ),
          ]),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});
  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
          child: Text(
            title.toUpperCase(),
            style: const TextStyle(fontSize: 11, letterSpacing: 1, color: Colors.grey, fontWeight: FontWeight.w600),
          ),
        ),
        Card(margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), child: Column(children: children)),
      ],
    );
  }
}
