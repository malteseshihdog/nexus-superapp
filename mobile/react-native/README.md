# NEXUS IDE — React Native

Native iOS & Android application for the NEXUS Cloud IDE Platform.

## Structure

```
src/
├── screens/     — Full-page screen components
├── components/  — Reusable UI components
├── navigation/  — React Navigation stack definitions
├── services/    — API, storage, sync, and notification services
├── store/       — Redux Toolkit slices and store configuration
├── hooks/       — Custom React hooks
└── utils/       — Theme, constants, validators, helpers
```

## Features

- 🔐 Biometric & email/password authentication
- 📂 Project management (create, browse, deploy)
- ✏️  Mobile code editor with syntax highlighting
- 💻 Integrated terminal with command history
- 🔄 Offline support with automatic sync
- 🔔 Push notifications (deployments, collaboration)
- 🌓 Dark/light theme support

## Getting Started

```bash
npm install
npm start          # Expo dev server
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
```

## Testing

```bash
npm test
```
