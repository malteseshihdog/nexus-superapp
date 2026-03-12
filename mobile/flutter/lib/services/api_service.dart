import 'dart:convert';
import 'package:http/http.dart' as http;
import '../utils/constants.dart';

/// Minimal HTTP API client for the Flutter module.
class ApiService {
  ApiService._();
  static final instance = ApiService._();

  String? _authToken;
  final String _base = '${AppConstants.apiBaseUrl}/api/v1';

  void setAuthToken(String token) => _authToken = token;
  void clearAuthToken() => _authToken = null;

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    if (_authToken != null) 'Authorization': 'Bearer $_authToken',
  };

  Future<Map<String, dynamic>> post(String path, Map<String, dynamic> body) async {
    final res = await http.post(Uri.parse('$_base$path'), headers: _headers, body: jsonEncode(body));
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> get(String path) async {
    final res = await http.get(Uri.parse('$_base$path'), headers: _headers);
    return jsonDecode(res.body) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getList(String path) async {
    final res = await http.get(Uri.parse('$_base$path'), headers: _headers);
    return jsonDecode(res.body) as List<dynamic>;
  }

  Future<List<Map<String, dynamic>>> listFiles(String projectId) async {
    final list = await getList('/projects/$projectId/files');
    return list.cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    return post('/auth/login', {'email': email, 'password': password});
  }

  Future<Map<String, dynamic>> register(String email, String password, String username) async {
    return post('/auth/register', {'email': email, 'password': password, 'username': username});
  }

  Future<List<Map<String, dynamic>>> listProjects() async {
    final data = await get('/projects');
    return (data['data'] as List).cast<Map<String, dynamic>>();
  }

  Future<Map<String, dynamic>> createProject(String name) async {
    return post('/projects', {'name': name, 'language': 'typescript', 'isPublic': false});
  }
}
