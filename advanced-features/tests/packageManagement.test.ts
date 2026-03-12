import { NpmManager } from '../packageManagement/src/npm/npmManager';
import { PackageResolver } from '../packageManagement/src/npm/packageResolver';
import { DependencyAnalyzer } from '../packageManagement/src/npm/dependencyAnalyzer';
import { PipManager } from '../packageManagement/src/pip/pipManager';
import { GemManager } from '../packageManagement/src/gem/gemManager';
import { CargoManager } from '../packageManagement/src/cargo/cargoManager';
import { VulnerabilityScanner } from '../packageManagement/src/services/vulnerabilityScanner';
import { LicenseChecker } from '../packageManagement/src/services/licenseChecker';
import { OutdatedChecker } from '../packageManagement/src/services/outdatedChecker';

describe('Package Management - NPM', () => {
  it('should initialize NpmManager', () => {
    const manager = new NpmManager('/tmp/test-project');
    expect(manager).toBeInstanceOf(NpmManager);
  });

  it('should return empty package list', async () => {
    const manager = new NpmManager('/tmp/test-project');
    const packages = await manager.list();
    expect(Array.isArray(packages)).toBe(true);
  });

  it('should return audit with no vulnerabilities', async () => {
    const manager = new NpmManager('/tmp/test-project');
    const result = await manager.audit();
    expect(result.vulnerabilities).toBe(0);
    expect(result.critical).toBe(0);
  });

  it('should initialize PackageResolver', () => {
    const resolver = new PackageResolver('/tmp/test-project');
    expect(resolver).toBeInstanceOf(PackageResolver);
  });

  it('should validate integrity successfully', async () => {
    const resolver = new PackageResolver('/tmp/test-project');
    const result = await resolver.validateIntegrity([]);
    expect(result.valid).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it('should find no conflicts initially', async () => {
    const resolver = new PackageResolver('/tmp/test-project');
    const conflicts = await resolver.findConflicts();
    expect(Array.isArray(conflicts)).toBe(true);
  });

  it('should initialize DependencyAnalyzer', () => {
    const analyzer = new DependencyAnalyzer('/tmp/test-project');
    expect(analyzer).toBeInstanceOf(DependencyAnalyzer);
  });

  it('should generate empty report', async () => {
    const analyzer = new DependencyAnalyzer('/tmp/test-project');
    const report = await analyzer.generateReport();
    expect(report.totalPackages).toBe(0);
    expect(report.circular).toEqual([]);
  });
});

describe('Package Management - Other Ecosystems', () => {
  it('should initialize PipManager', () => {
    const manager = new PipManager('/tmp/test-project');
    expect(manager).toBeInstanceOf(PipManager);
  });

  it('should return empty pip package list', async () => {
    const manager = new PipManager('/tmp/test-project');
    const packages = await manager.list();
    expect(Array.isArray(packages)).toBe(true);
  });

  it('should initialize GemManager', () => {
    const manager = new GemManager('/tmp/test-project');
    expect(manager).toBeInstanceOf(GemManager);
  });

  it('should return empty gem list', async () => {
    const manager = new GemManager('/tmp/test-project');
    const gems = await manager.list();
    expect(Array.isArray(gems)).toBe(true);
  });

  it('should initialize CargoManager', () => {
    const manager = new CargoManager('/tmp/test-project');
    expect(manager).toBeInstanceOf(CargoManager);
  });

  it('should search crates and return empty list', async () => {
    const manager = new CargoManager('/tmp/test-project');
    const crates = await manager.search('serde');
    expect(Array.isArray(crates)).toBe(true);
  });
});

describe('Package Management - Services', () => {
  it('should scan and return empty vulnerability result', async () => {
    const scanner = new VulnerabilityScanner('/tmp/test-project');
    const result = await scanner.scan('npm');
    expect(result.vulnerabilities).toEqual([]);
    expect(result.summary.critical).toBe(0);
    expect(result.scannedAt).toBeInstanceOf(Date);
  });

  it('should generate vulnerability report', async () => {
    const scanner = new VulnerabilityScanner('/tmp/test-project');
    const result = await scanner.scan('npm');
    const report = await scanner.generateReport(result);
    expect(report).toContain('Vulnerability Scan Report');
    expect(report).toContain('0');
  });

  it('should check licenses', async () => {
    const checker = new LicenseChecker('/tmp/test-project');
    const licenses = await checker.check();
    expect(Array.isArray(licenses)).toBe(true);
  });

  it('should detect denied licenses', async () => {
    const checker = new LicenseChecker('/tmp/test-project');
    const violations = await checker.findViolations([{
      packageName: 'test-package',
      version: '1.0.0',
      license: 'GPL-3.0',
      spdxId: 'GPL-3.0',
      compatible: false,
      permissive: false,
    }]);
    expect(violations.denied).toHaveLength(1);
  });

  it('should return empty outdated list', async () => {
    const checker = new OutdatedChecker('/tmp/test-project');
    const outdated = await checker.check('npm');
    expect(Array.isArray(outdated)).toBe(true);
  });

  it('should create update plan', async () => {
    const checker = new OutdatedChecker('/tmp/test-project');
    const plan = await checker.createUpdatePlan([
      { name: 'lodash', currentVersion: '4.0.0', wantedVersion: '4.17.0', latestVersion: '4.17.21', type: 'dependencies', updateType: 'patch', ecosystem: 'npm' },
      { name: 'react', currentVersion: '17.0.0', wantedVersion: '18.0.0', latestVersion: '18.2.0', type: 'dependencies', updateType: 'major', ecosystem: 'npm' },
    ]);
    expect(plan.safe).toHaveLength(1);
    expect(plan.major).toHaveLength(1);
  });
});
