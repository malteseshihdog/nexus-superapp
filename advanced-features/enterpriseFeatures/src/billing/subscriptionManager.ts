import type { Subscription, Plan } from './billingManager';

export interface SubscriptionEvent {
  type: 'created' | 'updated' | 'canceled' | 'renewed' | 'trial_ended' | 'payment_failed' | 'payment_succeeded';
  subscriptionId: string;
  organizationId: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

export class SubscriptionManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private events: SubscriptionEvent[] = [];
  private eventHandlers: Map<SubscriptionEvent['type'], ((event: SubscriptionEvent) => void)[]> = new Map();

  on(eventType: SubscriptionEvent['type'], handler: (event: SubscriptionEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(eventType, handlers);
  }

  private emit(event: SubscriptionEvent): void {
    this.events.push(event);
    const handlers = this.eventHandlers.get(event.type) ?? [];
    for (const handler of handlers) {
      try { handler(event); } catch (e) { console.error('Event handler error:', e); }
    }
  }

  async save(subscription: Subscription): Promise<void> {
    const isNew = !this.subscriptions.has(subscription.organizationId);
    this.subscriptions.set(subscription.organizationId, subscription);
    this.emit({
      type: isNew ? 'created' : 'updated',
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      timestamp: new Date(),
    });
  }

  async get(organizationId: string): Promise<Subscription | null> {
    return this.subscriptions.get(organizationId) ?? null;
  }

  async cancel(organizationId: string, immediately = false): Promise<void> {
    const subscription = this.subscriptions.get(organizationId);
    if (!subscription) return;
    subscription.cancelAtPeriodEnd = !immediately;
    if (immediately) subscription.status = 'canceled';
    subscription.updatedAt = new Date();
    this.emit({
      type: 'canceled',
      subscriptionId: subscription.id,
      organizationId,
      timestamp: new Date(),
      data: { immediately },
    });
  }

  async renew(organizationId: string): Promise<Subscription | null> {
    const subscription = this.subscriptions.get(organizationId);
    if (!subscription || subscription.status === 'canceled') return null;
    const period = subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime();
    subscription.currentPeriodStart = subscription.currentPeriodEnd;
    subscription.currentPeriodEnd = new Date(subscription.currentPeriodEnd.getTime() + period);
    subscription.updatedAt = new Date();
    this.emit({
      type: 'renewed',
      subscriptionId: subscription.id,
      organizationId,
      timestamp: new Date(),
    });
    return subscription;
  }

  async checkTrials(): Promise<string[]> {
    const expiredTrials: string[] = [];
    const now = new Date();
    for (const subscription of this.subscriptions.values()) {
      if (subscription.status === 'trialing' && subscription.trialEnd && subscription.trialEnd < now) {
        subscription.status = 'active';
        subscription.updatedAt = now;
        expiredTrials.push(subscription.organizationId);
        this.emit({
          type: 'trial_ended',
          subscriptionId: subscription.id,
          organizationId: subscription.organizationId,
          timestamp: now,
        });
      }
    }
    return expiredTrials;
  }

  async processPayment(organizationId: string, success: boolean): Promise<void> {
    const subscription = this.subscriptions.get(organizationId);
    if (!subscription) return;
    const eventType = success ? 'payment_succeeded' : 'payment_failed';
    if (!success) subscription.status = 'past_due';
    else if (subscription.status === 'past_due') subscription.status = 'active';
    subscription.updatedAt = new Date();
    this.emit({
      type: eventType,
      subscriptionId: subscription.id,
      organizationId,
      timestamp: new Date(),
    });
  }

  getEventHistory(organizationId?: string): SubscriptionEvent[] {
    if (!organizationId) return this.events;
    return this.events.filter(e => e.organizationId === organizationId);
  }

  async listActive(): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values()).filter(s =>
      ['active', 'trialing'].includes(s.status)
    );
  }
}
