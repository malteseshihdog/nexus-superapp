export interface AuditEvent {
  id: string;
  timestamp: Date;
  actorId: string;
  actorEmail?: string;
  actorIp?: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  status: 'success' | 'failure' | 'pending';
  details?: Record<string, unknown>;
  userAgent?: string;
  sessionId?: string;
}

export interface AuditQuery {
  organizationId: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  status?: 'success' | 'failure' | 'pending';
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  private events: AuditEvent[] = [];
  private maxInMemory: number;

  constructor(maxInMemory = 10_000) {
    this.maxInMemory = maxInMemory;
  }

  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
      ...event,
    };
    this.events.push(auditEvent);
    if (this.events.length > this.maxInMemory) {
      this.events = this.events.slice(-this.maxInMemory);
    }
    return auditEvent;
  }

  async query(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    let filtered = this.events.filter(e => e.organizationId === query.organizationId);

    if (query.actorId) filtered = filtered.filter(e => e.actorId === query.actorId);
    if (query.action) filtered = filtered.filter(e => e.action === query.action);
    if (query.resourceType) filtered = filtered.filter(e => e.resourceType === query.resourceType);
    if (query.status) filtered = filtered.filter(e => e.status === query.status);
    if (query.fromDate) filtered = filtered.filter(e => e.timestamp >= query.fromDate!);
    if (query.toDate) filtered = filtered.filter(e => e.timestamp <= query.toDate!);

    const total = filtered.length;
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 100;
    const events = filtered
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(offset, offset + limit);

    return { events, total };
  }

  async getEvent(eventId: string): Promise<AuditEvent | null> {
    return this.events.find(e => e.id === eventId) ?? null;
  }

  async exportCSV(organizationId: string, fromDate: Date, toDate: Date): Promise<string> {
    const { events } = await this.query({ organizationId, fromDate, toDate, limit: 100_000 });
    const header = 'id,timestamp,actorId,actorEmail,action,resourceType,resourceId,status';
    const rows = events.map(e =>
      `${e.id},${e.timestamp.toISOString()},${e.actorId},${e.actorEmail ?? ''},${e.action},${e.resourceType},${e.resourceId ?? ''},${e.status}`
    );
    return [header, ...rows].join('\n');
  }

  async getStats(organizationId: string, days = 30): Promise<{
    totalEvents: number;
    successRate: number;
    topActions: { action: string; count: number }[];
    topActors: { actorId: string; count: number }[];
  }> {
    const fromDate = new Date(Date.now() - days * 86_400_000);
    const { events } = await this.query({ organizationId, fromDate, limit: 100_000 });
    const successCount = events.filter(e => e.status === 'success').length;
    const actionCounts: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};
    for (const e of events) {
      actionCounts[e.action] = (actionCounts[e.action] ?? 0) + 1;
      actorCounts[e.actorId] = (actorCounts[e.actorId] ?? 0) + 1;
    }
    return {
      totalEvents: events.length,
      successRate: events.length > 0 ? successCount / events.length : 1,
      topActions: Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([action, count]) => ({ action, count })),
      topActors: Object.entries(actorCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([actorId, count]) => ({ actorId, count })),
    };
  }
}
