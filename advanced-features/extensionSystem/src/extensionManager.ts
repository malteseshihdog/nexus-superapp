import type { Extension } from './extensionRegistry';
import { ExtensionRegistry } from './extensionRegistry';
import { ExtensionLoader } from './extensionLoader';

export interface ExtensionManagerConfig {
  extensionDirectory?: string;
  autoLoad?: boolean;
  sandboxed?: boolean;
}

export class ExtensionManager {
  private registry: ExtensionRegistry;
  private loader: ExtensionLoader;
  private config: ExtensionManagerConfig;
  private activeExtensions: Set<string> = new Set();

  constructor(config: ExtensionManagerConfig = {}) {
    this.config = config;
    this.registry = new ExtensionRegistry();
    this.loader = new ExtensionLoader();
  }

  async install(source: string): Promise<Extension> {
    console.log(`Installing extension from: ${source}`);
    const extension = await this.loader.load(source);
    await this.registry.register(extension);
    if (this.config.autoLoad) {
      await this.activate(extension.id);
    }
    return extension;
  }

  async uninstall(extensionId: string): Promise<void> {
    if (this.activeExtensions.has(extensionId)) {
      await this.deactivate(extensionId);
    }
    await this.registry.unregister(extensionId);
    console.log(`Extension uninstalled: ${extensionId}`);
  }

  async activate(extensionId: string): Promise<void> {
    const extension = await this.registry.get(extensionId);
    if (!extension) throw new Error(`Extension not found: ${extensionId}`);
    if (this.activeExtensions.has(extensionId)) return;

    console.log(`Activating extension: ${extension.name} v${extension.version}`);
    this.activeExtensions.add(extensionId);
    extension.state = 'active';
  }

  async deactivate(extensionId: string): Promise<void> {
    const extension = await this.registry.get(extensionId);
    if (!extension) return;
    this.activeExtensions.delete(extensionId);
    extension.state = 'installed';
    console.log(`Extension deactivated: ${extensionId}`);
  }

  async update(extensionId: string): Promise<Extension | null> {
    console.log(`Updating extension: ${extensionId}`);
    return this.registry.get(extensionId);
  }

  async listInstalled(): Promise<Extension[]> {
    return this.registry.list();
  }

  async listActive(): Promise<Extension[]> {
    const all = await this.registry.list();
    return all.filter(e => this.activeExtensions.has(e.id));
  }

  getRegistry(): ExtensionRegistry {
    return this.registry;
  }

  getLoader(): ExtensionLoader {
    return this.loader;
  }
}
