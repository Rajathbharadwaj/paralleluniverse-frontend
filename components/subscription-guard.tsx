"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

// Routes that don't require subscription (public routes)
const PUBLIC_ROUTES = [
  "/pricing",
  "/settings/billing",
  "/landing",
  "/terms",
  "/privacy",
  "/sign-in",
  "/sign-up",
];

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

/**
 * SubscriptionGuard component
 *
 * Wraps protected routes and redirects to /pricing if user doesn't have
 * an active subscription. Allows access to billing-related routes.
 */
export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { data: subscription, isLoading: subLoading, error } = useSubscription();
  const [isChecking, setIsChecking] = useState(true);

  // Check if current route is a public route (always allowed)
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname?.startsWith(route)
  );

  useEffect(() => {
    // Wait for auth to load
    if (!authLoaded) return;

    // Not signed in - Clerk middleware handles this
    if (!isSignedIn) {
      setIsChecking(false);
      return;
    }

    // Public routes are always accessible
    if (isPublicRoute) {
      setIsChecking(false);
      return;
    }

    // Wait for subscription data
    if (subLoading) return;

    // Error loading subscription - allow access but log
    if (error) {
      console.error("Error loading subscription:", error);
      setIsChecking(false);
      return;
    }

    // Check subscription status
    if (!subscription?.has_subscription) {
      // No subscription - redirect to pricing
      router.replace("/pricing");
      return;
    }

    // Has subscription - allow access
    setIsChecking(false);
  }, [
    authLoaded,
    isSignedIn,
    subscription,
    subLoading,
    error,
    router,
    pathname,
    isPublicRoute,
  ]);

  // Show loading while checking
  if (isChecking && isSignedIn && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Higher-order component version for wrapping pages
 */
export function withSubscriptionGuard<P extends object>(
  Component: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    return (
      <SubscriptionGuard>
        <Component {...props} />
      </SubscriptionGuard>
    );
  };
}
