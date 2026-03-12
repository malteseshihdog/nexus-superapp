import 'package:flutter/material.dart';

class TerminalWidget extends StatefulWidget {
  final Future<void> Function(String command)? onCommand;
  const TerminalWidget({super.key, this.onCommand});

  @override
  State<TerminalWidget> createState() => TerminalWidgetState();
}

class TerminalWidgetState extends State<TerminalWidget> {
  final List<_Line> _lines = [];
  final _controller = TextEditingController();
  final _scroll = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void writeLine(String text, {bool isError = false}) {
    setState(() => _lines.add(_Line(text: text, isError: isError)));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) _scroll.jumpTo(_scroll.position.maxScrollExtent);
    });
  }

  void clear() => setState(() => _lines.clear());

  Future<void> _submit() async {
    final cmd = _controller.text.trim();
    if (cmd.isEmpty) return;
    writeLine('\$ $cmd', isError: false);
    _controller.clear();
    await widget.onCommand?.call(cmd);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: Container(
            color: const Color(0xFF0D0D0D),
            padding: const EdgeInsets.all(8),
            child: ListView.builder(
              controller: _scroll,
              itemCount: _lines.length,
              itemBuilder: (_, i) => Text(
                _lines[i].text,
                style: TextStyle(
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: _lines[i].isError ? Colors.redAccent : const Color(0xFFCCCCCC),
                  height: 1.5,
                ),
              ),
            ),
          ),
        ),
        Container(
          color: const Color(0xFF1A1A1A),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: Row(
            children: [
              const Text('\$ ', style: TextStyle(color: Color(0xFFE67E22), fontFamily: 'monospace')),
              Expanded(
                child: TextField(
                  controller: _controller,
                  onSubmitted: (_) => _submit(),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 13, color: Color(0xFFCCCCCC)),
                  decoration: const InputDecoration(border: InputBorder.none, isDense: true),
                  autocorrect: false,
                  enableSuggestions: false,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Line {
  final String text;
  final bool isError;
  _Line({required this.text, required this.isError});
}
