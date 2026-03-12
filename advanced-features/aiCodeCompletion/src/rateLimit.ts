export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour?: number;
  tokensPerMinute?: number;
  burstSize?: number;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private requestTimestamps: number[] = [];
  private tokenUsage: { timestamp: number; tokens: number }[] = [];

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    this.cleanupOldRequests();

    const requestsLastMinute = this.requestTimestamps.filter(
      t => t > Date.now() - 60_000
    ).length;

    if (requestsLastMinute >= this.config.requestsPerMinute) {
      const oldest = this.requestTimestamps[0];
      const retryAfterMs = oldest + 60_000 - Date.now();
      return { allowed: false, retryAfterMs: Math.max(0, retryAfterMs) };
    }

    if (this.config.requestsPerHour !== undefined) {
      const requestsLastHour = this.requestTimestamps.filter(
        t => t > Date.now() - 3_600_000
      ).length;
      if (requestsLastHour >= this.config.requestsPerHour) {
        return { allowed: false, retryAfterMs: 3_600_000 };
      }
    }

    return { allowed: true };
  }

  async waitIfNeeded(): Promise<void> {
    const { allowed, retryAfterMs } = await this.checkLimit();
    if (!allowed && retryAfterMs && retryAfterMs > 0) {
      await new Promise(resolve => setTimeout(resolve, retryAfterMs));
    }
  }

  recordRequest(tokensUsed = 0): void {
    const now = Date.now();
    this.requestTimestamps.push(now);
    if (tokensUsed > 0) {
      this.tokenUsage.push({ timestamp: now, tokens: tokensUsed });
    }
  }

  private cleanupOldRequests(): void {
    const oneHourAgo = Date.now() - 3_600_000;
    this.requestTimestamps = this.requestTimestamps.filter(t => t > oneHourAgo);
    this.tokenUsage = this.tokenUsage.filter(t => t.timestamp > oneHourAgo);
  }

  getStats(): { requestsLastMinute: number; requestsLastHour: number; tokensLastMinute: number } {
    this.cleanupOldRequests();
    const now = Date.now();
    return {
      requestsLastMinute: this.requestTimestamps.filter(t => t > now - 60_000).length,
      requestsLastHour: this.requestTimestamps.length,
      tokensLastMinute: this.tokenUsage
        .filter(t => t.timestamp > now - 60_000)
        .reduce((sum, t) => sum + t.tokens, 0),
    };
  }

  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
