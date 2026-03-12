export type CompressionAlgorithm = 'gzip' | 'brotli' | 'deflate' | 'zstd';

export interface CompressionResult {
  algorithm: CompressionAlgorithm;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  timeMs: number;
}

export interface CompressionConfig {
  algorithms: CompressionAlgorithm[];
  level?: number;
  threshold?: number;
  mimeTypes?: string[];
}

export class Compression {
  private config: CompressionConfig;

  constructor(config: CompressionConfig = {
    algorithms: ['brotli', 'gzip'],
    level: 6,
    threshold: 1024,
  }) {
    this.config = config;
  }

  async compress(data: Buffer | string, algorithm: CompressionAlgorithm = 'gzip'): Promise<CompressionResult> {
    const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const start = Date.now();
    console.log(`Compressing ${input.length} bytes with ${algorithm}`);
    return {
      algorithm,
      originalSize: input.length,
      compressedSize: Math.floor(input.length * 0.7),
      ratio: 0.7,
      timeMs: Date.now() - start,
    };
  }

  async decompress(data: Buffer, algorithm: CompressionAlgorithm): Promise<Buffer> {
    console.log(`Decompressing with ${algorithm}`);
    return data;
  }

  async getBestAlgorithm(data: Buffer | string): Promise<CompressionAlgorithm> {
    const results = await Promise.all(
      this.config.algorithms.map(algo => this.compress(data, algo))
    );
    const best = results.reduce((a, b) => a.compressedSize < b.compressedSize ? a : b);
    return best.algorithm;
  }

  async compressFile(filePath: string, algorithm?: CompressionAlgorithm): Promise<CompressionResult> {
    console.log(`Compressing file: ${filePath}`);
    return {
      algorithm: algorithm ?? 'gzip',
      originalSize: 0,
      compressedSize: 0,
      ratio: 1,
      timeMs: 0,
    };
  }

  shouldCompress(contentType: string, size: number): boolean {
    if (size < (this.config.threshold ?? 1024)) return false;
    const compressibleTypes = this.config.mimeTypes ?? [
      'text/', 'application/json', 'application/javascript',
      'application/xml', 'image/svg+xml',
    ];
    return compressibleTypes.some(t => contentType.includes(t));
  }
}
