import { OpenAIProvider } from '../aiCodeCompletion/src/providers/openai.provider';
import { ClaudeProvider } from '../aiCodeCompletion/src/providers/claude.provider';
import { CodexProvider } from '../aiCodeCompletion/src/providers/codex.provider';
import { LocalModelProvider } from '../aiCodeCompletion/src/providers/localModel.provider';
import { CompletionEngine } from '../aiCodeCompletion/src/completionEngine';
import { ContextBuilder } from '../aiCodeCompletion/src/contextBuilder';
import { PromptEngineer } from '../aiCodeCompletion/src/promptEngineer';
import { CompletionCache } from '../aiCodeCompletion/src/caching';
import { RateLimiter } from '../aiCodeCompletion/src/rateLimit';

const sampleRequest = {
  code: 'function add(a: number, b: number) { return a + b; }',
  language: 'typescript',
  cursorPosition: { line: 1, column: 10 },
};

describe('AI Code Completion - Providers', () => {
  it('should initialize OpenAIProvider', () => {
    const provider = new OpenAIProvider('test-key');
    expect(provider.name).toBe('openai');
  });

  it('should return completion response', async () => {
    const provider = new OpenAIProvider('test-key');
    const response = await provider.complete(sampleRequest);
    expect(response.provider).toBe('openai');
    expect(response.latencyMs).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(response.completions)).toBe(true);
  });

  it('should initialize ClaudeProvider', () => {
    const provider = new ClaudeProvider('test-key');
    expect(provider.name).toBe('claude');
  });

  it('should initialize CodexProvider', () => {
    const provider = new CodexProvider('test-key');
    expect(provider.name).toBe('codex');
  });

  it('should initialize LocalModelProvider and not be loaded initially', () => {
    const provider = new LocalModelProvider({ modelPath: '/models/codegen', modelName: 'codegen-2b' });
    expect(provider.isLoaded()).toBe(false);
  });

  it('should load model and return response', async () => {
    const provider = new LocalModelProvider({ modelPath: '/models/codegen', modelName: 'codegen-2b' });
    const response = await provider.complete(sampleRequest);
    expect(provider.isLoaded()).toBe(true);
    expect(response.provider).toBe('local:codegen-2b');
  });
});

describe('AI Code Completion - Engine', () => {
  it('should register providers and list them', () => {
    const engine = new CompletionEngine({ primaryProvider: 'openai' });
    engine.registerProvider('openai', new OpenAIProvider('key'));
    engine.registerProvider('claude', new ClaudeProvider('key'));
    expect(engine.listProviders()).toContain('openai');
    expect(engine.listProviders()).toContain('claude');
  });

  it('should throw if primary provider not registered', async () => {
    const engine = new CompletionEngine({ primaryProvider: 'openai' });
    await expect(engine.complete(sampleRequest)).rejects.toThrow();
  });

  it('should complete using primary provider', async () => {
    const engine = new CompletionEngine({ primaryProvider: 'openai' });
    engine.registerProvider('openai', new OpenAIProvider('key'));
    const response = await engine.complete(sampleRequest);
    expect(response.provider).toBe('openai');
  });
});

describe('AI Code Completion - ContextBuilder', () => {
  it('should build context from file content', async () => {
    const builder = new ContextBuilder();
    const context = await builder.buildContext('test.ts', 'const x = 1;', 8);
    expect(context.language).toBe('typescript');
    expect(context.prefix).toBe('const x ');
    expect(context.suffix).toBe('= 1;');
  });

  it('should detect language correctly', () => {
    const builder = new ContextBuilder();
    expect(builder.detectLanguage('app.ts')).toBe('typescript');
    expect(builder.detectLanguage('app.py')).toBe('python');
    expect(builder.detectLanguage('app.rb')).toBe('ruby');
    expect(builder.detectLanguage('app.rs')).toBe('rust');
    expect(builder.detectLanguage('app.go')).toBe('go');
    expect(builder.detectLanguage('unknown')).toBe('plaintext');
  });
});

describe('AI Code Completion - PromptEngineer', () => {
  const engineer = new PromptEngineer();
  const context = {
    filePath: 'test.ts',
    language: 'typescript',
    fileContent: 'const x = 1;',
    cursorOffset: 5,
    prefix: 'const',
    suffix: ' x = 1;',
  };

  it('should build completion prompt', () => {
    const prompt = engineer.buildPrompt(context, 'completion');
    expect(prompt.system).toBeDefined();
    expect(prompt.user).toContain('const');
  });

  it('should build function generation prompt', () => {
    const prompt = engineer.buildFunctionPrompt('sum(a: number, b: number): number', 'Returns the sum of two numbers', 'typescript');
    expect(prompt.system).toBeDefined();
    expect(prompt.user).toContain('sum');
  });

  it('should get template for each type', () => {
    const types = ['completion', 'function_generation', 'documentation', 'bug_fix', 'refactor', 'security_review', 'performance'] as const;
    for (const type of types) {
      const template = engineer.getTemplate(type);
      expect(template.system).toBeDefined();
      expect(template.maxTokens).toBeGreaterThan(0);
    }
  });
});

describe('AI Code Completion - Cache', () => {
  it('should cache and retrieve completions', () => {
    const cache = new CompletionCache(5000, 100);
    const response = { completions: [], provider: 'openai', latencyMs: 10 };
    cache.set(sampleRequest, response);
    const cached = cache.get(sampleRequest);
    expect(cached).toEqual(response);
  });

  it('should return null for cache miss', () => {
    const cache = new CompletionCache(5000, 100);
    const result = cache.get(sampleRequest);
    expect(result).toBeNull();
  });

  it('should track cache stats', () => {
    const cache = new CompletionCache(5000, 100);
    const response = { completions: [], provider: 'openai', latencyMs: 10 };
    cache.get(sampleRequest); // miss
    cache.set(sampleRequest, response);
    cache.get(sampleRequest); // hit
    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it('should clear cache', () => {
    const cache = new CompletionCache(5000, 100);
    const response = { completions: [], provider: 'openai', latencyMs: 10 };
    cache.set(sampleRequest, response);
    cache.clear();
    expect(cache.get(sampleRequest)).toBeNull();
  });
});

describe('AI Code Completion - RateLimiter', () => {
  it('should allow requests within limit', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 100 });
    const { allowed } = await limiter.checkLimit();
    expect(allowed).toBe(true);
  });

  it('should record requests and show stats', () => {
    const limiter = new RateLimiter({ requestsPerMinute: 100 });
    limiter.recordRequest(100);
    limiter.recordRequest(200);
    const stats = limiter.getStats();
    expect(stats.requestsLastMinute).toBe(2);
    expect(stats.tokensLastMinute).toBe(300);
  });

  it('should deny requests over limit', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 2 });
    limiter.recordRequest();
    limiter.recordRequest();
    limiter.recordRequest();
    const { allowed } = await limiter.checkLimit();
    expect(allowed).toBe(false);
  });
});
