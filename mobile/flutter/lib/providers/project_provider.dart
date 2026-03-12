import 'package:flutter/foundation.dart';
import '../models/project.dart';
import '../services/api_service.dart';

class ProjectProvider extends ChangeNotifier {
  List<Project> _projects = [];
  bool _isLoading = false;
  String? _error;

  List<Project> get projects => _projects;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchProjects({bool refresh = false}) async {
    if (_isLoading) return;
    _isLoading = true;
    if (refresh) _projects = [];
    notifyListeners();
    try {
      final data = await ApiService.instance.listProjects();
      _projects = data.map(Project.fromJson).toList();
      _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createProject({required String name}) async {
    try {
      final data = await ApiService.instance.createProject(name);
      _projects.insert(0, Project.fromJson(data));
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
}
