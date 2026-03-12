export interface Invoice {
  id: string;
  organizationId: string;
  subscriptionId?: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: InvoiceLineItem[];
  period: { from: Date; to: Date };
  dueDate?: Date;
  paidAt?: Date;
  createdAt: Date;
  customerEmail: string;
  customerName?: string;
  customerAddress?: Address;
  notes?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate?: number;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

let invoiceCounter = 1000;

export class InvoiceGenerator {
  private invoices: Map<string, Invoice> = new Map();

  async generate(organizationId: string, options: {
    subscriptionId?: string;
    lineItems: Omit<InvoiceLineItem, 'amount'>[];
    currency?: string;
    period: { from: Date; to: Date };
    dueDate?: Date;
    customerEmail: string;
    customerName?: string;
    customerAddress?: Address;
    taxRate?: number;
    notes?: string;
  }): Promise<Invoice> {
    const lineItems: InvoiceLineItem[] = options.lineItems.map(item => ({
      ...item,
      amount: item.quantity * item.unitPrice,
      taxRate: options.taxRate,
    }));
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = options.taxRate ? subtotal * options.taxRate : 0;

    const invoice: Invoice = {
      id: Math.random().toString(36).substring(2, 9),
      organizationId,
      subscriptionId: options.subscriptionId,
      number: `INV-${String(++invoiceCounter).padStart(6, '0')}`,
      status: 'draft',
      currency: options.currency ?? 'USD',
      subtotal,
      tax,
      total: subtotal + tax,
      lineItems,
      period: options.period,
      dueDate: options.dueDate,
      createdAt: new Date(),
      customerEmail: options.customerEmail,
      customerName: options.customerName,
      customerAddress: options.customerAddress,
      notes: options.notes,
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async finalize(invoiceId: string): Promise<Invoice | null> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.status !== 'draft') return null;
    invoice.status = 'open';
    return invoice;
  }

  async markAsPaid(invoiceId: string): Promise<Invoice | null> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) return null;
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    return invoice;
  }

  async void(invoiceId: string): Promise<Invoice | null> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.status === 'paid') return null;
    invoice.status = 'void';
    return invoice;
  }

  async get(invoiceId: string): Promise<Invoice | null> {
    return this.invoices.get(invoiceId) ?? null;
  }

  async list(organizationId: string, options?: {
    status?: Invoice['status'];
    limit?: number;
  }): Promise<Invoice[]> {
    let invoices = Array.from(this.invoices.values()).filter(i => i.organizationId === organizationId);
    if (options?.status) invoices = invoices.filter(i => i.status === options.status);
    return invoices
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, options?.limit ?? 100);
  }

  async renderPDF(invoiceId: string): Promise<Buffer> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
    console.log(`Rendering PDF for invoice ${invoice.number}`);
    return Buffer.from(`Invoice ${invoice.number}`);
  }

  async renderHTML(invoiceId: string): Promise<string> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
    return `<html><body><h1>Invoice ${invoice.number}</h1><p>Total: ${invoice.currency} ${invoice.total.toFixed(2)}</p></body></html>`;
  }
}
