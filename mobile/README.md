# Mobile Integration Module

Comprehensive mobile support for the NEXUS Cloud IDE Platform, providing React Native, Flutter, and PWA implementations with offline support and cross-platform synchronisation.

## Sub-modules

| Directory | Platform | Language | Description |
|-----------|----------|----------|-------------|
| `react-native/` | iOS & Android | TypeScript / React | Redux-powered native app |
| `flutter/` | iOS & Android | Dart / Flutter | Provider-based Material app |
| `pwa/` | Web | TypeScript | Service worker, offline, push |
| `shared/` | All | TypeScript | API client, types, utilities |

## Architecture

```
mobile/
├── react-native/   — React Native application (Expo-compatible)
├── flutter/        — Flutter application (Dart)
├── pwa/            — Progressive Web App layer
├── shared/         — Shared TypeScript utilities and API client
└── tests/          — Cross-platform integration tests
```

## Key Features

### Code Editor on Mobile
- Monospace font editor with auto-correct disabled
- File tree navigation with expand/collapse
- Tab bar with dirty-state indicator
- Save with optimistic local state

### Terminal
- Full-screen terminal emulator component
- Command history with scrollable output
- Platform keyboard handling

### Project Management
- Project list with status badges
- Create / delete projects
- Pull-to-refresh

### Offline Support
- IndexedDB change queue (PWA)
- AsyncStorage pending changes (React Native)
- SharedPreferences-backed queue (Flutter)
- Background sync when connectivity returns

### Notifications
- Push notification subscription (Web Push / APNs / FCM)
- Local notifications for deployments and collaboration events

### Authentication
- Email / password login & registration
- Secure token storage (SecureStore on RN, SharedPreferences on Flutter, localStorage on PWA)
- Token-refresh interceptor

## Running Tests

```bash
# From repository root
npx jest mobile/tests --passWithNoTests
```

## Getting Started

See the README in each sub-directory for platform-specific setup instructions.
