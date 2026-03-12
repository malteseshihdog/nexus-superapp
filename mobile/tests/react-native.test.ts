/**
 * React Native module unit tests.
 * Run with: jest mobile/tests/react-native.test.ts
 */
import { validators } from '../shared/src/utils/validators';
import { formatBytes, formatRelativeTime, truncate, capitalise } from '../shared/src/utils/formatters';
import { generateId, inferLanguageFromPath, getFileExtension, debounce, throttle } from '../shared/src/utils/helpers';

describe('validators', () => {
  describe('isValidEmail', () => {
    it('accepts valid emails', () => {
      expect(validators.isValidEmail('user@example.com')).toBe(true);
      expect(validators.isValidEmail('dev+tag@nexus.io')).toBe(true);
    });
    it('rejects invalid emails', () => {
      expect(validators.isValidEmail('not-an-email')).toBe(false);
      expect(validators.isValidEmail('@missing-local.com')).toBe(false);
      expect(validators.isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('accepts passwords of 8+ characters', () => {
      expect(validators.isValidPassword('secure!1')).toBe(true);
      expect(validators.isValidPassword('longpassword')).toBe(true);
    });
    it('rejects passwords shorter than 8 characters', () => {
      expect(validators.isValidPassword('short')).toBe(false);
      expect(validators.isValidPassword('')).toBe(false);
    });
  });

  describe('isValidUsername', () => {
    it('accepts valid usernames', () => {
      expect(validators.isValidUsername('nexus_dev')).toBe(true);
      expect(validators.isValidUsername('user123')).toBe(true);
    });
    it('rejects usernames with invalid characters', () => {
      expect(validators.isValidUsername('bad user')).toBe(false);
      expect(validators.isValidUsername('ab')).toBe(false);
    });
  });

  describe('isValidProjectName', () => {
    it('accepts non-empty project names', () => {
      expect(validators.isValidProjectName('My Project')).toBe(true);
    });
    it('rejects empty strings', () => {
      expect(validators.isValidProjectName('')).toBe(false);
      expect(validators.isValidProjectName('   ')).toBe(false);
    });
  });
});

describe('formatters', () => {
  describe('formatBytes', () => {
    it('formats zero bytes', () => expect(formatBytes(0)).toBe('0 B'));
    it('formats kilobytes', () => expect(formatBytes(1024)).toBe('1 KB'));
    it('formats megabytes', () => expect(formatBytes(1048576)).toBe('1 MB'));
  });

  describe('formatRelativeTime', () => {
    it('shows "just now" for fresh timestamps', () => {
      expect(formatRelativeTime(new Date().toISOString())).toBe('just now');
    });
    it('shows minutes for old timestamps', () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinAgo)).toMatch(/m ago/);
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('Hello World!', 8)).toBe('Hello...');
    });
    it('does not truncate short strings', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });
  });

  describe('capitalise', () => {
    it('capitalises first letter', () => expect(capitalise('hello')).toBe('Hello'));
    it('handles empty strings', () => expect(capitalise('')).toBe(''));
  });
});

describe('helpers', () => {
  describe('generateId', () => {
    it('generates unique UUIDs', () => {
      const a = generateId();
      const b = generateId();
      expect(a).not.toBe(b);
      expect(a).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe('inferLanguageFromPath', () => {
    it('infers typescript', () => expect(inferLanguageFromPath('app.ts')).toBe('typescript'));
    it('infers python', () => expect(inferLanguageFromPath('script.py')).toBe('python'));
    it('falls back to plaintext', () => expect(inferLanguageFromPath('file.xyz')).toBe('plaintext'));
  });

  describe('getFileExtension', () => {
    it('returns the extension with dot', () => expect(getFileExtension('index.tsx')).toBe('.tsx'));
    it('returns empty for no extension', () => expect(getFileExtension('Makefile')).toBe(''));
  });

  describe('debounce', () => {
    it('delays function calls', (done) => {
      let calls = 0;
      const debounced = debounce(() => { calls++; }, 50);
      debounced();
      debounced();
      debounced();
      setTimeout(() => {
        expect(calls).toBe(1);
        done();
      }, 100);
    });
  });

  describe('throttle', () => {
    it('limits call rate', (done) => {
      let calls = 0;
      const throttled = throttle(() => { calls++; }, 100);
      throttled();
      throttled();
      throttled();
      setTimeout(() => {
        expect(calls).toBe(1);
        done();
      }, 50);
    });
  });
});
