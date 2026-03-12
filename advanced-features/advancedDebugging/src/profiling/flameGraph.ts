export interface FlameNode {
  name: string;
  value: number;
  selfValue: number;
  children: FlameNode[];
  color?: string;
  tooltip?: string;
}

export interface FlameGraphOptions {
  minFrameWidth?: number;
  colorScheme?: 'hot' | 'cool' | 'warm' | 'random';
  reversed?: boolean;
  inverted?: boolean;
}

export class FlameGraph {
  private options: FlameGraphOptions;

  constructor(options: FlameGraphOptions = {}) {
    this.options = {
      minFrameWidth: 0.1,
      colorScheme: 'hot',
      ...options,
    };
  }

  buildFromCpuProfile(profile: { nodes: { callFrame: { functionName: string }; selfTime: number; totalTime: number; children?: number[]; id: number }[] }): FlameNode {
    const nodeMap = new Map(profile.nodes.map(n => [n.id, n]));
    const rootNodes = profile.nodes.filter(n => !profile.nodes.some(p => p.children?.includes(n.id)));

    const buildNode = (nodeId: number): FlameNode => {
      const node = nodeMap.get(nodeId);
      if (!node) return { name: 'unknown', value: 0, selfValue: 0, children: [] };
      return {
        name: node.callFrame.functionName || '(anonymous)',
        value: node.totalTime,
        selfValue: node.selfTime,
        children: (node.children ?? []).map(buildNode),
        color: this.getColor(node.callFrame.functionName),
      };
    };

    return {
      name: 'root',
      value: profile.nodes.reduce((s, n) => s + n.selfTime, 0),
      selfValue: 0,
      children: rootNodes.map(n => buildNode(n.id)),
    };
  }

  buildFromStackTraces(stackTraces: string[][]): FlameNode {
    const root: FlameNode = { name: 'root', value: stackTraces.length, selfValue: 0, children: [] };

    for (const trace of stackTraces) {
      let current = root;
      for (const frame of trace.reverse()) {
        let child = current.children.find(c => c.name === frame);
        if (!child) {
          child = { name: frame, value: 0, selfValue: 0, children: [] };
          current.children.push(child);
        }
        child.value++;
        current = child;
      }
      current.selfValue++;
    }

    return root;
  }

  serialize(root: FlameNode): string {
    return JSON.stringify(root);
  }

  private getColor(functionName: string): string {
    const scheme = this.options.colorScheme;
    if (scheme === 'hot') {
      const hue = (functionName.length * 13) % 60;
      return `hsl(${hue}, 90%, 50%)`;
    }
    return `hsl(${(functionName.charCodeAt(0) * 7) % 360}, 70%, 50%)`;
  }

  updateOptions(options: Partial<FlameGraphOptions>): void {
    this.options = { ...this.options, ...options };
  }
}
