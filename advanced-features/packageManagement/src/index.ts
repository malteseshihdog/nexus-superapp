export { NpmManager } from './npm/npmManager';
export { PackageResolver } from './npm/packageResolver';
export { DependencyAnalyzer } from './npm/dependencyAnalyzer';
export { PipManager } from './pip/pipManager';
export { GemManager } from './gem/gemManager';
export { CargoManager } from './cargo/cargoManager';
export { VulnerabilityScanner } from './services/vulnerabilityScanner';
export { LicenseChecker } from './services/licenseChecker';
export { OutdatedChecker } from './services/outdatedChecker';

export type { PackageInfo, InstallOptions } from './npm/npmManager';
export type { ResolvedPackage } from './npm/packageResolver';
export type { DependencyNode, CircularDependency, DuplicatePackage } from './npm/dependencyAnalyzer';
export type { PipPackage } from './pip/pipManager';
export type { GemInfo } from './gem/gemManager';
export type { CrateInfo } from './cargo/cargoManager';
export type { Vulnerability, ScanResult } from './services/vulnerabilityScanner';
export type { LicenseInfo, LicensePolicy } from './services/licenseChecker';
export type { OutdatedPackage, UpdatePlan } from './services/outdatedChecker';
