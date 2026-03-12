import 'package:flutter/material.dart';

class CodeEditor extends StatelessWidget {
  final String content;
  final String language;
  final ValueChanged<String> onChanged;
  final VoidCallback? onSave;
  final bool readOnly;

  const CodeEditor({
    super.key,
    required this.content,
    required this.language,
    required this.onChanged,
    this.onSave,
    this.readOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF0D0D0D),
      child: SingleChildScrollView(
        child: TextField(
          controller: TextEditingController(text: content),
          onChanged: onChanged,
          maxLines: null,
          readOnly: readOnly,
          style: const TextStyle(
            fontFamily: 'monospace',
            fontSize: 13,
            color: Color(0xFFCCCCCC),
            height: 1.6,
          ),
          decoration: const InputDecoration(
            border: InputBorder.none,
            contentPadding: EdgeInsets.all(12),
          ),
          keyboardType: TextInputType.multiline,
          autocorrect: false,
          enableSuggestions: false,
        ),
      ),
    );
  }
}
