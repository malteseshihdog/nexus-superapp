# @nexus/mobile-shared

Shared utilities, types, API client, and constants consumed by all mobile sub-modules (React Native, Flutter bridge, PWA).

## Structure

```
src/
├── api/          — API client, typed endpoints, request/response interceptors
├── types/        — TypeScript interfaces for auth, projects, files, and API shapes
├── utils/        — validators, formatters, storage abstraction, and helpers
└── constants/    — API, UI, and application-level constants
```

## Usage

```ts
import { apiClient } from './api/client';
import { authEndpoints } from './api/endpoints';
import { validators } from './utils/validators';
import { APP_CONSTANTS } from './constants/app.constants';
```

## Development

```bash
npm run build   # type-check
npm run lint    # eslint
```
