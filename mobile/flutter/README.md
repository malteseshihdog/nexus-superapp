# NEXUS IDE — Flutter

Flutter implementation of the NEXUS Cloud IDE mobile application for iOS and Android.

## Structure

```
lib/
├── main.dart         — App entry point with Provider setup
├── screens/          — Full-page UI screens
├── widgets/          — Reusable Flutter widgets
├── services/         — API, storage, sync, notification
├── models/           — Dart data models
├── providers/        — ChangeNotifier state providers
├── utils/            — Constants, theme, helpers
└── config/           — Routes and theme configuration
```

## Features

- 🔐 Email/password authentication
- 📂 Project listing & creation
- ✏️  Code editor with monospace font
- 💻 Integrated terminal widget
- 🔄 Offline change queue with sync
- 🔔 Local push notifications
- 🌓 Dark / light theming via Provider

## Getting Started

```bash
flutter pub get
flutter run
```

## Testing

```bash
flutter test
```
