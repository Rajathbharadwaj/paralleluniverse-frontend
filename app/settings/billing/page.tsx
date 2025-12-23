"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Zap,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPortal } from "@/lib/api/billing";
import {
  useSubscription,
  useCredits,
  useUsage,
  getPlanDisplayName,
} from "@/hooks/useSubscription";

function BillingContent() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: credits, isLoading: creditsLoading } = useCredits();
  const { data: usage, isLoading: usageLoading } = useUsage();
  const [portalLoading, setPortalLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const success = searchParams.get("success") === "true";

  useEffect(() => {
    if (success) {
      setShowSuccess(true);
      // Clear the URL parameter
      window.history.replaceState({}, "", "/settings/billing");
    }
  }, [success]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const { portal_url } = await createPortal(token, window.location.href);
      window.location.href = portal_url;
    } catch (error) {
      console.error("Failed to open portal:", error);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const isLoading = subLoading || creditsLoading || usageLoading;

  if (isLoading) {
    return (
      <>
        <DashboardHeader />
        <div className="container mx-auto py-8 px-4 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader />
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* Success Alert */}
        {showSuccess && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              Welcome to Parallel Universe! Your subscription is now active.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
            <p className="text-muted-foreground">
              Manage your subscription and view usage
            </p>
          </div>
        </div>

        {/* No subscription message */}
        {!subscription?.has_subscription && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>No Active Subscription</CardTitle>
              <CardDescription>
                Subscribe to a plan to start using Parallel Universe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => (window.location.href = "/pricing")}>
                View Plans
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Subscription Card */}
        {subscription?.has_subscription && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {getPlanDisplayName(subscription.plan)} Plan
                  </CardTitle>
                  <CardDescription>
                    {subscription.current_period_end
                      ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                      : "Active subscription"}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={openPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Manage Subscription
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            {subscription.cancel_at_period_end && (
              <CardContent>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription will be canceled at the end of the current
                    billing period.
                  </AlertDescription>
                </Alert>
              </CardContent>
            )}
          </Card>
        )}

        {/* Credit Usage */}
        {credits?.has_credits && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Credit Usage</CardTitle>
              </div>
              <CardDescription>
                Credits are used for AI operations like content generation and
                computer use
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    Credits Used
                  </span>
                  <span className="text-sm font-medium">
                    {credits.credits_used.toLocaleString()} /{" "}
                    {credits.monthly_allocation.toLocaleString()}
                  </span>
                </div>
                <Progress
                  value={
                    (credits.credits_used / credits.monthly_allocation) * 100
                  }
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {credits.credits_remaining.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {credits.credits_purchased.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Purchased</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-500">
                    {credits.overage_credits.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Overage</p>
                </div>
              </div>

              {credits.overage_credits > 0 && (
                <Alert>
                  <AlertDescription>
                    You have used {credits.overage_credits.toLocaleString()}{" "}
                    overage credits this period. These will be billed at $0.01
                    per credit.
                  </AlertDescription>
                </Alert>
              )}

              {credits.next_reset && (
                <p className="text-sm text-muted-foreground text-center">
                  Credits reset on{" "}
                  {new Date(credits.next_reset).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Feature Usage */}
        {usage?.usage && Object.keys(usage.usage).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Feature Usage</CardTitle>
              <CardDescription>
                Your usage for the current billing period
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(usage.usage).map(([feature, data]) => (
                <div key={feature}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground capitalize">
                      {feature.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm font-medium">
                      {data.used}
                      {!data.unlimited && data.limit !== null
                        ? ` / ${data.limit}`
                        : ""}
                      {data.unlimited && " (Unlimited)"}
                    </span>
                  </div>
                  {!data.unlimited && data.limit !== null && (
                    <Progress
                      value={data.percentage}
                      className={`h-2 ${data.percentage > 90 ? "[&>div]:bg-orange-500" : ""}`}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upgrade prompt for lower plans */}
        {subscription?.has_subscription && subscription.plan !== "ultimate" && (
          <Card className="mt-6 border-dashed">
            <CardHeader>
              <CardTitle>Need More?</CardTitle>
              <CardDescription>
                Upgrade your plan for higher limits and more features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/pricing")}
              >
                View Plans
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <>
          <DashboardHeader />
          <div className="container mx-auto py-8 px-4 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
