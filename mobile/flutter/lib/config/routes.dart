import 'package:flutter/material.dart';
import '../screens/auth_screen.dart';
import '../screens/projects_screen.dart';
import '../screens/editor_screen.dart';
import '../screens/terminal_screen.dart';
import '../screens/settings_screen.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class AppRoutes {
  AppRoutes._();

  static const String root = '/';
  static const String auth = '/auth';
  static const String projects = '/projects';
  static const String editor = '/editor';
  static const String terminal = '/terminal';
  static const String settings = '/settings';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case root:
        return MaterialPageRoute(
          builder: (ctx) {
            final auth = ctx.watch<AuthProvider>();
            return auth.isAuthenticated ? const ProjectsScreen() : const AuthScreen();
          },
        );
      case AppRoutes.auth:
        return MaterialPageRoute(builder: (_) => const AuthScreen());
      case AppRoutes.projects:
        return MaterialPageRoute(builder: (_) => const ProjectsScreen());
      case AppRoutes.editor:
        final projectId = settings.arguments as String? ?? '';
        return MaterialPageRoute(builder: (_) => EditorScreen(projectId: projectId));
      case AppRoutes.terminal:
        final projectId = settings.arguments as String? ?? '';
        return MaterialPageRoute(builder: (_) => TerminalScreen(projectId: projectId));
      case AppRoutes.settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      default:
        return MaterialPageRoute(builder: (_) => const AuthScreen());
    }
  }
}
