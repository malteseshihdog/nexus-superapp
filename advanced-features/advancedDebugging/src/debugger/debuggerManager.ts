import { BreakpointManager } from './breakpointManager';
import { VariableInspector } from './variableInspector';
import { CallStack } from './callStack';
import { WatchExpressions } from './watchExpressions';

export type DebugState = 'idle' | 'running' | 'paused' | 'stopped' | 'disconnected';

export interface DebugSession {
  id: string;
  language: string;
  processId?: number;
  state: DebugState;
  startedAt: Date;
  stoppedAt?: Date;
}

export interface DebugConfig {
  language: string;
  program: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  stopOnEntry?: boolean;
  console?: 'integratedTerminal' | 'externalTerminal' | 'internalConsole';
}

export class DebuggerManager {
  private sessions: Map<string, DebugSession> = new Map();
  breakpoints: BreakpointManager;
  variables: VariableInspector;
  callStack: CallStack;
  watchExpressions: WatchExpressions;

  constructor() {
    this.breakpoints = new BreakpointManager();
    this.variables = new VariableInspector();
    this.callStack = new CallStack();
    this.watchExpressions = new WatchExpressions();
  }

  async startSession(config: DebugConfig): Promise<DebugSession> {
    const session: DebugSession = {
      id: Math.random().toString(36).substring(2, 9),
      language: config.language,
      state: 'running',
      startedAt: new Date(),
    };
    this.sessions.set(session.id, session);
    console.log(`Debug session started: ${session.id} for ${config.program}`);
    return session;
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = 'stopped';
      session.stoppedAt = new Date();
      console.log(`Debug session stopped: ${sessionId}`);
    }
  }

  async pauseSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = 'paused';
      console.log(`Session paused: ${sessionId}`);
    }
  }

  async continueSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.state = 'running';
      console.log(`Session continued: ${sessionId}`);
    }
  }

  async stepOver(sessionId: string): Promise<void> {
    console.log(`Step over in session: ${sessionId}`);
  }

  async stepInto(sessionId: string): Promise<void> {
    console.log(`Step into in session: ${sessionId}`);
  }

  async stepOut(sessionId: string): Promise<void> {
    console.log(`Step out in session: ${sessionId}`);
  }

  getSession(sessionId: string): DebugSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(): DebugSession[] {
    return Array.from(this.sessions.values());
  }
}
