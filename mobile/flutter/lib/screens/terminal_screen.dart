import 'package:flutter/material.dart';
import '../widgets/terminal.dart';
import '../utils/constants.dart';

class TerminalScreen extends StatefulWidget {
  final String projectId;
  const TerminalScreen({super.key, required this.projectId});

  @override
  State<TerminalScreen> createState() => _TerminalScreenState();
}

class _TerminalScreenState extends State<TerminalScreen> {
  final _terminalKey = GlobalKey<TerminalWidgetState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Terminal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.clear_all),
            tooltip: 'Clear',
            onPressed: () => _terminalKey.currentState?.clear(),
          ),
        ],
      ),
      body: TerminalWidget(
        key: _terminalKey,
        onCommand: (cmd) async {
          _terminalKey.currentState?.writeLine('Executing: $cmd');
          // In production: delegate to a WebSocket terminal session
          await Future.delayed(const Duration(milliseconds: 200));
          _terminalKey.currentState?.writeLine('Done.');
        },
      ),
    );
  }
}
