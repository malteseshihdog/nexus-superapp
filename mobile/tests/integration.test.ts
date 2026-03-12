/**
 * Integration tests — cross-cutting concerns across all mobile platforms.
 */
import { validators } from '../shared/src/utils/validators';
import { generateId, inferLanguageFromPath } from '../shared/src/utils/helpers';
import { formatBytes, formatRelativeTime } from '../shared/src/utils/formatters';
import { notificationHandler } from '../pwa/src/push/notificationHandler';
import { APP_CONSTANTS } from '../shared/src/constants/app.constants';
import { API_CONSTANTS } from '../shared/src/constants/api.constants';
import { UI_CONSTANTS } from '../shared/src/constants/ui.constants';

describe('Integration: constants', () => {
  it('APP_CONSTANTS has required storage keys', () => {
    expect(APP_CONSTANTS.STORAGE_KEYS.AUTH_TOKENS).toBeTruthy();
    expect(APP_CONSTANTS.STORAGE_KEYS.CACHED_PROJECTS).toBeTruthy();
  });

  it('API_CONSTANTS has base URL', () => {
    expect(API_CONSTANTS.BASE_URL).toBeTruthy();
    expect(API_CONSTANTS.VERSION).toBe('v1');
  });

  it('UI_CONSTANTS has primary color', () => {
    expect(UI_CONSTANTS.COLORS.PRIMARY).toBe('#E67E22');
  });
});

describe('Integration: validators consistency', () => {
  it('email validation is consistent across platforms', () => {
    const validEmails = ['user@example.com', 'dev@nexus.io'];
    const invalidEmails = ['not-email', '', '@no-local.com'];
    validEmails.forEach((e) => expect(validators.isValidEmail(e)).toBe(true));
    invalidEmails.forEach((e) => expect(validators.isValidEmail(e)).toBe(false));
  });

  it('password validation requires minimum length', () => {
    expect(validators.isValidPassword('short')).toBe(false);
    expect(validators.isValidPassword('securepwd')).toBe(true);
  });
});

describe('Integration: file language inference', () => {
  const cases: [string, string][] = [
    ['App.tsx', 'typescript'],
    ['main.py', 'python'],
    ['main.dart', 'dart'],
    ['app.rs', 'rust'],
    ['index.html', 'html'],
    ['styles.css', 'css'],
    ['README.md', 'markdown'],
  ];

  cases.forEach(([file, lang]) => {
    it(`infers ${lang} from ${file}`, () => {
      expect(inferLanguageFromPath(file)).toBe(lang);
    });
  });
});

describe('Integration: UUID generation', () => {
  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, generateId));
    expect(ids.size).toBe(100);
  });
});

describe('Integration: formatters', () => {
  it('formatBytes works for all sizes', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(3 * 1024 * 1024)).toBe('3 MB');
  });

  it('formatRelativeTime is always a string', () => {
    const date = new Date(Date.now() - 60000).toISOString();
    expect(typeof formatRelativeTime(date)).toBe('string');
  });
});

describe('Integration: PWA notifications match all platforms', () => {
  it('deployment payloads have title and body', () => {
    const successPayload = notificationHandler.buildDeploymentPayload(true, 'test-project');
    const failPayload = notificationHandler.buildDeploymentPayload(false, 'test-project');
    expect(successPayload.title).toBeTruthy();
    expect(successPayload.body).toBeTruthy();
    expect(failPayload.title).toBeTruthy();
    expect(failPayload.body).toBeTruthy();
  });
});
