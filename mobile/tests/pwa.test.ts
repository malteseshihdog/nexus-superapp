/**
 * PWA module unit tests.
 */
import { notificationHandler } from '../pwa/src/push/notificationHandler';

describe('notificationHandler', () => {
  describe('buildDeploymentPayload', () => {
    it('builds success payload', () => {
      const payload = notificationHandler.buildDeploymentPayload(true, 'my-app');
      expect(payload.title).toContain('Successful');
      expect(payload.body).toContain('my-app');
      expect(payload.body).toContain('successfully');
    });

    it('builds failure payload', () => {
      const payload = notificationHandler.buildDeploymentPayload(false, 'my-app');
      expect(payload.title).toContain('Failed');
      expect(payload.body).toContain('my-app');
      expect(payload.body).toContain('failed');
    });
  });

  describe('buildCollaborationPayload', () => {
    it('includes actor and action in body', () => {
      const payload = notificationHandler.buildCollaborationPayload('Alice', 'edited a file');
      expect(payload.body).toBe('Alice edited a file');
    });
  });

  describe('buildErrorPayload', () => {
    it('sets the error message as body', () => {
      const payload = notificationHandler.buildErrorPayload('Build failed: syntax error');
      expect(payload.body).toBe('Build failed: syntax error');
      expect(payload.title).toContain('Error');
    });
  });
});
