/**
 * Flutter utility unit tests (TypeScript side — covers the shared utilities
 * mirrored in the Dart helpers so that the JS ecosystem can validate them).
 * Flutter-native Dart tests live in mobile/flutter/test/.
 */
import { formatBytes, formatRelativeTime, truncate } from '../shared/src/utils/formatters';
import { validators } from '../shared/src/utils/validators';

describe('Flutter shared utilities (TS mirror)', () => {
  describe('formatBytes', () => {
    it('0 bytes', () => expect(formatBytes(0)).toBe('0 B'));
    it('1 KB', () => expect(formatBytes(1024)).toBe('1 KB'));
    it('2.5 MB', () => expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB'));
  });

  describe('formatRelativeTime', () => {
    it('just now for current time', () => {
      expect(formatRelativeTime(new Date().toISOString())).toBe('just now');
    });
    it('hours ago', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toMatch(/h ago/);
    });
    it('days ago', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toMatch(/d ago/);
    });
  });

  describe('truncate', () => {
    it('shortens text with ellipsis', () => {
      expect(truncate('Hello World!', 8)).toBe('Hello...');
    });
    it('leaves short text intact', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });
  });

  describe('validators', () => {
    it('validates correct email', () => {
      expect(validators.isValidEmail('flutter@nexus.dev')).toBe(true);
    });
    it('rejects invalid email', () => {
      expect(validators.isValidEmail('bad')).toBe(false);
    });
    it('accepts valid URL', () => {
      expect(validators.isValidUrl('https://nexus-ide.com')).toBe(true);
    });
    it('rejects invalid URL', () => {
      expect(validators.isValidUrl('not-a-url')).toBe(false);
    });
  });
});
