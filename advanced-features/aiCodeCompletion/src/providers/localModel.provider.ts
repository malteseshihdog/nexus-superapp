import type { CompletionRequest, CompletionResponse } from './openai.provider';

export interface LocalModelConfig {
  modelPath: string;
  modelName: string;
  contextLength?: number;
  device?: 'cpu' | 'cuda' | 'mps';
  quantization?: '4bit' | '8bit' | 'none';
}

export class LocalModelProvider {
  private config: LocalModelConfig;
  private loaded = false;

  constructor(config: LocalModelConfig) {
    this.config = config;
  }

  get name(): string {
    return `local:${this.config.modelName}`;
  }

  async loadModel(): Promise<void> {
    console.log(`Loading model ${this.config.modelName} from ${this.config.modelPath}`);
    this.loaded = true;
  }

  async unloadModel(): Promise<void> {
    console.log(`Unloading model ${this.config.modelName}`);
    this.loaded = false;
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    if (!this.loaded) {
      await this.loadModel();
    }
    const start = Date.now();
    console.log(`Local model (${this.config.modelName}) generating completion for ${request.language}`);
    return {
      completions: [],
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  getModelInfo(): LocalModelConfig {
    return this.config;
  }
}

export type { CompletionRequest, CompletionResponse };
