import type { CapturedRequest } from './requestCapture';

export interface CapturedResponse {
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string;
  contentType?: string;
  contentLength?: number;
  timestamp: Date;
  duration: number;
}

export interface NetworkEvent {
  requestId: string;
  request: CapturedRequest;
  response?: CapturedResponse;
  error?: string;
  timing: {
    started: Date;
    dns?: number;
    connect?: number;
    ssl?: number;
    send?: number;
    wait?: number;
    receive?: number;
    total: number;
  };
}

export class ResponseAnalysis {
  private responses: Map<string, CapturedResponse> = new Map();
  private events: Map<string, NetworkEvent> = new Map();

  recordResponse(response: CapturedResponse): void {
    this.responses.set(response.requestId, response);
  }

  recordEvent(event: NetworkEvent): void {
    this.events.set(event.requestId, event);
  }

  getResponse(requestId: string): CapturedResponse | null {
    return this.responses.get(requestId) ?? null;
  }

  analyzeErrors(): { requestId: string; url?: string; error: string; status?: number }[] {
    const errors: { requestId: string; url?: string; error: string; status?: number }[] = [];
    for (const event of this.events.values()) {
      if (event.error) {
        errors.push({ requestId: event.requestId, url: event.request.url, error: event.error });
      } else if (event.response && event.response.status >= 400) {
        errors.push({
          requestId: event.requestId,
          url: event.request.url,
          error: event.response.statusText,
          status: event.response.status,
        });
      }
    }
    return errors;
  }

  getSlowRequests(thresholdMs = 1000): NetworkEvent[] {
    return Array.from(this.events.values())
      .filter(e => e.timing.total > thresholdMs)
      .sort((a, b) => b.timing.total - a.timing.total);
  }

  getStatistics(): {
    totalRequests: number;
    totalBytes: number;
    averageDuration: number;
    errorCount: number;
    byContentType: Record<string, number>;
  } {
    const events = Array.from(this.events.values());
    const totalBytes = Array.from(this.responses.values())
      .reduce((sum, r) => sum + (r.contentLength ?? 0), 0);
    const averageDuration = events.length > 0
      ? events.reduce((sum, e) => sum + e.timing.total, 0) / events.length
      : 0;
    const errorCount = events.filter(e => e.error || (e.response?.status ?? 0) >= 400).length;
    const byContentType: Record<string, number> = {};
    for (const response of this.responses.values()) {
      const type = response.contentType?.split(';')[0] ?? 'unknown';
      byContentType[type] = (byContentType[type] ?? 0) + 1;
    }
    return { totalRequests: events.length, totalBytes, averageDuration, errorCount, byContentType };
  }
}
