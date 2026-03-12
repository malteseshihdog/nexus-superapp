export interface CDNConfig {
  provider: 'cloudflare' | 'aws-cloudfront' | 'fastly' | 'akamai' | 'custom';
  distributionId?: string;
  baseUrl: string;
  apiKey?: string;
  apiSecret?: string;
  region?: string;
}

export interface CDNAsset {
  path: string;
  cdnUrl: string;
  size: number;
  contentType: string;
  cacheControl: string;
  etag?: string;
  lastModified?: Date;
}

export interface CDNPurgeResult {
  purged: string[];
  failed: string[];
  estimatedPropagationMs: number;
}

export class CDNIntegration {
  private config: CDNConfig;

  constructor(config: CDNConfig) {
    this.config = config;
  }

  async uploadAsset(localPath: string, remotePath: string, options?: {
    contentType?: string;
    cacheControl?: string;
    maxAge?: number;
  }): Promise<CDNAsset> {
    console.log(`Uploading ${localPath} to CDN at ${remotePath}`, options);
    return {
      path: remotePath,
      cdnUrl: `${this.config.baseUrl}/${remotePath}`,
      size: 0,
      contentType: options?.contentType ?? 'application/octet-stream',
      cacheControl: options?.cacheControl ?? `max-age=${options?.maxAge ?? 86400}`,
    };
  }

  async purgeCache(paths: string[]): Promise<CDNPurgeResult> {
    console.log(`Purging CDN cache for ${paths.length} paths`);
    return { purged: paths, failed: [], estimatedPropagationMs: 30_000 };
  }

  async purgeAll(): Promise<void> {
    console.log(`Purging entire CDN cache for distribution ${this.config.distributionId}`);
  }

  async getAssetInfo(path: string): Promise<CDNAsset | null> {
    console.log(`Getting CDN asset info for: ${path}`);
    return null;
  }

  async listAssets(prefix?: string): Promise<CDNAsset[]> {
    console.log(`Listing CDN assets with prefix: ${prefix ?? '/'}`);
    return [];
  }

  async invalidatePaths(patterns: string[]): Promise<void> {
    console.log(`Invalidating CDN paths: ${patterns.join(', ')}`);
  }

  getCDNUrl(path: string): string {
    return `${this.config.baseUrl}/${path.replace(/^\//, '')}`;
  }

  updateConfig(config: Partial<CDNConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
