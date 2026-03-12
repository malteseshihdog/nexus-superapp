enum DeploymentStatus { pending, running, success, failed }

class Deployment {
  final String id;
  final String projectId;
  final DeploymentStatus status;
  final String? url;
  final String? error;
  final DateTime createdAt;

  const Deployment({
    required this.id,
    required this.projectId,
    required this.status,
    this.url,
    this.error,
    required this.createdAt,
  });

  factory Deployment.fromJson(Map<String, dynamic> json) => Deployment(
        id: json['id'] as String,
        projectId: json['projectId'] as String,
        status: DeploymentStatus.values.firstWhere(
          (s) => s.name == (json['status'] as String),
          orElse: () => DeploymentStatus.pending,
        ),
        url: json['url'] as String?,
        error: json['error'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}
