export type RegistrationPaymentUpdate = {
  status?: "pending" | "confirmed" | "cancelled";
  payment_status?: "pending" | "paid" | "refunded" | "cancelled" | "failed" | "chargeback" | "risk_analysis";
  payment_checkout_status?: "ACTIVE" | "PAID" | "EXPIRED" | "CANCELED" | "FAILED" | "RISK_ANALYSIS";
  payment_confirmed_at?: string;
  payment_refunded_at?: string;
  last_payment_event_at: string;
  updated_at: string;
};

export function registrationIdFromExternalReference(reference: unknown) {
  const text = String(reference ?? "").trim();
  const match = text.match(/^legends-registration:([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i);
  return match?.[1] ?? null;
}

export function mapAsaasEventToRegistrationUpdate(event: string, at = new Date().toISOString()): RegistrationPaymentUpdate | null {
  const base = { last_payment_event_at: at, updated_at: at };
  switch (event) {
    case "CHECKOUT_CREATED":
    case "PAYMENT_CREATED":
    case "PAYMENT_UPDATED":
      return { ...base, status: "pending", payment_status: "pending", payment_checkout_status: "ACTIVE" };
    case "CHECKOUT_PAID":
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED":
      return { ...base, status: "confirmed", payment_status: "paid", payment_checkout_status: "PAID", payment_confirmed_at: at };
    case "CHECKOUT_EXPIRED":
    case "PAYMENT_OVERDUE":
      return { ...base, status: "cancelled", payment_status: "cancelled", payment_checkout_status: "EXPIRED" };
    case "CHECKOUT_CANCELED":
    case "PAYMENT_DELETED":
    case "PAYMENT_BANK_SLIP_CANCELLED":
      return { ...base, status: "cancelled", payment_status: "cancelled", payment_checkout_status: "CANCELED" };
    case "PAYMENT_REFUNDED":
    case "PAYMENT_PARTIALLY_REFUNDED":
    case "PAYMENT_RECEIVED_IN_CASH_UNDONE":
      return { ...base, status: "cancelled", payment_status: "refunded", payment_checkout_status: "CANCELED", payment_refunded_at: at };
    case "PAYMENT_CHARGEBACK_REQUESTED":
    case "PAYMENT_CHARGEBACK_DISPUTE":
      return { ...base, status: "cancelled", payment_status: "chargeback", payment_checkout_status: "CANCELED" };
    case "PAYMENT_AWAITING_RISK_ANALYSIS":
    case "PAYMENT_AUTHORIZED":
      return { ...base, status: "pending", payment_status: "risk_analysis", payment_checkout_status: "RISK_ANALYSIS" };
    case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
    case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED":
      return { ...base, status: "pending", payment_status: "failed", payment_checkout_status: "FAILED" };
    default:
      return null;
  }
}
