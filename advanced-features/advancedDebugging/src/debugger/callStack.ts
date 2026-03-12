export interface StackFrame {
  id: number;
  name: string;
  source?: { path: string; name: string };
  line: number;
  column: number;
  moduleId?: string;
  presentationHint?: 'normal' | 'label' | 'subtle';
}

export interface Thread {
  id: number;
  name: string;
  state: 'running' | 'paused' | 'stopped';
}

export class CallStack {
  private frames: Map<string, StackFrame[]> = new Map();
  private threads: Map<string, Thread[]> = new Map();
  private selectedFrameId: Map<string, number> = new Map();

  async getFrames(sessionId: string, threadId: number): Promise<StackFrame[]> {
    const key = `${sessionId}:${threadId}`;
    return this.frames.get(key) ?? [];
  }

  async getThreads(sessionId: string): Promise<Thread[]> {
    return this.threads.get(sessionId) ?? [];
  }

  selectFrame(sessionId: string, frameId: number): void {
    this.selectedFrameId.set(sessionId, frameId);
    console.log(`Selected frame ${frameId} in session ${sessionId}`);
  }

  getSelectedFrame(sessionId: string): number | undefined {
    return this.selectedFrameId.get(sessionId);
  }

  updateFrames(sessionId: string, threadId: number, frames: StackFrame[]): void {
    const key = `${sessionId}:${threadId}`;
    this.frames.set(key, frames);
  }

  updateThreads(sessionId: string, threads: Thread[]): void {
    this.threads.set(sessionId, threads);
  }

  clearSession(sessionId: string): void {
    for (const key of this.frames.keys()) {
      if (key.startsWith(`${sessionId}:`)) {
        this.frames.delete(key);
      }
    }
    this.threads.delete(sessionId);
    this.selectedFrameId.delete(sessionId);
  }

  formatStackTrace(frames: StackFrame[]): string {
    return frames.map((f, i) =>
      `  #${i} ${f.name} at ${f.source?.path ?? 'unknown'}:${f.line}:${f.column}`
    ).join('\n');
  }
}
