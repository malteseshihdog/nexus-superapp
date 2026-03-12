import type { CompletionRequest, CompletionResponse } from './openai.provider';

export class CodexProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'code-davinci-002') {
    this.apiKey = apiKey;
    this.model = model;
  }

  get name(): string {
    return 'codex';
  }

  async complete(request: CompletionRequest): Promise<CompletionResponse> {
    const start = Date.now();
    console.log(`Codex (${this.model}) generating completion for ${request.language}`);
    return {
      completions: [],
      provider: this.name,
      latencyMs: Date.now() - start,
    };
  }

  async fillInTheMiddle(prefix: string, suffix: string, language: string): Promise<string> {
    console.log(`Codex fill-in-the-middle for ${language}`);
    return '';
  }

  async editCode(code: string, instruction: string): Promise<string> {
    console.log(`Codex editing code: ${instruction}`);
    return code;
  }
}

export type { CompletionRequest, CompletionResponse };
