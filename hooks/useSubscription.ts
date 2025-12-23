/**
 * Subscription Hook
 *
 * Provides subscription data and helper functions for billing.
 */
import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import {
  getSubscription,
  getCredits,
  getUsage,
  SubscriptionData,
  CreditBalance,
  UsageSummary,
} from "@/lib/api/billing";

/**
 * Hook to get current user's subscription
 */
export function useSubscription() {
  const { getToken, isSignedIn } = useAuth();

  return useSWR<SubscriptionData>(
    isSignedIn ? "subscription" : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getSubscription(token);
    },
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );
}

/**
 * Hook to get current user's credit balance
 */
export function useCredits() {
  const { getToken, isSignedIn } = useAuth();

  return useSWR<CreditBalance>(
    isSignedIn ? "credits" : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getCredits(token);
    },
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );
}

/**
 * Hook to get current user's usage summary
 */
export function useUsage() {
  const { getToken, isSignedIn } = useAuth();

  return useSWR<UsageSummary>(
    isSignedIn ? "usage" : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getUsage(token);
    },
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );
}

/**
 * Check if user has access to a feature based on their plan
 */
export function useFeatureAccess(feature: string) {
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading || !subscription) {
    return { hasAccess: false, isLoading: true, reason: "Loading..." };
  }

  if (!subscription.has_subscription) {
    return {
      hasAccess: false,
      isLoading: false,
      reason: "No active subscription",
    };
  }

  const limits = subscription.limits || {};
  const limit = limits[feature];

  // Boolean features (like crm_access)
  if (typeof limit === "boolean") {
    return {
      hasAccess: limit,
      isLoading: false,
      reason: limit ? undefined : "Feature requires upgrade",
    };
  }

  // Count-based features
  if (typeof limit === "number") {
    if (limit === 0) {
      return {
        hasAccess: false,
        isLoading: false,
        reason: "Feature not included in plan",
      };
    }
    if (limit === -1) {
      return { hasAccess: true, isLoading: false, unlimited: true };
    }
    return { hasAccess: true, isLoading: false, limit };
  }

  // Default: allow access
  return { hasAccess: true, isLoading: false };
}

/**
 * Plan hierarchy for comparison
 */
const PLAN_LEVELS: Record<string, number> = {
  free: 0,
  pro: 1,
  pro_plus: 2,
  ultimate: 3,
};

/**
 * Check if current plan meets minimum requirement
 */
export function usePlanLevel(requiredPlan: string) {
  const { data: subscription, isLoading } = useSubscription();

  if (isLoading) {
    return { meetsRequirement: false, isLoading: true };
  }

  const currentPlan = subscription?.plan || "free";
  const currentLevel = PLAN_LEVELS[currentPlan] || 0;
  const requiredLevel = PLAN_LEVELS[requiredPlan] || 0;

  return {
    meetsRequirement: currentLevel >= requiredLevel,
    isLoading: false,
    currentPlan,
    currentLevel,
    requiredPlan,
    requiredLevel,
  };
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: string): string {
  const names: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    pro_plus: "Pro Plus",
    ultimate: "Ultimate",
  };
  return names[plan] || plan;
}
