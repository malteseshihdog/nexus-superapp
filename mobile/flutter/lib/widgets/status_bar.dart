import 'package:flutter/material.dart';

class StatusBar extends StatelessWidget {
  final String projectId;
  final bool isDirty;
  final bool isOnline;

  const StatusBar({
    super.key,
    required this.projectId,
    this.isDirty = false,
    this.isOnline = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 24,
      color: const Color(0xFF1A1A1A),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          Text(
            '📁 ${projectId.substring(0, 8)}...',
            style: const TextStyle(fontSize: 10, color: Colors.grey),
          ),
          if (isDirty) ...[
            const SizedBox(width: 12),
            const Text('● unsaved', style: TextStyle(fontSize: 10, color: Color(0xFFF39C12))),
          ],
          const Spacer(),
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isOnline ? const Color(0xFF27AE60) : const Color(0xFFE74C3C),
            ),
          ),
          const SizedBox(width: 4),
          Text(
            isOnline ? 'Online' : 'Offline',
            style: const TextStyle(fontSize: 10, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
