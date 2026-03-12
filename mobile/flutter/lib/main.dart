import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'config/routes.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/project_provider.dart';
import 'providers/editor_provider.dart';
import 'providers/ui_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const NexusApp());
}

class NexusApp extends StatelessWidget {
  const NexusApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ProjectProvider()),
        ChangeNotifierProvider(create: (_) => EditorProvider()),
        ChangeNotifierProvider(create: (_) => UiProvider()),
      ],
      child: Consumer<UiProvider>(
        builder: (_, ui, __) => MaterialApp(
          title: 'NEXUS IDE',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.darkTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ui.isDark ? ThemeMode.dark : ThemeMode.light,
          initialRoute: AppRoutes.root,
          onGenerateRoute: AppRoutes.onGenerateRoute,
        ),
      ),
    );
  }
}
