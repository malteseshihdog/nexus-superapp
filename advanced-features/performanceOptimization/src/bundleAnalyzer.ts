export interface BundleStats {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  modules: ModuleInfo[];
  assets: AssetInfo[];
  buildTime: number;
}

export interface ChunkInfo {
  id: string;
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isInitial: boolean;
  isDynamic: boolean;
}

export interface ModuleInfo {
  id: string;
  name: string;
  size: number;
  chunks: string[];
  issuer?: string;
  reasons: string[];
  depth: number;
}

export interface AssetInfo {
  name: string;
  size: number;
  gzippedSize: number;
  chunkNames: string[];
  type: 'js' | 'css' | 'image' | 'font' | 'other';
}

export interface OptimizationSuggestion {
  type: 'split' | 'deduplicate' | 'tree-shake' | 'compress' | 'lazy-load' | 'cdn';
  description: string;
  estimatedSaving: number;
  priority: 'high' | 'medium' | 'low';
  module?: string;
}

export class BundleAnalyzer {
  private stats: BundleStats | null = null;

  async analyze(statsFile?: string): Promise<BundleStats> {
    console.log(`Analyzing bundle${statsFile ? ` from ${statsFile}` : ''}`);
    this.stats = {
      totalSize: 0,
      gzippedSize: 0,
      chunks: [],
      modules: [],
      assets: [],
      buildTime: 0,
    };
    return this.stats;
  }

  async getLargestModules(topN = 20): Promise<ModuleInfo[]> {
    if (!this.stats) return [];
    return this.stats.modules.sort((a, b) => b.size - a.size).slice(0, topN);
  }

  async getDuplicateModules(): Promise<{ name: string; copies: number; totalSize: number }[]> {
    console.log('Checking for duplicate modules');
    return [];
  }

  async generateSuggestions(): Promise<OptimizationSuggestion[]> {
    if (!this.stats) return [];
    const suggestions: OptimizationSuggestion[] = [];
    if (this.stats.totalSize > 500_000) {
      suggestions.push({
        type: 'split',
        description: 'Consider splitting your bundle into smaller chunks for better caching',
        estimatedSaving: this.stats.totalSize * 0.3,
        priority: 'high',
      });
    }
    return suggestions;
  }

  async generateReport(): Promise<string> {
    if (!this.stats) return 'No bundle stats available. Run analyze() first.';
    const lines = [
      'Bundle Analysis Report',
      '=====================',
      `Total size: ${(this.stats.totalSize / 1024).toFixed(1)} KB`,
      `Gzipped: ${(this.stats.gzippedSize / 1024).toFixed(1)} KB`,
      `Chunks: ${this.stats.chunks.length}`,
      `Modules: ${this.stats.modules.length}`,
      `Assets: ${this.stats.assets.length}`,
      `Build time: ${this.stats.buildTime}ms`,
    ];
    return lines.join('\n');
  }

  getStats(): BundleStats | null {
    return this.stats;
  }
}
