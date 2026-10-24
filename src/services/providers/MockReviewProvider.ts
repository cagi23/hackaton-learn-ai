import type { CodeReview, ReviewRequest } from "../../domain/types";
import { CodeReviewSchema } from "../../domain/schemas";
import type { ReviewProvider } from "./ReviewProvider";

const DETERMINISTIC_REVIEW: CodeReview = {
  summary: {
    overallQuality: "Needs Improvement",
    findingsCount: 4,
  },
  findings: [
    {
      id: "finding-1",
      title: "Unsafe Undefined Access on Array Search Result",
      category: "type-safety",
      severity: "high",
      affectedCode: `const targetItem = request.items.find((item) => item.productId === "PROD-VIP");
const priorityQuantity = targetItem.quantity;`,
      description:
        "Array.prototype.find() returns `T | undefined`. Accessing `.quantity` directly without verifying whether targetItem is defined causes an unhandled runtime TypeError when 'PROD-VIP' is missing from the cart items.",
      whyItMatters:
        "At runtime, this throws 'TypeError: Cannot read properties of undefined (reading quantity)', abruptly terminating the checkout transaction for any standard customer who did not add the VIP item.",
      principle: "Null Safety & Defensive Checks",
      suggestion:
        "Use optional chaining with a nullish coalescing default value (`targetItem?.quantity ?? 0`) or an explicit guard clause before property access.",
      improvedCode: `const targetItem = request.items.find((item) => item.productId === "PROD-VIP");
const priorityQuantity = targetItem?.quantity ?? 0;`,
      challenge: {
        question:
          "What is the most idiomatic TypeScript approach to safely read a property from a find() result that may be undefined?",
        code: `const targetItem = request.items.find((item) => item.productId === "PROD-VIP");`,
        answers: [
          {
            id: "opt-1",
            text: "Use optional chaining with a nullish coalescing fallback: targetItem?.quantity ?? 0",
          },
          {
            id: "opt-2",
            text: "Assert non-null using the non-null assertion operator: targetItem!.quantity",
          },
          {
            id: "opt-3",
            text: "Wrap the property access in an empty try/catch block that silently returns undefined",
          },
        ],
        correctAnswerId: "opt-1",
        explanation:
          "Optional chaining (`?.`) evaluates safely to `undefined` if the operand is nullish, and nullish coalescing (`??`) provides a reliable fallback default value without suppressing other runtime exceptions.",
      },
    },
    {
      id: "finding-2",
      title: "Unhandled Async Payment Gateway Failure",
      category: "bug",
      severity: "critical",
      affectedCode: `const paymentResponse = await this.executePaymentGatewayCall(
  request.paymentToken,
  totalAmount
);`,
      description:
        "The asynchronous external payment gateway call is performed without try/catch handling or HTTP status validation. Any network timeout, gateway 5xx error, or payment rejection will propagate an unhandled rejection.",
      whyItMatters:
        "In production, unhandled payment gateway rejections can leave transactions in indeterminate states, fail without proper audit trails or customer-facing error notifications, and risk duplicate charges upon client retries.",
      principle: "Fail-Fast & Explicit Error Handling",
      suggestion:
        "Wrap external network operations in structured try/catch blocks, validate response status codes, log diagnostic telemetry, and return an explicit domain failure result or custom error.",
      improvedCode: `let paymentResponse;
try {
  paymentResponse = await this.executePaymentGatewayCall(
    request.paymentToken,
    totalAmount
  );
  if (!paymentResponse?.success) {
    return { orderId: "", totalAmount, status: "FAILED" };
  }
} catch (error) {
  console.error("Payment gateway communication failed", { error, token: request.paymentToken });
  return { orderId: "", totalAmount, status: "FAILED" };
}`,
      challenge: {
        question:
          "Why is calling an external third-party payment gateway without try/catch considered a critical defect?",
        answers: [
          {
            id: "opt-1",
            text: "V8 engine optimizations are disabled when await is used without try/catch",
          },
          {
            id: "opt-2",
            text: "Network or gateway failures produce unhandled rejections, aborting execution without orderly recovery or rollback",
          },
          {
            id: "opt-3",
            text: "The fetch API automatically retries rejected promises unless enclosed in try/catch",
          },
        ],
        correctAnswerId: "opt-2",
        explanation:
          "External I/O operations are inherently fallible. Uncaught network errors terminate the request flow abruptly, preventing clean error reporting, customer notifications, and compensating transactional rollbacks.",
      },
    },
    {
      id: "finding-3",
      title: "Direct Database Persistence Violating Single Responsibility Principle",
      category: "maintainability",
      severity: "medium",
      affectedCode: `private dbUrl = "postgresql://app_user:secret123@prod-db.internal:5432/orders";
private dbPool = new DatabasePool({ connectionString: this.dbUrl });
...
await this.dbPool.query(
  "INSERT INTO orders (id, customer_id, total, status) VALUES ($1, $2, $3, $4)",
  [orderId, customerId, totalAmount, "CONFIRMED"]
);`,
      description:
        "OrderService hardcodes database connection strings, instantiates driver connection pools, and executes raw SQL queries directly inside the domain checkout orchestration method.",
      whyItMatters:
        "Coupling domain logic to raw database infrastructure prevents unit testing without a live PostgreSQL instance, exposes credentials in source code, and makes schema or database migrations unnecessarily difficult.",
      principle: "Single Responsibility Principle (SRP)",
      suggestion:
        "Delegate persistence operations to an injected OrderRepository abstraction using dependency injection, and source credentials from secure configuration or environment variables.",
      improvedCode: `export interface OrderRepository {
  save(order: { id: string; customerId: string; total: number; status: string }): Promise<void>;
}

export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async checkout(request: OrderRequest): Promise<OrderResult> {
    // ...
    await this.orderRepository.save({
      id: orderId,
      customerId,
      total: totalAmount,
      status: "CONFIRMED",
    });
    // ...
  }
}`,
      challenge: {
        question:
          "What is the primary benefit of abstracting database operations behind a repository interface in domain services?",
        answers: [
          {
            id: "opt-1",
            text: "It decouples business rules from storage mechanisms and facilitates unit testing with test doubles",
          },
          {
            id: "opt-2",
            text: "It guarantees that SQL queries execute with hardware-accelerated caching in PostgreSQL",
          },
          {
            id: "opt-3",
            text: "It eliminates the need for database indexes on primary and foreign keys",
          },
        ],
        correctAnswerId: "opt-1",
        explanation:
          "Separation of concerns via repository patterns isolates business workflow logic from database driver specifics, allowing isolated unit testing via mocks/stubs and straightforward infrastructure replacement.",
      },
    },
    {
      id: "finding-4",
      title: "Insecure Customer Identifier Handling Without Input Validation",
      category: "security",
      severity: "medium",
      affectedCode: `interface OrderRequest {
  customerId: any;
  ...
}
...
const customerId = request.customerId;
console.log("Processing checkout for customer: " + customerId);`,
      description:
        "The customerId parameter is typed as `any` and consumed without type checking, schema parsing, or sanitization prior to logging and database persistence.",
      whyItMatters:
        "Allowing arbitrary `any` values can cause log injection if control characters or malicious payloads are included, or trigger database driver serialization failures and potential authorization bypasses.",
      principle: "Input Validation & Boundary Checking",
      suggestion:
        "Validate incoming request parameters at system boundaries using a schema validation library like Zod, and type customerId as a strict validated string (e.g. UUID).",
      improvedCode: `import { z } from "zod";

export const OrderRequestSchema = z.object({
  customerId: z.string().uuid("Invalid customer identifier format"),
  items: z.array(CartItemSchema).min(1, "Order must contain at least one item"),
  paymentToken: z.string().min(1, "Payment token is required"),
});`,
      challenge: {
        question:
          "How should modern TypeScript applications validate untrusted external input before processing?",
        answers: [
          {
            id: "opt-1",
            text: "Trust compile-time type assertions ('as string') because TypeScript validates types at runtime",
          },
          {
            id: "opt-2",
            text: "Validate payloads at system boundaries using runtime schema validators such as Zod",
          },
          {
            id: "opt-3",
            text: "Rely exclusively on database constraints to reject malformed input objects",
          },
        ],
        correctAnswerId: "opt-2",
        explanation:
          "TypeScript types are erased at compile time. Runtime schema validation libraries like Zod enforce contract guarantees at boundaries before untrusted data penetrates internal application logic.",
      },
    },
  ],
};

export class MockReviewProvider implements ReviewProvider {
  readonly name = "MockReviewProvider";

  constructor(
    private readonly simulatedDelayMs: number = typeof process !== "undefined" &&
    process.env?.NODE_ENV === "test"
      ? 0
      : 1500
  ) {}

  async review(_request: ReviewRequest): Promise<CodeReview> {
    if (this.simulatedDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, this.simulatedDelayMs));
    }
    // Validate response with CodeReviewSchema to guarantee compliance
    return CodeReviewSchema.parse(DETERMINISTIC_REVIEW);
  }
}
