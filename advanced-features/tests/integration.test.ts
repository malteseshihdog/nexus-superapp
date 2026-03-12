/**
 * Integration tests for the Advanced Features module.
 * These tests verify that the various modules work together correctly.
 */
import { GitManager } from '../versionControl/src/git/gitManager';
import { BranchManager } from '../versionControl/src/git/branchManager';
import { CommitHandler } from '../versionControl/src/git/commitHandler';
import { DiffGenerator } from '../versionControl/src/git/diffGenerator';
import { NpmManager } from '../packageManagement/src/npm/npmManager';
import { VulnerabilityScanner } from '../packageManagement/src/services/vulnerabilityScanner';
import { LicenseChecker } from '../packageManagement/src/services/licenseChecker';
import { CompletionEngine } from '../aiCodeCompletion/src/completionEngine';
import { OpenAIProvider } from '../aiCodeCompletion/src/providers/openai.provider';
import { ContextBuilder } from '../aiCodeCompletion/src/contextBuilder';
import { CompletionCache } from '../aiCodeCompletion/src/caching';
import { RateLimiter } from '../aiCodeCompletion/src/rateLimit';
import { DebuggerManager } from '../advancedDebugging/src/debugger/debuggerManager';
import { AuditLogger } from '../enterpriseFeatures/src/audit/auditLogger';
import { ComplianceReporter } from '../enterpriseFeatures/src/audit/complianceReporter';
import { BillingManager } from '../enterpriseFeatures/src/billing/billingManager';
import { TeamManager } from '../enterpriseFeatures/src/teams/teamManager';
import { ExtensionManager } from '../extensionSystem/src/extensionManager';
import { CodeReviewBot } from '../aiAssistants/src/codeReviewBot';
import { BugFixBot } from '../aiAssistants/src/bugFixBot';

describe('Integration: Version Control Workflow', () => {
  it('should simulate a full feature branch workflow', async () => {
    const repoPath = '/tmp/test-integration';
    const gitManager = new GitManager({ repoPath, authorName: 'Test User', authorEmail: 'test@example.com' });
    const branchManager = new BranchManager(repoPath);
    const commitHandler = new CommitHandler(repoPath);
    const diffGenerator = new DiffGenerator(repoPath);

    // Initialize repo
    await gitManager.init();

    // Create feature branch
    await branchManager.createAndCheckout('feature/new-feature');
    const currentBranch = await branchManager.getCurrentBranch();
    expect(currentBranch).toBe('main');

    // Stage and commit changes
    await gitManager.add(['src/feature.ts']);
    const commit = await commitHandler.commit({
      message: 'feat: add new feature',
      author: { name: 'Test User', email: 'test@example.com' },
    });
    expect(commit.hash).toBeDefined();
    expect(commit.message).toBe('feat: add new feature');

    // Generate diff
    const diffs = await diffGenerator.getDiff();
    expect(Array.isArray(diffs)).toBe(true);
  });
});

describe('Integration: Package Security Workflow', () => {
  it('should scan packages and check licenses', async () => {
    const projectPath = '/tmp/test-project';
    const npmManager = new NpmManager(projectPath);
    const scanner = new VulnerabilityScanner(projectPath);
    const licenseChecker = new LicenseChecker(projectPath);

    // Install packages (simulated)
    await npmManager.install(['express', 'lodash'], { dev: false });

    // Run security scan
    const scanResult = await scanner.scan('npm');
    expect(scanResult.scannedAt).toBeInstanceOf(Date);
    expect(scanResult.vulnerabilities).toEqual([]);

    // Check licenses
    const licenses = await licenseChecker.check();
    const violations = await licenseChecker.findViolations(licenses);
    expect(violations.denied).toEqual([]);

    // Generate report
    const report = await scanner.generateReport(scanResult);
    expect(report).toContain('Vulnerability Scan Report');
  });
});

describe('Integration: AI Completion with Rate Limiting and Caching', () => {
  it('should use cache to avoid duplicate API calls', async () => {
    const cache = new CompletionCache(60000, 500);
    const rateLimiter = new RateLimiter({ requestsPerMinute: 60 });
    const engine = new CompletionEngine({
      primaryProvider: 'openai',
      cacheEnabled: true,
    });
    engine.registerProvider('openai', new OpenAIProvider('test-key'));

    const request = {
      code: 'function hello() {',
      language: 'typescript',
      cursorPosition: { line: 1, column: 18 },
    };

    // Check rate limit
    const { allowed } = await rateLimiter.checkLimit();
    expect(allowed).toBe(true);

    // First completion (cache miss)
    const response1 = await engine.complete(request);
    cache.set(request, response1);
    rateLimiter.recordRequest();

    // Second completion (cache hit)
    const cached = cache.get(request);
    expect(cached).toEqual(response1);

    // Verify stats
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
  });
});

describe('Integration: Enterprise Audit and Compliance', () => {
  it('should log team actions and generate compliance report', async () => {
    const auditLogger = new AuditLogger();
    const teamManager = new TeamManager();
    const complianceReporter = new ComplianceReporter(auditLogger);

    // Create team and log audit events
    const team = await teamManager.create('Engineering', 'org1', 'admin1');
    await auditLogger.log({
      actorId: 'admin1',
      organizationId: 'org1',
      action: 'team.create',
      resourceType: 'team',
      resourceId: team.id,
      resourceName: team.name,
      status: 'success',
    });

    await auditLogger.log({
      actorId: 'admin1',
      organizationId: 'org1',
      action: 'member.invite',
      resourceType: 'team',
      resourceId: team.id,
      status: 'success',
      details: { email: 'new@example.com' },
    });

    // Query audit events
    const { events, total } = await auditLogger.query({ organizationId: 'org1' });
    expect(total).toBe(2);

    // Generate compliance report
    const report = await complianceReporter.generateReport('org1', 'SOC2');
    expect(report.framework).toBe('SOC2');
    expect(report.controls.length).toBeGreaterThan(0);
    expect(report.generatedAt).toBeInstanceOf(Date);
  });
});

describe('Integration: Billing and Subscription Lifecycle', () => {
  it('should manage subscription from signup to cancellation', async () => {
    const billingManager = new BillingManager();

    // Get available plans
    const plans = await billingManager.listPlans();
    const freePlan = plans.find(p => p.tier === 'free');
    expect(freePlan).toBeDefined();

    // Subscribe to free plan
    const subscription = await billingManager.subscribe('org-test', 'free');
    expect(subscription.status).toBe('active');

    // Upgrade to pro
    const upgraded = await billingManager.changePlan('org-test', 'pro');
    expect(upgraded?.planId).toBe('pro');

    // Cancel subscription
    await billingManager.cancelSubscription('org-test', { immediately: false });
    const sub = await billingManager.getSubscription('org-test');
    expect(sub?.cancelAtPeriodEnd).toBe(true);
  });
});

describe('Integration: Extension System Lifecycle', () => {
  it('should install and manage extension lifecycle', async () => {
    const manager = new ExtensionManager({ autoLoad: false });

    // Install extension
    const extension = await manager.install('my-publisher.my-extension');
    expect(extension.id).toBeDefined();

    // Activate extension
    await manager.activate(extension.id);
    const activeExtensions = await manager.listActive();
    expect(activeExtensions.some(e => e.id === extension.id)).toBe(true);

    // Deactivate extension
    await manager.deactivate(extension.id);
    const afterDeactivate = await manager.listActive();
    expect(afterDeactivate.some(e => e.id === extension.id)).toBe(false);
  });
});

describe('Integration: AI-Assisted Development Workflow', () => {
  it('should review code and suggest fixes', async () => {
    const reviewBot = new CodeReviewBot('test-key');
    const bugFixBot = new BugFixBot('test-key');

    const code = `
function divide(a, b) {
  return a / b;
}
    `.trim();

    // Review the code
    const review = await reviewBot.reviewFile('math.js', code, 'javascript');
    expect(review.summary).toBeDefined();
    expect(typeof review.overallScore).toBe('number');

    // Detect potential bugs
    const bugs = await bugFixBot.detectBugs(code, 'javascript', {
      errorMessage: 'Potential division by zero',
    });
    expect(Array.isArray(bugs)).toBe(true);

    // Fix if bugs found
    if (bugs.length > 0) {
      const fix = await bugFixBot.fix(code, bugs[0]);
      expect(fix.fixedCode).toBeDefined();
      expect(fix.explanation).toBeDefined();
    }
  });
});
