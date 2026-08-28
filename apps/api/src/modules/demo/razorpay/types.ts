export interface DemoCheckoutStatus {
  amountPaise: number;
  configured: boolean;
  keySetupUrl: string;
  mode: "test";
  webhookSetupUrl: string;
}

export interface DemoCheckoutOrder {
  amountPaise: number;
  currency: "INR";
  keyId: string;
  orderId: string;
}

export interface DemoCheckoutService {
  createOrder(): Promise<DemoCheckoutOrder>;
  getStatus(): DemoCheckoutStatus;
}

export interface DemoRazorpayOrders {
  createOrder(input: {
    amountPaise: number;
    currency: "INR";
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ id: string; amount: number; currency: string }>;
}
