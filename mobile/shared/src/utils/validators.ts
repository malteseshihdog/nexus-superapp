import { APP_CONSTANTS } from '../constants/app.constants';

export const validators = {
  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  isValidPassword(password: string): boolean {
    return password.length >= APP_CONSTANTS.MIN_PASSWORD_LENGTH;
  },

  isValidUsername(username: string): boolean {
    return /^[a-zA-Z0-9_-]{3,32}$/.test(username);
  },

  isValidProjectName(name: string): boolean {
    return name.trim().length >= 1 && name.trim().length <= 100;
  },

  isValidFilePath(path: string): boolean {
    return path.length > 0 && !path.includes('..') && path.startsWith('/');
  },

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
};
