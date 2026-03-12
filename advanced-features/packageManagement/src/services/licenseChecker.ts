export interface LicenseInfo {
  packageName: string;
  version: string;
  license: string;
  licenseText?: string;
  spdxId?: string;
  compatible: boolean;
  permissive: boolean;
  url?: string;
}

export interface LicensePolicy {
  allowed: string[];
  denied: string[];
  reviewRequired: string[];
}

const DEFAULT_POLICY: LicensePolicy = {
  allowed: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC', 'CC0-1.0', '0BSD'],
  denied: ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'CC-BY-NC-4.0'],
  reviewRequired: ['LGPL-2.1', 'LGPL-3.0', 'MPL-2.0', 'EUPL-1.2'],
};

export class LicenseChecker {
  private projectPath: string;
  private policy: LicensePolicy;

  constructor(projectPath: string, policy: LicensePolicy = DEFAULT_POLICY) {
    this.projectPath = projectPath;
    this.policy = policy;
  }

  async check(): Promise<LicenseInfo[]> {
    console.log(`Checking licenses in ${this.projectPath}`);
    return [];
  }

  async checkPackage(name: string, version: string): Promise<LicenseInfo | null> {
    console.log(`Checking license for ${name}@${version}`);
    return null;
  }

  async findViolations(licenses: LicenseInfo[]): Promise<{
    denied: LicenseInfo[];
    reviewRequired: LicenseInfo[];
  }> {
    const denied = licenses.filter(l => this.policy.denied.includes(l.spdxId ?? l.license));
    const reviewRequired = licenses.filter(l => this.policy.reviewRequired.includes(l.spdxId ?? l.license));
    return { denied, reviewRequired };
  }

  async generateReport(licenses: LicenseInfo[]): Promise<string> {
    const lines = [
      'License Report',
      '==============',
      `Total packages: ${licenses.length}`,
      '',
      ...licenses.map(l => `${l.packageName}@${l.version}: ${l.license}`),
    ];
    return lines.join('\n');
  }

  setPolicy(policy: LicensePolicy): void {
    this.policy = policy;
  }

  getPolicy(): LicensePolicy {
    return this.policy;
  }
}
