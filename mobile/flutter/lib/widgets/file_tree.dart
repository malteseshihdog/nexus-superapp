import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../utils/constants.dart';

class FileTree extends StatefulWidget {
  final String projectId;
  final void Function(String fileId, String path) onFileSelected;

  const FileTree({super.key, required this.projectId, required this.onFileSelected});

  @override
  State<FileTree> createState() => _FileTreeState();
}

class _FileTreeEntry {
  final String id;
  final String name;
  final String path;
  final bool isDirectory;
  bool isExpanded;

  _FileTreeEntry({
    required this.id,
    required this.name,
    required this.path,
    required this.isDirectory,
    this.isExpanded = false,
  });
}

class _FileTreeState extends State<FileTree> {
  List<_FileTreeEntry> _entries = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final files = await ApiService.instance.listFiles(widget.projectId);
      setState(() {
        _entries = files
            .map((f) => _FileTreeEntry(id: f['id'] as String, name: f['name'] as String, path: f['path'] as String, isDirectory: f['isDirectory'] as bool))
            .toList();
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(strokeWidth: 2));
    }
    return Container(
      color: const Color(0xFF1A1A1A),
      child: ListView.builder(
        itemCount: _entries.length,
        itemBuilder: (_, i) {
          final entry = _entries[i];
          return ListTile(
            dense: true,
            leading: Icon(
              entry.isDirectory ? (entry.isExpanded ? Icons.folder_open : Icons.folder) : Icons.insert_drive_file_outlined,
              size: 18,
              color: entry.isDirectory ? AppConstants.colorPrimary : Colors.grey,
            ),
            title: Text(entry.name, style: const TextStyle(fontSize: 13)),
            onTap: () {
              if (entry.isDirectory) {
                setState(() => entry.isExpanded = !entry.isExpanded);
              } else {
                widget.onFileSelected(entry.id, entry.path);
              }
            },
          );
        },
      ),
    );
  }
}
