export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise' | 'custom';
export type BillingInterval = 'monthly' | 'yearly' | 'usage';

export interface Plan {
  id: string;
  name: string;
  tier: PlanTier;
  price: number;
  currency: string;
  interval: BillingInterval;
  features: string[];
  limits: {
    seats?: number;
    storage?: number;
    buildMinutes?: number;
    apiCalls?: number;
    projects?: number;
  };
}

export interface Subscription {
  id: string;
  organizationId: string;
  planId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  trialEnd?: Date;
  cancelAtPeriodEnd: boolean;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'invoice';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export class BillingManager {
  private subscriptions: Map<string, Subscription> = new Map();
  private plans: Map<string, Plan> = new Map();

  constructor() {
    this.initDefaultPlans();
  }

  private initDefaultPlans(): void {
    const defaultPlans: Plan[] = [
      {
        id: 'free', name: 'Free', tier: 'free', price: 0, currency: 'USD', interval: 'monthly',
        features: ['1 project', '1 seat', '1GB storage'],
        limits: { seats: 1, storage: 1024, projects: 1 },
      },
      {
        id: 'starter', name: 'Starter', tier: 'starter', price: 12, currency: 'USD', interval: 'monthly',
        features: ['5 projects', '3 seats', '10GB storage', 'Basic CI/CD'],
        limits: { seats: 3, storage: 10240, projects: 5, buildMinutes: 500 },
      },
      {
        id: 'pro', name: 'Pro', tier: 'pro', price: 49, currency: 'USD', interval: 'monthly',
        features: ['Unlimited projects', '10 seats', '100GB storage', 'Advanced CI/CD', 'AI features'],
        limits: { seats: 10, storage: 102400, buildMinutes: 3000 },
      },
      {
        id: 'enterprise', name: 'Enterprise', tier: 'enterprise', price: 199, currency: 'USD', interval: 'monthly',
        features: ['Unlimited everything', 'SSO', 'Audit logs', 'SLA', 'Priority support'],
        limits: {},
      },
    ];
    for (const plan of defaultPlans) {
      this.plans.set(plan.id, plan);
    }
  }

  async subscribe(organizationId: string, planId: string, options?: {
    quantity?: number;
    trialDays?: number;
    paymentMethodId?: string;
  }): Promise<Subscription> {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const now = new Date();
    const subscription: Subscription = {
      id: Math.random().toString(36).substring(2, 9),
      organizationId,
      planId,
      status: options?.trialDays ? 'trialing' : 'active',
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 86_400_000),
      trialEnd: options?.trialDays ? new Date(now.getTime() + options.trialDays * 86_400_000) : undefined,
      cancelAtPeriodEnd: false,
      quantity: options?.quantity ?? 1,
      createdAt: now,
      updatedAt: now,
    };
    this.subscriptions.set(organizationId, subscription);
    console.log(`Subscription created: ${organizationId} -> ${planId}`);
    return subscription;
  }

  async getSubscription(organizationId: string): Promise<Subscription | null> {
    return this.subscriptions.get(organizationId) ?? null;
  }

  async changePlan(organizationId: string, newPlanId: string): Promise<Subscription | null> {
    const subscription = this.subscriptions.get(organizationId);
    if (!subscription) return null;
    subscription.planId = newPlanId;
    subscription.updatedAt = new Date();
    console.log(`Plan changed: ${organizationId} -> ${newPlanId}`);
    return subscription;
  }

  async cancelSubscription(organizationId: string, options?: { immediately?: boolean }): Promise<void> {
    const subscription = this.subscriptions.get(organizationId);
    if (!subscription) return;
    if (options?.immediately) {
      subscription.status = 'canceled';
    } else {
      subscription.cancelAtPeriodEnd = true;
    }
    subscription.updatedAt = new Date();
  }

  async listPlans(): Promise<Plan[]> {
    return Array.from(this.plans.values());
  }

  async getPlan(planId: string): Promise<Plan | null> {
    return this.plans.get(planId) ?? null;
  }

  async getUsage(organizationId: string): Promise<{
    seats: number;
    storage: number;
    buildMinutes: number;
    apiCalls: number;
  }> {
    console.log(`Getting usage for organization ${organizationId}`);
    return { seats: 0, storage: 0, buildMinutes: 0, apiCalls: 0 };
  }
}
