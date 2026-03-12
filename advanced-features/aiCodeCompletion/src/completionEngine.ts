import type { CompletionRequest, CompletionResponse } from './providers/openai.provider';
import { OpenAIProvider } from './providers/openai.provider';
import { ClaudeProvider } from './providers/claude.provider';
import { CodexProvider } from './providers/codex.provider';
import { LocalModelProvider } from './providers/localModel.provider';

type Provider = OpenAIProvider | ClaudeProvider | CodexProvider | LocalModelProvider;

export interface EngineConfig {
  primaryProvider: 'openai' | 'claude' | 'codex' | 'local';
  fallbackProvider?: 'openai' | 'claude' | 'codex' | 'local';
  cacheEnabled?: boolean;
  maxLatencyMs?: number;
  minConfidence?: number;
}

export class CompletionEngine {
  private providers: Map<string, Provider> = new Map();
  private config: EngineConfig;

  constructor(config: EngineConfig) {
    this.config = config;
  }

  registerProvider(name: string, provider: Provider): void {
    this.providers.set(name, provider);
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const primaryProvider = this.providers.get(this.config.primaryProvider);
    if (!primaryProvider) {
      throw new Error(`Provider "${this.config.primaryProvider}" is not registered`);
    }

    try {
      const response = await primaryProvider.complete(request);
      if (response.completions.length > 0) {
        return response;
      }

      if (this.config.fallbackProvider) {
        const fallback = this.providers.get(this.config.fallbackProvider);
        if (fallback) {
          console.log(`Primary provider returned no completions, using fallback: ${this.config.fallbackProvider}`);
          return fallback.complete(request);
        }
      }

      return response;
    } catch (error) {
      console.error(`Primary provider failed:`, error);
      if (this.config.fallbackProvider) {
        const fallback = this.providers.get(this.config.fallbackProvider);
        if (fallback) {
          return fallback.complete(request);
        }
      }
      throw error;
    }
  }

  async completeWithAllProviders(request: CompletionRequest): Promise<CompletionResponse[]> {
    const promises = Array.from(this.providers.values()).map(p => p.complete(request).catch(() => null));
    const results = await Promise.all(promises);
    return results.filter((r): r is CompletionResponse => r !== null);
  }

  getConfig(): EngineConfig {
    return this.config;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
