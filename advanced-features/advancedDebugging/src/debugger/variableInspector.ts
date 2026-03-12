export type VariableKind = 'local' | 'global' | 'closure' | 'property' | 'parameter';

export interface Variable {
  name: string;
  value: string;
  type: string;
  kind: VariableKind;
  expandable: boolean;
  children?: Variable[];
  memoryReference?: string;
  evaluateName?: string;
}

export interface Scope {
  name: string;
  variablesReference: number;
  expensive: boolean;
  variables: Variable[];
}

export class VariableInspector {
  private scopes: Map<string, Scope[]> = new Map();

  async getScopes(frameId: string): Promise<Scope[]> {
    return this.scopes.get(frameId) ?? [];
  }

  async getVariables(variablesReference: number): Promise<Variable[]> {
    console.log(`Getting variables for reference: ${variablesReference}`);
    return [];
  }

  async evaluate(expression: string, frameId: string): Promise<Variable | null> {
    console.log(`Evaluating expression "${expression}" in frame ${frameId}`);
    return null;
  }

  async setVariable(variablesReference: number, name: string, value: string): Promise<Variable | null> {
    console.log(`Setting variable ${name} = ${value}`);
    return null;
  }

  async expandVariable(variable: Variable): Promise<Variable[]> {
    if (!variable.expandable) return [];
    console.log(`Expanding variable: ${variable.name}`);
    return variable.children ?? [];
  }

  async hoverEvaluate(expression: string, frameId: string): Promise<string | null> {
    const result = await this.evaluate(expression, frameId);
    return result ? `${result.name}: ${result.value}` : null;
  }

  updateScopes(frameId: string, scopes: Scope[]): void {
    this.scopes.set(frameId, scopes);
  }

  clearScopes(): void {
    this.scopes.clear();
  }
}
