/** Generate a random UUID v4 string (RFC-4122 compliant). */
export function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Deep clone a JSON-serialisable value. */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Debounce a function by `delay` ms. */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** Throttle a function — at most once per `limit` ms. */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/** Sleep for `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Return the file extension from a file path, including the leading dot. */
export function getFileExtension(path: string): string {
  const parts = path.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
}

/** Infer a programming language from a file extension. */
export function inferLanguageFromPath(path: string): string {
  const ext = getFileExtension(path).toLowerCase();
  const map: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.java': 'java',
    '.kt': 'kotlin',
    '.swift': 'swift',
    '.dart': 'dart',
    '.cpp': 'cpp',
    '.c': 'c',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
  };
  return map[ext] ?? 'plaintext';
}
