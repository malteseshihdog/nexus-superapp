import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/editor_provider.dart';
import '../widgets/code_editor.dart';
import '../widgets/file_tree.dart';
import '../widgets/status_bar.dart';
import '../utils/constants.dart';

class EditorScreen extends StatelessWidget {
  final String projectId;
  const EditorScreen({super.key, required this.projectId});

  @override
  Widget build(BuildContext context) {
    final editor = context.watch<EditorProvider>();
    return Scaffold(
      appBar: AppBar(
        title: Text(editor.activeFileName ?? 'Editor', style: const TextStyle(fontSize: 14)),
        leading: IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => editor.toggleFileTree(),
        ),
        actions: [
          if (editor.isDirty)
            IconButton(
              icon: const Icon(Icons.save_outlined),
              tooltip: 'Save',
              onPressed: () => editor.saveActiveFile(),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                if (editor.showFileTree)
                  SizedBox(
                    width: 220,
                    child: FileTree(
                      projectId: projectId,
                      onFileSelected: (fileId, path) {
                        editor.openFile(fileId: fileId, path: path);
                      },
                    ),
                  ),
                Expanded(
                  child: editor.activeContent != null
                      ? CodeEditor(
                          content: editor.activeContent!,
                          language: editor.activeLanguage ?? 'plaintext',
                          onChanged: editor.updateContent,
                          onSave: editor.saveActiveFile,
                        )
                      : const Center(
                          child: Text(
                            'Open a file from the tree',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ),
                ),
              ],
            ),
          ),
          StatusBar(projectId: projectId, isDirty: editor.isDirty),
        ],
      ),
    );
  }
}
