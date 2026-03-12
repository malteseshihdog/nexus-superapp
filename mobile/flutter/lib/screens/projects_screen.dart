import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/project_provider.dart';
import '../models/project.dart';
import '../config/routes.dart';
import '../utils/constants.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProjectProvider>().fetchProjects();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProjectProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => Navigator.pushNamed(context, AppRoutes.settings),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => provider.createProject(name: 'New Project ${DateTime.now().millisecondsSinceEpoch}'),
        child: const Icon(Icons.add),
      ),
      body: provider.isLoading && provider.projects.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : provider.projects.isEmpty
              ? const Center(child: Text('No projects yet. Tap + to create one.'))
              : RefreshIndicator(
                  onRefresh: () => provider.fetchProjects(refresh: true),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(AppConstants.spacingMd),
                    itemCount: provider.projects.length,
                    itemBuilder: (_, i) => _ProjectCard(project: provider.projects[i]),
                  ),
                ),
    );
  }
}

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({required this.project});
  final Project project;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppConstants.spacingMd),
      child: ListTile(
        leading: const Icon(Icons.folder_outlined, color: AppConstants.colorPrimary),
        title: Text(project.name, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: project.description != null ? Text(project.description!, maxLines: 1, overflow: TextOverflow.ellipsis) : null,
        trailing: Text(
          project.language,
          style: const TextStyle(fontSize: 12, color: AppConstants.colorPrimary),
        ),
        onTap: () => Navigator.pushNamed(context, AppRoutes.editor, arguments: project.id),
      ),
    );
  }
}
