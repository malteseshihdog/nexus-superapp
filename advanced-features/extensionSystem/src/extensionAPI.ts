export type ExtensionCategory = 'theme' | 'language' | 'tool' | 'debugger' | 'formatter' | 'linter' | 'snippet' | 'keybinding' | 'other';

export interface ExtensionContribution {
  themes?: ThemeContribution[];
  languages?: LanguageContribution[];
  commands?: CommandContribution[];
  menus?: MenuContribution[];
  keybindings?: KeybindingContribution[];
  snippets?: SnippetContribution[];
  debuggers?: DebuggerContribution[];
}

export interface ThemeContribution {
  id: string;
  label: string;
  uiTheme: 'vs' | 'vs-dark' | 'hc-black';
  path: string;
}

export interface LanguageContribution {
  id: string;
  aliases?: string[];
  extensions?: string[];
  mimetypes?: string[];
  configuration?: string;
}

export interface CommandContribution {
  command: string;
  title: string;
  category?: string;
  icon?: string;
}

export interface MenuContribution {
  menu: string;
  command: string;
  group?: string;
  when?: string;
}

export interface KeybindingContribution {
  command: string;
  key: string;
  when?: string;
  mac?: string;
  win?: string;
  linux?: string;
}

export interface SnippetContribution {
  language: string;
  path: string;
}

export interface DebuggerContribution {
  type: string;
  label: string;
  languages?: string[];
  configurationAttributes?: Record<string, unknown>;
}

export interface ExtensionAPI {
  registerCommand(command: string, handler: (...args: unknown[]) => unknown): void;
  registerProvider<T>(type: string, provider: T): void;
  onDidChangeActiveEditor(callback: (editor: unknown) => void): void;
  onDidChangeTextDocument(callback: (event: unknown) => void): void;
  showMessage(type: 'info' | 'warning' | 'error', message: string): void;
  showInputBox(options?: { prompt?: string; placeholder?: string; value?: string }): Promise<string | undefined>;
  showQuickPick(items: string[], options?: { placeHolder?: string }): Promise<string | undefined>;
  getConfiguration(section?: string): Record<string, unknown>;
  setContext(key: string, value: unknown): void;
  getWorkspaceFolders(): string[];
}

export class ExtensionAPIImpl implements ExtensionAPI {
  private commands: Map<string, (...args: unknown[]) => unknown> = new Map();
  private providers: Map<string, unknown> = new Map();
  private eventListeners: Map<string, ((...args: unknown[]) => void)[]> = new Map();
  private context: Map<string, unknown> = new Map();

  registerCommand(command: string, handler: (...args: unknown[]) => unknown): void {
    this.commands.set(command, handler);
    console.log(`Command registered: ${command}`);
  }

  registerProvider<T>(type: string, provider: T): void {
    this.providers.set(type, provider);
    console.log(`Provider registered: ${type}`);
  }

  onDidChangeActiveEditor(callback: (editor: unknown) => void): void {
    this.addListener('activeEditor', callback);
  }

  onDidChangeTextDocument(callback: (event: unknown) => void): void {
    this.addListener('textDocument', callback);
  }

  showMessage(type: 'info' | 'warning' | 'error', message: string): void {
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  async showInputBox(options?: { prompt?: string; placeholder?: string; value?: string }): Promise<string | undefined> {
    console.log('Show input box:', options);
    return undefined;
  }

  async showQuickPick(items: string[], options?: { placeHolder?: string }): Promise<string | undefined> {
    console.log('Show quick pick:', items.length, 'items', options);
    return undefined;
  }

  getConfiguration(section?: string): Record<string, unknown> {
    return {};
  }

  setContext(key: string, value: unknown): void {
    this.context.set(key, value);
  }

  getWorkspaceFolders(): string[] {
    return [];
  }

  executeCommand(command: string, ...args: unknown[]): unknown {
    const handler = this.commands.get(command);
    if (!handler) throw new Error(`Command not found: ${command}`);
    return handler(...args);
  }

  private addListener(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this.eventListeners.get(event) ?? [];
    listeners.push(listener);
    this.eventListeners.set(event, listeners);
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.eventListeners.get(event) ?? [];
    for (const listener of listeners) {
      try { listener(...args); } catch (e) { console.error(`Event listener error for ${event}:`, e); }
    }
  }
}
