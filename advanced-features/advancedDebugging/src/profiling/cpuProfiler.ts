export interface CpuProfile {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  sampleCount: number;
  samples: CpuSample[];
  nodes: ProfileNode[];
}

export interface CpuSample {
  timestamp: number;
  nodeId: number;
  selfTime: number;
}

export interface ProfileNode {
  id: number;
  callFrame: {
    functionName: string;
    scriptId: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  hitCount: number;
  children?: number[];
  selfTime: number;
  totalTime: number;
}

export class CpuProfiler {
  private profiles: Map<string, CpuProfile> = new Map();
  private isRecording = false;

  async start(): Promise<string> {
    const id = Math.random().toString(36).substring(2, 9);
    const profile: CpuProfile = {
      id,
      startTime: new Date(),
      sampleCount: 0,
      samples: [],
      nodes: [],
    };
    this.profiles.set(id, profile);
    this.isRecording = true;
    console.log(`CPU profiling started: ${id}`);
    return id;
  }

  async stop(profileId: string): Promise<CpuProfile | null> {
    const profile = this.profiles.get(profileId);
    if (!profile) return null;
    profile.endTime = new Date();
    profile.duration = profile.endTime.getTime() - profile.startTime.getTime();
    this.isRecording = false;
    console.log(`CPU profiling stopped: ${profileId}, duration: ${profile.duration}ms`);
    return profile;
  }

  async getHotFunctions(profileId: string, topN = 10): Promise<{ name: string; url: string; selfTime: number; totalTime: number; percentage: number }[]> {
    const profile = this.profiles.get(profileId);
    if (!profile) return [];
    return profile.nodes
      .sort((a, b) => b.selfTime - a.selfTime)
      .slice(0, topN)
      .map(n => ({
        name: n.callFrame.functionName || '(anonymous)',
        url: n.callFrame.url,
        selfTime: n.selfTime,
        totalTime: n.totalTime,
        percentage: profile.duration ? (n.selfTime / profile.duration) * 100 : 0,
      }));
  }

  async generateFlameData(profileId: string): Promise<object> {
    const profile = this.profiles.get(profileId);
    if (!profile) return {};
    console.log(`Generating flame graph data for profile ${profileId}`);
    return { name: 'root', value: profile.duration ?? 0, children: [] };
  }

  getProfile(profileId: string): CpuProfile | null {
    return this.profiles.get(profileId) ?? null;
  }

  isProfilerRunning(): boolean {
    return this.isRecording;
  }
}
