import { DebuggerManager } from '../advancedDebugging/src/debugger/debuggerManager';
import { BreakpointManager } from '../advancedDebugging/src/debugger/breakpointManager';
import { VariableInspector } from '../advancedDebugging/src/debugger/variableInspector';
import { CallStack } from '../advancedDebugging/src/debugger/callStack';
import { WatchExpressions } from '../advancedDebugging/src/debugger/watchExpressions';
import { CpuProfiler } from '../advancedDebugging/src/profiling/cpuProfiler';
import { MemoryProfiler } from '../advancedDebugging/src/profiling/memoryProfiler';
import { FlameGraph } from '../advancedDebugging/src/profiling/flameGraph';
import { RequestCapture } from '../advancedDebugging/src/networkInspector/requestCapture';
import { ResponseAnalysis } from '../advancedDebugging/src/networkInspector/responseAnalysis';
import { BundleAnalyzer } from '../performanceOptimization/src/bundleAnalyzer';
import { CodeOptimizer } from '../performanceOptimization/src/codeOptimizer';
import { CacheStrategy } from '../performanceOptimization/src/caching/cacheStrategy';
import { Compression } from '../performanceOptimization/src/compression';
import { LazyLoading } from '../performanceOptimization/src/lazyLoading';
import { TreeShaking } from '../performanceOptimization/src/treeshaking';
import { TeamManager } from '../enterpriseFeatures/src/teams/teamManager';
import { TeamPermissions } from '../enterpriseFeatures/src/teams/teamPermissions';
import { TeamInvitation } from '../enterpriseFeatures/src/teams/teamInvitation';
import { AuditLogger } from '../enterpriseFeatures/src/audit/auditLogger';
import { BillingManager } from '../enterpriseFeatures/src/billing/billingManager';
import { SubscriptionManager } from '../enterpriseFeatures/src/billing/subscriptionManager';
import { ExtensionManager } from '../extensionSystem/src/extensionManager';
import { ExtensionRegistry } from '../extensionSystem/src/extensionRegistry';
import { CodeReviewBot } from '../aiAssistants/src/codeReviewBot';
import { DocumentationBot } from '../aiAssistants/src/documentationBot';
import { RefactoringBot } from '../aiAssistants/src/refactoringBot';
import { BugFixBot } from '../aiAssistants/src/bugFixBot';

// ---- Advanced Debugging ----
describe('Advanced Debugging - DebuggerManager', () => {
  it('should start and stop a session', async () => {
    const manager = new DebuggerManager();
    const session = await manager.startSession({ language: 'typescript', program: 'app.ts' });
    expect(session.id).toBeDefined();
    expect(session.state).toBe('running');
    await manager.stopSession(session.id);
    const stopped = manager.getSession(session.id);
    expect(stopped?.state).toBe('stopped');
  });

  it('should list sessions', async () => {
    const manager = new DebuggerManager();
    await manager.startSession({ language: 'javascript', program: 'app.js' });
    expect(manager.listSessions()).toHaveLength(1);
  });
});

describe('Advanced Debugging - BreakpointManager', () => {
  it('should add and remove breakpoints', () => {
    const mgr = new BreakpointManager();
    const bp = mgr.add('app.ts', 10);
    expect(bp.enabled).toBe(true);
    expect(bp.type).toBe('line');
    const removed = mgr.remove(bp.id);
    expect(removed).toBe(true);
  });

  it('should add conditional breakpoint', () => {
    const mgr = new BreakpointManager();
    const bp = mgr.add('app.ts', 20, { condition: 'x > 5' });
    expect(bp.condition).toBe('x > 5');
    expect(bp.type).toBe('conditional');
  });

  it('should enable and disable breakpoints', () => {
    const mgr = new BreakpointManager();
    const bp = mgr.add('app.ts', 5);
    mgr.disable(bp.id);
    expect(mgr.getAll()[0].enabled).toBe(false);
    mgr.enable(bp.id);
    expect(mgr.getAll()[0].enabled).toBe(true);
  });

  it('should get breakpoints for file', () => {
    const mgr = new BreakpointManager();
    mgr.add('app.ts', 1);
    mgr.add('app.ts', 2);
    mgr.add('other.ts', 1);
    const appBps = mgr.getForFile('app.ts');
    expect(appBps).toHaveLength(2);
  });
});

describe('Advanced Debugging - WatchExpressions', () => {
  it('should add and remove watch expressions', () => {
    const watches = new WatchExpressions();
    const w = watches.add('x + y');
    expect(w.expression).toBe('x + y');
    expect(w.enabled).toBe(true);
    const removed = watches.remove(w.id);
    expect(removed).toBe(true);
  });

  it('should evaluate all watch expressions', async () => {
    const watches = new WatchExpressions();
    watches.add('myVar');
    await watches.evaluateAll(async (expr) => ({ result: '42', type: 'number' }));
    expect(watches.getAll()[0].result).toBe('42');
  });
});

describe('Advanced Debugging - CpuProfiler', () => {
  it('should start and stop profiling', async () => {
    const profiler = new CpuProfiler();
    const id = await profiler.start();
    expect(profiler.isProfilerRunning()).toBe(true);
    const profile = await profiler.stop(id);
    expect(profile).not.toBeNull();
    expect(profile?.endTime).toBeInstanceOf(Date);
    expect(profiler.isProfilerRunning()).toBe(false);
  });
});

describe('Advanced Debugging - MemoryProfiler', () => {
  it('should take memory snapshot', async () => {
    const profiler = new MemoryProfiler();
    const snapshot = await profiler.takeSnapshot();
    expect(snapshot.id).toBeDefined();
    expect(snapshot.timestamp).toBeInstanceOf(Date);
  });

  it('should list snapshots', async () => {
    const profiler = new MemoryProfiler();
    await profiler.takeSnapshot();
    await profiler.takeSnapshot();
    expect(profiler.listSnapshots()).toHaveLength(2);
  });
});

describe('Advanced Debugging - RequestCapture', () => {
  it('should capture requests when active', () => {
    const capture = new RequestCapture();
    capture.startCapture();
    const id = capture.capture({ method: 'GET', url: 'https://api.example.com', headers: {} });
    expect(id).toBeTruthy();
    expect(capture.listRequests()).toHaveLength(1);
  });

  it('should filter requests by method', () => {
    const capture = new RequestCapture();
    capture.startCapture();
    capture.capture({ method: 'GET', url: '/api/1', headers: {} });
    capture.capture({ method: 'POST', url: '/api/2', headers: {} });
    expect(capture.listRequests({ method: 'GET' })).toHaveLength(1);
  });

  it('should not capture when stopped', () => {
    const capture = new RequestCapture();
    capture.startCapture();
    capture.stopCapture();
    capture.capture({ method: 'GET', url: '/api', headers: {} });
    expect(capture.listRequests()).toHaveLength(0);
  });
});

// ---- Performance Optimization ----
describe('Performance Optimization - BundleAnalyzer', () => {
  it('should analyze bundle and return stats', async () => {
    const analyzer = new BundleAnalyzer();
    const stats = await analyzer.analyze();
    expect(stats.totalSize).toBe(0);
    expect(Array.isArray(stats.chunks)).toBe(true);
  });

  it('should generate report', async () => {
    const analyzer = new BundleAnalyzer();
    await analyzer.analyze();
    const report = await analyzer.generateReport();
    expect(report).toContain('Bundle Analysis Report');
  });
});

describe('Performance Optimization - CacheStrategy', () => {
  it('should store and retrieve items', () => {
    const cache = new CacheStrategy({ strategy: 'lru', maxSize: 100 });
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('should respect TTL', async () => {
    const cache = new CacheStrategy({ strategy: 'ttl', ttlMs: 10 });
    cache.set('key1', 'value1');
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(cache.get('key1')).toBeNull();
  });

  it('should evict on LRU when full', () => {
    const cache = new CacheStrategy({ strategy: 'lru', maxSize: 2 });
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    cache.get('k1'); // access k1 to make k2 least recently used
    cache.set('k3', 'v3'); // should evict k2
    expect(cache.has('k2')).toBe(false);
    expect(cache.has('k1')).toBe(true);
  });

  it('should track stats', () => {
    const cache = new CacheStrategy({ strategy: 'lru', maxSize: 100 });
    cache.set('k', 'v');
    cache.get('k'); // hit
    cache.get('missing'); // miss (null)
    const stats = cache.getStats();
    expect(stats.size).toBe(1);
  });
});

describe('Performance Optimization - Compression', () => {
  it('should compress data', async () => {
    const compression = new Compression();
    const result = await compression.compress('Hello World', 'gzip');
    expect(result.algorithm).toBe('gzip');
    expect(result.originalSize).toBe(11);
  });

  it('should detect compressible content types', () => {
    const compression = new Compression();
    expect(compression.shouldCompress('text/html', 2048)).toBe(true);
    expect(compression.shouldCompress('image/jpeg', 2048)).toBe(false);
    expect(compression.shouldCompress('text/html', 100)).toBe(false); // below threshold
  });
});

describe('Performance Optimization - LazyLoading', () => {
  it('should register and load targets', async () => {
    const lazy = new LazyLoading();
    lazy.register('myModule', 'module', async () => ({ default: 'loaded' }));
    await lazy.load('myModule');
    expect(lazy.getTarget('myModule')?.loaded).toBe(true);
    expect(lazy.getLoadedCount()).toBe(1);
  });

  it('should throw for unregistered target', async () => {
    const lazy = new LazyLoading();
    await expect(lazy.load('unknown')).rejects.toThrow();
  });
});

// ---- Enterprise Features ----
describe('Enterprise Features - Teams', () => {
  it('should create a team', async () => {
    const manager = new TeamManager();
    const team = await manager.create('Engineering', 'org1', 'user1');
    expect(team.name).toBe('Engineering');
    expect(team.members).toHaveLength(1);
    expect(team.members[0].role).toBe('owner');
  });

  it('should add and remove members', async () => {
    const manager = new TeamManager();
    const team = await manager.create('Dev', 'org1', 'owner1');
    await manager.addMember(team.id, { userId: 'user2', email: 'u2@test.com', displayName: 'User 2', role: 'member' });
    const members = await manager.getMembers(team.id);
    expect(members).toHaveLength(2);
    await manager.removeMember(team.id, 'user2');
    expect((await manager.getMembers(team.id))).toHaveLength(1);
  });

  it('should check permissions', () => {
    const permissions = new TeamPermissions();
    expect(permissions.can('owner', 'project', 'delete')).toBe(true);
    expect(permissions.can('viewer', 'project', 'delete')).toBe(false);
    expect(permissions.can('member', 'project', 'read')).toBe(true);
    expect(permissions.can('guest', 'billing', 'read')).toBe(false);
  });

  it('should create and accept invitation', async () => {
    const invitations = new TeamInvitation();
    const invite = await invitations.create('team1', 'user@test.com', 'member', 'owner1');
    expect(invite.status).toBe('pending');
    const accepted = await invitations.accept(invite.token, 'user1');
    expect(accepted?.status).toBe('accepted');
  });
});

describe('Enterprise Features - Audit', () => {
  it('should log and query audit events', async () => {
    const logger = new AuditLogger();
    await logger.log({
      actorId: 'user1',
      organizationId: 'org1',
      action: 'login',
      resourceType: 'session',
      status: 'success',
    });
    const { events, total } = await logger.query({ organizationId: 'org1' });
    expect(total).toBe(1);
    expect(events[0].action).toBe('login');
  });

  it('should export audit events as CSV', async () => {
    const logger = new AuditLogger();
    await logger.log({ actorId: 'u1', organizationId: 'org1', action: 'read', resourceType: 'project', status: 'success' });
    const csv = await logger.exportCSV('org1', new Date(0), new Date());
    expect(csv).toContain('id,timestamp');
    expect(csv).toContain('read');
  });
});

describe('Enterprise Features - Billing', () => {
  it('should list available plans', async () => {
    const manager = new BillingManager();
    const plans = await manager.listPlans();
    expect(plans.length).toBeGreaterThan(0);
    const planNames = plans.map(p => p.name);
    expect(planNames).toContain('Free');
    expect(planNames).toContain('Pro');
  });

  it('should create a subscription', async () => {
    const manager = new BillingManager();
    const subscription = await manager.subscribe('org1', 'pro');
    expect(subscription.planId).toBe('pro');
    expect(subscription.status).toBe('active');
  });

  it('should handle subscription lifecycle', async () => {
    const subManager = new SubscriptionManager();
    const sub = {
      id: 'sub1',
      organizationId: 'org1',
      planId: 'pro',
      status: 'active' as const,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
      cancelAtPeriodEnd: false,
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await subManager.save(sub);
    const retrieved = await subManager.get('org1');
    expect(retrieved?.planId).toBe('pro');
    await subManager.cancel('org1');
    const events = subManager.getEventHistory('org1');
    expect(events.some(e => e.type === 'canceled')).toBe(true);
  });
});

// ---- Extension System ----
describe('Extension System', () => {
  it('should register and retrieve extension', async () => {
    const registry = new ExtensionRegistry();
    await registry.register({
      id: 'test.theme',
      name: 'test-theme',
      displayName: 'Test Theme',
      version: '1.0.0',
      categories: ['theme'],
      state: 'installed',
    });
    const extension = await registry.get('test.theme');
    expect(extension?.name).toBe('test-theme');
  });

  it('should search extensions', async () => {
    const registry = new ExtensionRegistry();
    await registry.register({
      id: 'dracula.theme',
      name: 'dracula-theme',
      displayName: 'Dracula Theme',
      description: 'Dark theme for code editors',
      version: '2.0.0',
      categories: ['theme'],
      keywords: ['dark', 'dracula'],
      state: 'installed',
    });
    const results = await registry.search('dracula');
    expect(results).toHaveLength(1);
    const empty = await registry.search('nonexistent');
    expect(empty).toHaveLength(0);
  });
});

// ---- AI Assistants ----
describe('AI Assistants', () => {
  it('should review code', async () => {
    const bot = new CodeReviewBot('test-key');
    const result = await bot.reviewFile('app.ts', 'const x = 1;', 'typescript');
    expect(result.approved).toBe(true);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(Array.isArray(result.comments)).toBe(true);
  });

  it('should generate README', async () => {
    const bot = new DocumentationBot('test-key');
    const readme = await bot.generateReadme({
      name: 'my-project',
      description: 'A test project',
      language: 'typescript',
    });
    expect(readme).toContain('# my-project');
    expect(readme).toContain('A test project');
  });

  it('should generate API documentation', async () => {
    const bot = new DocumentationBot('test-key');
    const doc = await bot.generateAPIDoc([
      { method: 'GET', path: '/api/users', description: 'List users' },
      { method: 'POST', path: '/api/users', description: 'Create user' },
    ]);
    expect(doc).toContain('/api/users');
    expect(doc).toContain('GET');
  });

  it('should analyze refactoring opportunities', async () => {
    const bot = new RefactoringBot('test-key');
    const opportunities = await bot.analyze('const x = 1; const y = 1;', 'typescript');
    expect(Array.isArray(opportunities)).toBe(true);
  });

  it('should detect bugs', async () => {
    const bot = new BugFixBot('test-key');
    const bugs = await bot.detectBugs('undefined.property', 'javascript');
    expect(Array.isArray(bugs)).toBe(true);
  });

  it('should fix bug from error', async () => {
    const bot = new BugFixBot('test-key');
    const fix = await bot.fixFromError('const x = undefined; x.prop;', 'javascript', {
      message: "Cannot read property 'prop' of undefined",
    });
    expect(fix).not.toBeNull();
    expect(fix?.bug.type).toBe('runtime');
  });
});
