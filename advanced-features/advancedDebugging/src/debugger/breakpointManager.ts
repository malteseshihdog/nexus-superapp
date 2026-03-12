export type BreakpointType = 'line' | 'conditional' | 'logpoint' | 'function' | 'exception';

export interface Breakpoint {
  id: string;
  type: BreakpointType;
  filePath: string;
  line: number;
  column?: number;
  condition?: string;
  logMessage?: string;
  hitCount?: number;
  hitCondition?: string;
  enabled: boolean;
  verified: boolean;
}

export class BreakpointManager {
  private breakpoints: Map<string, Breakpoint> = new Map();

  add(filePath: string, line: number, options?: {
    type?: BreakpointType;
    condition?: string;
    logMessage?: string;
    hitCondition?: string;
  }): Breakpoint {
    const defaultType: BreakpointType = options?.condition
      ? 'conditional'
      : options?.logMessage
        ? 'logpoint'
        : 'line';
    const bp: Breakpoint = {
      id: Math.random().toString(36).substring(2, 9),
      type: options?.type ?? defaultType,
      filePath,
      line,
      condition: options?.condition,
      logMessage: options?.logMessage,
      hitCondition: options?.hitCondition,
      hitCount: 0,
      enabled: true,
      verified: false,
    };
    this.breakpoints.set(bp.id, bp);
    console.log(`Breakpoint added: ${filePath}:${line} (${bp.type})`);
    return bp;
  }

  remove(id: string): boolean {
    const existed = this.breakpoints.has(id);
    this.breakpoints.delete(id);
    return existed;
  }

  enable(id: string): void {
    const bp = this.breakpoints.get(id);
    if (bp) bp.enabled = true;
  }

  disable(id: string): void {
    const bp = this.breakpoints.get(id);
    if (bp) bp.enabled = false;
  }

  toggle(id: string): void {
    const bp = this.breakpoints.get(id);
    if (bp) bp.enabled = !bp.enabled;
  }

  updateCondition(id: string, condition: string): void {
    const bp = this.breakpoints.get(id);
    if (bp) {
      bp.condition = condition;
      bp.type = 'conditional';
    }
  }

  setLogMessage(id: string, message: string): void {
    const bp = this.breakpoints.get(id);
    if (bp) {
      bp.logMessage = message;
      bp.type = 'logpoint';
    }
  }

  getForFile(filePath: string): Breakpoint[] {
    return Array.from(this.breakpoints.values()).filter(bp => bp.filePath === filePath);
  }

  getAll(): Breakpoint[] {
    return Array.from(this.breakpoints.values());
  }

  clearAll(): void {
    this.breakpoints.clear();
  }

  incrementHitCount(id: string): void {
    const bp = this.breakpoints.get(id);
    if (bp) bp.hitCount = (bp.hitCount ?? 0) + 1;
  }
}
