/**
 * Billing API Client
 *
 * Handles subscription management and billing operations.
 */

const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api/backend"
    : process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || "http://localhost:8002";

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  credits: number;
  limits: Record<string, number | boolean>;
}

export interface SubscriptionData {
  has_subscription: boolean;
  plan: string;
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  limits?: Record<string, number | boolean>;
}

export interface CreditBalance {
  has_credits: boolean;
  monthly_allocation: number;
  credits_used: number;
  credits_remaining: number;
  credits_purchased: number;
  overage_credits: number;
  next_reset: string | null;
}

export interface FeatureUsage {
  used: number;
  limit: number | null;
  unlimited: boolean;
  percentage: number;
}

export interface UsageSummary {
  plan: string;
  period_start: string;
  usage: Record<string, FeatureUsage>;
  credits: CreditBalance;
}

export interface PlansResponse {
  plans: Plan[];
  guarantee: string;
}

/**
 * Get available subscription plans (public endpoint)
 */
export async function getPlans(): Promise<PlansResponse> {
  const response = await fetch(`${API_BASE_URL}/api/billing/plans`);
  if (!response.ok) {
    throw new Error("Failed to fetch plans");
  }
  return response.json();
}

/**
 * Check if Stripe is configured
 */
export async function checkBillingConfigured(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/billing/configured`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.configured;
  } catch {
    return false;
  }
}

/**
 * Get current user's subscription details
 */
export async function getSubscription(token: string): Promise<SubscriptionData> {
  const response = await fetch(`${API_BASE_URL}/api/billing/subscription`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch subscription");
  }
  return response.json();
}

/**
 * Get current user's credit balance
 */
export async function getCredits(token: string): Promise<CreditBalance> {
  const response = await fetch(`${API_BASE_URL}/api/billing/credits`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch credits");
  }
  return response.json();
}

/**
 * Get usage summary for current billing period
 */
export async function getUsage(token: string): Promise<UsageSummary> {
  const response = await fetch(`${API_BASE_URL}/api/billing/usage`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch usage");
  }
  return response.json();
}

/**
 * Create a Stripe Checkout session for new subscription
 */
export async function createCheckout(
  token: string,
  plan: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ checkout_url: string }> {
  const response = await fetch(`${API_BASE_URL}/api/billing/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      plan,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create checkout session");
  }
  return response.json();
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortal(
  token: string,
  returnUrl: string
): Promise<{ portal_url: string }> {
  const response = await fetch(`${API_BASE_URL}/api/billing/portal`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      return_url: returnUrl,
    }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to create portal session");
  }
  return response.json();
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeatureAccess(
  token: string,
  feature: string
): Promise<{ feature: string; has_access: boolean; reason?: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/billing/check-access/${feature}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to check feature access");
  }
  return response.json();
}
