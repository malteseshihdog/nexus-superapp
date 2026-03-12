import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

class EditorProvider extends ChangeNotifier {
  String? _activeFileId;
  String? _activeFileName;
  String? _activeContent;
  String? _activeLanguage;
  bool _isDirty = false;
  bool _showFileTree = true;

  String? get activeFileId => _activeFileId;
  String? get activeFileName => _activeFileName;
  String? get activeContent => _activeContent;
  String? get activeLanguage => _activeLanguage;
  bool get isDirty => _isDirty;
  bool get showFileTree => _showFileTree;

  void toggleFileTree() {
    _showFileTree = !_showFileTree;
    notifyListeners();
  }

  Future<void> openFile({required String fileId, required String path}) async {
    try {
      final data = await ApiService.instance.get('/files/$fileId');
      _activeFileId = fileId;
      _activeFileName = path.split('/').last;
      _activeContent = data['content'] as String? ?? '';
      _activeLanguage = data['language'] as String? ?? 'plaintext';
      _isDirty = false;
      notifyListeners();
    } catch (_) {}
  }

  void updateContent(String content) {
    _activeContent = content;
    _isDirty = true;
    notifyListeners();
  }

  Future<void> saveActiveFile() async {
    if (_activeFileId == null || _activeContent == null) return;
    try {
      await ApiService.instance.post('/files/$_activeFileId', {'content': _activeContent, 'changeType': 'update', 'timestamp': DateTime.now().toIso8601String()});
      _isDirty = false;
      notifyListeners();
    } catch (_) {}
  }
}
