export interface CodeContext {
  filePath: string;
  language: string;
  fileContent: string;
  cursorOffset: number;
  prefix: string;
  suffix: string;
  openFiles?: { path: string; content: string }[];
  imports?: string[];
  symbols?: SymbolInfo[];
  recentEdits?: EditRecord[];
  projectStructure?: string[];
}

export interface SymbolInfo {
  name: string;
  kind: 'class' | 'function' | 'variable' | 'type' | 'interface' | 'enum' | 'module';
  type?: string;
  documentation?: string;
  location: { file: string; line: number; column: number };
}

export interface EditRecord {
  filePath: string;
  timestamp: Date;
  changes: { offset: number; added: string; removed: string }[];
}

export class ContextBuilder {
  private maxContextLength: number;

  constructor(maxContextLength = 4096) {
    this.maxContextLength = maxContextLength;
  }

  async buildContext(filePath: string, fileContent: string, cursorOffset: number): Promise<CodeContext> {
    const language = this.detectLanguage(filePath);
    const prefix = fileContent.substring(0, cursorOffset);
    const suffix = fileContent.substring(cursorOffset);

    return {
      filePath,
      language,
      fileContent,
      cursorOffset,
      prefix: this.truncateContext(prefix, this.maxContextLength / 2),
      suffix: this.truncateContext(suffix, this.maxContextLength / 4),
      imports: this.extractImports(fileContent, language),
    };
  }

  async enrichWithProjectContext(context: CodeContext, openFiles: { path: string; content: string }[]): Promise<CodeContext> {
    return {
      ...context,
      openFiles: openFiles.slice(0, 5),
    };
  }

  detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    const languageMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
      py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
      cs: 'csharp', cpp: 'cpp', c: 'c', swift: 'swift', kt: 'kotlin',
      php: 'php', html: 'html', css: 'css', scss: 'scss', json: 'json',
      yaml: 'yaml', yml: 'yaml', md: 'markdown', sh: 'bash', sql: 'sql',
    };
    return languageMap[ext] ?? 'plaintext';
  }

  private extractImports(content: string, language: string): string[] {
    const importPatterns: Record<string, RegExp> = {
      typescript: /^import\s+.+from\s+['"].+['"]/gm,
      javascript: /^import\s+.+from\s+['"].+['"]/gm,
      python: /^(?:import|from)\s+\S+/gm,
    };
    const pattern = importPatterns[language];
    if (!pattern) return [];
    return (content.match(pattern) ?? []).slice(0, 20);
  }

  private truncateContext(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(text.length - maxLength);
  }
}
