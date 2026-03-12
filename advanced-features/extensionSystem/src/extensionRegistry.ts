import type { ExtensionCategory, ExtensionContribution } from './extensionAPI';

export type ExtensionState = 'registered' | 'installed' | 'active' | 'disabled' | 'error';

export interface Extension {
  id: string;
  name: string;
  displayName: string;
  version: string;
  description?: string;
  publisher?: string;
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  categories: ExtensionCategory[];
  keywords?: string[];
  main?: string;
  contributes?: ExtensionContribution;
  activationEvents?: string[];
  dependencies?: string[];
  state: ExtensionState;
  installPath?: string;
  installedAt?: Date;
  updatedAt?: Date;
  downloads?: number;
  rating?: number;
}

export interface MarketplaceExtension extends Extension {
  downloads: number;
  rating: number;
  verified: boolean;
  latestVersion: string;
  publishedAt: Date;
  tags: string[];
}

export class ExtensionRegistry {
  private extensions: Map<string, Extension> = new Map();

  async register(extension: Extension): Promise<void> {
    if (this.extensions.has(extension.id)) {
      throw new Error(`Extension already registered: ${extension.id}`);
    }
    extension.state = 'registered';
    extension.installedAt = new Date();
    this.extensions.set(extension.id, extension);
    console.log(`Extension registered: ${extension.name} v${extension.version}`);
  }

  async unregister(extensionId: string): Promise<void> {
    this.extensions.delete(extensionId);
  }

  async get(extensionId: string): Promise<Extension | null> {
    return this.extensions.get(extensionId) ?? null;
  }

  async list(filter?: { category?: ExtensionCategory; state?: ExtensionState }): Promise<Extension[]> {
    let extensions = Array.from(this.extensions.values());
    if (filter?.category) extensions = extensions.filter(e => e.categories.includes(filter.category!));
    if (filter?.state) extensions = extensions.filter(e => e.state === filter.state);
    return extensions;
  }

  async search(query: string): Promise<Extension[]> {
    const q = query.toLowerCase();
    return Array.from(this.extensions.values()).filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.displayName.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.keywords?.some(k => k.toLowerCase().includes(q))
    );
  }

  async getByCategory(category: ExtensionCategory): Promise<Extension[]> {
    return Array.from(this.extensions.values()).filter(e => e.categories.includes(category));
  }

  async update(extensionId: string, updates: Partial<Extension>): Promise<Extension | null> {
    const extension = this.extensions.get(extensionId);
    if (!extension) return null;
    Object.assign(extension, updates, { updatedAt: new Date() });
    return extension;
  }

  async searchMarketplace(query: string, options?: {
    category?: ExtensionCategory;
    sortBy?: 'downloads' | 'rating' | 'name' | 'updated';
  }): Promise<MarketplaceExtension[]> {
    console.log(`Searching marketplace for: ${query}`, options);
    return [];
  }
}
