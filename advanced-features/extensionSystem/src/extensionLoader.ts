import type { Extension } from './extensionRegistry';

export interface LoadOptions {
  sandboxed?: boolean;
  timeout?: number;
  permissions?: string[];
}

export class ExtensionLoader {
  private loadedModules: Map<string, unknown> = new Map();

  async load(source: string, options?: LoadOptions): Promise<Extension> {
    console.log(`Loading extension from: ${source}`, options);
    const extension: Extension = {
      id: this.generateId(source),
      name: source.split('/').pop() ?? source,
      displayName: source.split('/').pop() ?? source,
      version: '1.0.0',
      categories: ['other'],
      state: 'installed',
    };
    return extension;
  }

  async loadFromDirectory(dir: string, options?: LoadOptions): Promise<Extension[]> {
    console.log(`Loading extensions from directory: ${dir}`);
    return [];
  }

  async loadFromNpm(packageName: string, version?: string, options?: LoadOptions): Promise<Extension> {
    console.log(`Loading extension from npm: ${packageName}@${version ?? 'latest'}`);
    return {
      id: packageName,
      name: packageName,
      displayName: packageName,
      version: version ?? '1.0.0',
      categories: ['other'],
      state: 'installed',
    };
  }

  async loadFromUrl(url: string, options?: LoadOptions): Promise<Extension> {
    console.log(`Loading extension from URL: ${url}`);
    return {
      id: this.generateId(url),
      name: url.split('/').pop() ?? 'unknown',
      displayName: url.split('/').pop() ?? 'unknown',
      version: '1.0.0',
      categories: ['other'],
      state: 'installed',
    };
  }

  async unload(extensionId: string): Promise<void> {
    this.loadedModules.delete(extensionId);
    console.log(`Extension module unloaded: ${extensionId}`);
  }

  async reload(extensionId: string, source: string): Promise<Extension> {
    await this.unload(extensionId);
    return this.load(source);
  }

  async validatePackageJson(packageJson: Record<string, unknown>): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    if (!packageJson.name) errors.push('Missing required field: name');
    if (!packageJson.version) errors.push('Missing required field: version');
    if (!packageJson.main && !packageJson.browser) {
      errors.push('Missing required field: main or browser');
    }
    return { valid: errors.length === 0, errors };
  }

  private generateId(source: string): string {
    return source.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
  }
}
