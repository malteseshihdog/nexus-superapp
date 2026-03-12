class ProjectFile {
  final String id;
  final String projectId;
  final String name;
  final String path;
  final String? content;
  final String language;
  final bool isDirectory;
  final DateTime updatedAt;

  const ProjectFile({
    required this.id,
    required this.projectId,
    required this.name,
    required this.path,
    this.content,
    required this.language,
    required this.isDirectory,
    required this.updatedAt,
  });

  factory ProjectFile.fromJson(Map<String, dynamic> json) => ProjectFile(
        id: json['id'] as String,
        projectId: json['projectId'] as String,
        name: json['name'] as String,
        path: json['path'] as String,
        content: json['content'] as String?,
        language: json['language'] as String,
        isDirectory: json['isDirectory'] as bool,
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );
}
