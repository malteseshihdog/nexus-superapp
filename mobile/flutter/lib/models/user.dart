class User {
  final String id;
  final String email;
  final String username;
  final String displayName;
  final String? avatarUrl;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.email,
    required this.username,
    required this.displayName,
    this.avatarUrl,
    required this.createdAt,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        email: json['email'] as String,
        username: json['username'] as String,
        displayName: json['displayName'] as String,
        avatarUrl: json['avatarUrl'] as String?,
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'username': username,
        'displayName': displayName,
        'avatarUrl': avatarUrl,
        'createdAt': createdAt.toIso8601String(),
      };
}
