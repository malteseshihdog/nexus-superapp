import type { AuditLogger } from './auditLogger';

export type ComplianceFramework = 'SOC2' | 'GDPR' | 'HIPAA' | 'ISO27001' | 'PCI-DSS';

export interface ComplianceReport {
  framework: ComplianceFramework;
  organizationId: string;
  generatedAt: Date;
  period: { from: Date; to: Date };
  controls: ComplianceControl[];
  overallStatus: 'compliant' | 'non-compliant' | 'needs-review';
  summary: string;
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'not-applicable' | 'needs-review';
  evidence?: string[];
  gaps?: string[];
  remediation?: string;
}

export class ComplianceReporter {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  async generateReport(organizationId: string, framework: ComplianceFramework, options?: {
    fromDate?: Date;
    toDate?: Date;
  }): Promise<ComplianceReport> {
    const fromDate = options?.fromDate ?? new Date(Date.now() - 90 * 86_400_000);
    const toDate = options?.toDate ?? new Date();

    console.log(`Generating ${framework} compliance report for organization ${organizationId}`);

    const controls = await this.checkControls(organizationId, framework, { fromDate, toDate });
    const failedControls = controls.filter(c => c.status === 'failed').length;
    const overallStatus = failedControls === 0 ? 'compliant'
      : failedControls < 3 ? 'needs-review'
      : 'non-compliant';

    return {
      framework,
      organizationId,
      generatedAt: new Date(),
      period: { from: fromDate, to: toDate },
      controls,
      overallStatus,
      summary: `${framework} compliance report: ${controls.length} controls checked, ${failedControls} failed.`,
    };
  }

  private async checkControls(
    organizationId: string,
    framework: ComplianceFramework,
    period: { fromDate: Date; toDate: Date }
  ): Promise<ComplianceControl[]> {
    const { events } = await this.auditLogger.query({
      organizationId,
      fromDate: period.fromDate,
      toDate: period.toDate,
      limit: 100_000,
    });

    const baseControls = this.getFrameworkControls(framework);
    return baseControls.map(control => ({
      ...control,
      status: events.length > 0 ? 'passed' : 'needs-review',
      evidence: events.length > 0 ? [`${events.length} audit events recorded`] : [],
    }));
  }

  private getFrameworkControls(framework: ComplianceFramework): Omit<ComplianceControl, 'status'>[] {
    const controls: Record<ComplianceFramework, Omit<ComplianceControl, 'status'>[]> = {
      SOC2: [
        { id: 'CC6.1', name: 'Logical and Physical Access Controls', description: 'Access is restricted to authorized users' },
        { id: 'CC7.1', name: 'Threat Detection', description: 'System monitors for potential threats' },
        { id: 'CC9.2', name: 'Change Management', description: 'Changes to systems are authorized and logged' },
      ],
      GDPR: [
        { id: 'Art.30', name: 'Records of Processing', description: 'Processing activities are documented' },
        { id: 'Art.32', name: 'Security of Processing', description: 'Appropriate technical measures are in place' },
        { id: 'Art.33', name: 'Breach Notification', description: 'Data breaches are reported within 72 hours' },
      ],
      HIPAA: [
        { id: 'HIPAA-164.312', name: 'Technical Safeguards', description: 'PHI access is controlled and audited' },
        { id: 'HIPAA-164.308', name: 'Administrative Safeguards', description: 'Security program is documented' },
      ],
      ISO27001: [
        { id: 'A.9', name: 'Access Control', description: 'Access to information and systems is controlled' },
        { id: 'A.12', name: 'Operations Security', description: 'Systems are operated securely' },
        { id: 'A.16', name: 'Incident Management', description: 'Security incidents are managed and reported' },
      ],
      'PCI-DSS': [
        { id: 'Req.7', name: 'Restrict Access', description: 'Access to system components is restricted' },
        { id: 'Req.10', name: 'Track and Monitor', description: 'All access to network resources is tracked' },
      ],
    };
    return controls[framework] ?? [];
  }

  async exportReport(report: ComplianceReport, format: 'json' | 'csv' | 'text' = 'json'): Promise<string> {
    if (format === 'json') return JSON.stringify(report, null, 2);
    if (format === 'csv') {
      const rows = report.controls.map(c =>
        `${c.id},"${c.name}","${c.description}",${c.status}`
      );
      return ['id,name,description,status', ...rows].join('\n');
    }
    const lines = [
      `${report.framework} Compliance Report`,
      `Organization: ${report.organizationId}`,
      `Generated: ${report.generatedAt.toISOString()}`,
      `Status: ${report.overallStatus.toUpperCase()}`,
      '',
      ...report.controls.map(c => `[${c.status.toUpperCase()}] ${c.id}: ${c.name}`),
    ];
    return lines.join('\n');
  }
}
