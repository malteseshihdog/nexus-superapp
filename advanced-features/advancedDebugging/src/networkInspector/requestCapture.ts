export interface CapturedRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: Date;
  initiator?: string;
}

export class RequestCapture {
  private requests: Map<string, CapturedRequest> = new Map();
  private isCapturing = false;
  private filters: { urlPattern?: RegExp; methods?: string[] } = {};

  startCapture(filters?: { urlPattern?: string; methods?: string[] }): void {
    this.isCapturing = true;
    if (filters?.urlPattern) {
      this.filters.urlPattern = new RegExp(filters.urlPattern);
    }
    if (filters?.methods) {
      this.filters.methods = filters.methods.map(m => m.toUpperCase());
    }
    console.log('Network request capture started');
  }

  stopCapture(): void {
    this.isCapturing = false;
    console.log('Network request capture stopped');
  }

  capture(request: Omit<CapturedRequest, 'id' | 'timestamp'>): string {
    if (!this.isCapturing) return '';
    if (this.filters.urlPattern && !this.filters.urlPattern.test(request.url)) return '';
    if (this.filters.methods && !this.filters.methods.includes(request.method.toUpperCase())) return '';

    const id = Math.random().toString(36).substring(2, 9);
    this.requests.set(id, { ...request, id, timestamp: new Date() });
    return id;
  }

  getRequest(id: string): CapturedRequest | null {
    return this.requests.get(id) ?? null;
  }

  listRequests(filter?: { method?: string; urlContains?: string }): CapturedRequest[] {
    let requests = Array.from(this.requests.values());
    if (filter?.method) {
      requests = requests.filter(r => r.method.toUpperCase() === filter.method!.toUpperCase());
    }
    if (filter?.urlContains) {
      requests = requests.filter(r => r.url.includes(filter.urlContains!));
    }
    return requests.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  clearRequests(): void {
    this.requests.clear();
  }

  isActive(): boolean {
    return this.isCapturing;
  }
}
