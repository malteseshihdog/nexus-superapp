enum ProjectStatus { active, archived, deploying, error }

class Project {
  final String id;
  final String name;
  final String? description;
  final String language;
  final String ownerId;
  final bool isPublic;
  final ProjectStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  const Project({
    required this.id,
    required this.name,
    this.description,
    required this.language,
    required this.ownerId,
    required this.isPublic,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id: json['id'] as String,
        name: json['name'] as String,
        description: json['description'] as String?,
        language: json['language'] as String,
        ownerId: json['ownerId'] as String,
        isPublic: json['isPublic'] as bool,
        status: ProjectStatus.values.firstWhere(
          (s) => s.name == (json['status'] as String),
          orElse: () => ProjectStatus.active,
        ),
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'description': description,
        'language': language,
        'ownerId': ownerId,
        'isPublic': isPublic,
        'status': status.name,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };
}
