export interface WatchExpression {
  id: string;
  expression: string;
  result?: string;
  type?: string;
  evaluateName?: string;
  error?: string;
  enabled: boolean;
}

export class WatchExpressions {
  private expressions: Map<string, WatchExpression> = new Map();

  add(expression: string): WatchExpression {
    const watch: WatchExpression = {
      id: Math.random().toString(36).substring(2, 9),
      expression,
      enabled: true,
    };
    this.expressions.set(watch.id, watch);
    return watch;
  }

  remove(id: string): boolean {
    return this.expressions.delete(id);
  }

  enable(id: string): void {
    const watch = this.expressions.get(id);
    if (watch) watch.enabled = true;
  }

  disable(id: string): void {
    const watch = this.expressions.get(id);
    if (watch) watch.enabled = false;
  }

  updateExpression(id: string, expression: string): void {
    const watch = this.expressions.get(id);
    if (watch) {
      watch.expression = expression;
      watch.result = undefined;
      watch.error = undefined;
    }
  }

  updateResult(id: string, result: string, type?: string): void {
    const watch = this.expressions.get(id);
    if (watch) {
      watch.result = result;
      watch.type = type;
      watch.error = undefined;
    }
  }

  updateError(id: string, error: string): void {
    const watch = this.expressions.get(id);
    if (watch) {
      watch.error = error;
      watch.result = undefined;
    }
  }

  async evaluateAll(evaluator: (expression: string) => Promise<{ result: string; type?: string } | null>): Promise<void> {
    for (const watch of this.expressions.values()) {
      if (!watch.enabled) continue;
      try {
        const result = await evaluator(watch.expression);
        if (result) {
          this.updateResult(watch.id, result.result, result.type);
        }
      } catch (error) {
        this.updateError(watch.id, error instanceof Error ? error.message : String(error));
      }
    }
  }

  getAll(): WatchExpression[] {
    return Array.from(this.expressions.values());
  }

  getEnabled(): WatchExpression[] {
    return this.getAll().filter(w => w.enabled);
  }

  clearAll(): void {
    this.expressions.clear();
  }
}
