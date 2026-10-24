export const DEMO_FILENAME = "OrderService.ts";

export const DEMO_TYPESCRIPT_CODE = `import { DatabasePool } from "pg";

interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface OrderRequest {
  // Defect 2 & 4: Weak typing ('any') and unvalidated input for customer ID
  customerId: any;
  items: CartItem[];
  paymentToken: string;
}

interface OrderResult {
  orderId: string;
  totalAmount: number;
  status: "CONFIRMED" | "FAILED";
}

export class OrderService {
  // Defect 3: Mixed persistence concern & hardcoded connection string in business service
  private dbUrl = "postgresql://app_user:secret123@prod-db.internal:5432/orders";
  private dbPool = new DatabasePool({ connectionString: this.dbUrl });

  async checkout(request: OrderRequest): Promise<OrderResult> {
    // Defect 4: Insecure customer ID handling without type validation or sanitization
    const customerId = request.customerId;
    console.log("Processing checkout for customer: " + customerId);

    // Defect 1: Unsafe undefined access on items.find(...)
    // Array.find can return undefined, but quantity is directly accessed without checks
    const targetItem = request.items.find((item) => item.productId === "PROD-VIP");
    const priorityQuantity = targetItem.quantity;

    let totalAmount = 0;
    for (const item of request.items) {
      totalAmount += item.unitPrice * item.quantity;
    }

    // Defect 2 & 4: Unhandled async payment failure
    // Network call executed without try-catch or explicit error handling
    const paymentResponse = await this.executePaymentGatewayCall(
      request.paymentToken,
      totalAmount
    );

    const orderId = "ORD-" + Math.random().toString(36).substring(2, 9).toUpperCase();

    // Defect 3: Direct SQL execution violating Single Responsibility Principle (SRP)
    await this.dbPool.query(
      "INSERT INTO orders (id, customer_id, total, status) VALUES ($1, $2, $3, $4)",
      [orderId, customerId, totalAmount, "CONFIRMED"]
    );

    return {
      orderId,
      totalAmount,
      status: "CONFIRMED",
    };
  }

  private async executePaymentGatewayCall(token: string, amount: number): Promise<any> {
    const response = await fetch("https://api.payments.io/v1/charges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, amount }),
    });
    return await response.json();
  }
}
`;
