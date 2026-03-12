export { BundleAnalyzer } from './bundleAnalyzer';
export { CodeOptimizer } from './codeOptimizer';
export { CacheStrategy, CDNIntegration } from './caching';
export { Compression } from './compression';
export { LazyLoading } from './lazyLoading';
export { TreeShaking } from './treeshaking';

export type { BundleStats, ChunkInfo, ModuleInfo, AssetInfo, OptimizationSuggestion } from './bundleAnalyzer';
export type { OptimizationResult, OptimizationChange } from './codeOptimizer';
export type { CacheConfig, CacheStrategyType } from './caching';
export type { CDNConfig, CDNAsset } from './caching';
export type { CompressionAlgorithm, CompressionResult, CompressionConfig } from './compression';
export type { LazyLoadConfig, LazyLoadTarget } from './lazyLoading';
export type { TreeShakingResult, ExportUsage } from './treeshaking';
