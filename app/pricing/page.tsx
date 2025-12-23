"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { Check, X, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createCheckout, getPlans, Plan } from "@/lib/api/billing";
import { useSubscription } from "@/hooks/useSubscription";

export default function PricingPage() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { data: subscription } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlans()
      .then((data) => setPlans(data.plans))
      .catch((err) => console.error("Failed to load plans:", err));
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }

    setLoading(planId);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const { checkout_url } = await createCheckout(
        token,
        planId,
        `${window.location.origin}/settings/billing?success=true`,
        `${window.location.origin}/pricing`
      );

      window.location.href = checkout_url;
    } catch (err) {
      console.error("Failed to create checkout:", err);
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setLoading(null);
    }
  };

  const currentPlan = subscription?.plan || "free";
  const hasActiveSubscription = subscription?.has_subscription;

  // Feature lists for each plan
  const planFeatures: Record<string, { included: string[]; notIncluded: string[] }> = {
    starter: {
      included: [
        "5 X Growth Agent sessions/month",
        "20 AI content generations/month",
        "10 scheduled posts/month",
        "Basic analytics (3-day history)",
        "500 credits/month",
        "Email support",
      ],
      notIncluded: ["Ads Agent", "CRM & Unified Inbox", "AI image generation"],
    },
    pro: {
      included: [
        "15 X Growth Agent sessions/month",
        "100 AI content generations/month",
        "50 scheduled posts/month",
        "Basic analytics (7-day history)",
        "10 AI image generations/month",
        "2,000 credits/month",
        "Email support",
      ],
      notIncluded: ["Ads Agent", "CRM & Unified Inbox"],
    },
    pro_plus: {
      included: [
        "50 X Growth Agent sessions/month",
        "300 AI content generations/month",
        "Unlimited scheduled posts",
        "Advanced analytics (30-day history)",
        "10 ad campaigns/month",
        "50 AI image generations/month",
        "5,000 credits/month",
        "Priority email support",
      ],
      notIncluded: ["CRM & Unified Inbox"],
    },
    ultimate: {
      included: [
        "100 X Growth Agent sessions/month",
        "500 AI content generations/month",
        "Unlimited scheduled posts",
        "Full analytics (90-day + exports)",
        "50 ad campaigns/month",
        "200 AI image generations/month",
        "Full CRM & Unified Inbox",
        "10,000 credits/month",
        "Priority support",
      ],
      notIncluded: [],
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Grow Your Social Presence with AI
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your growth goals. All plans include our
            30-day money-back guarantee.
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const isPopular = plan.id === "pro_plus";
            const features = planFeatures[plan.id] || { included: [], notIncluded: [] };

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col ${
                  isPopular ? "border-primary shadow-lg scale-105 z-10" : ""
                } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && hasActiveSubscription && (
                  <Badge
                    variant="outline"
                    className="absolute -top-3 right-4 border-green-500 text-green-500"
                  >
                    Current Plan
                  </Badge>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  <Button
                    className="w-full mb-6"
                    variant={isPopular ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading === plan.id || isCurrentPlan}
                  >
                    {loading === plan.id
                      ? "Loading..."
                      : isCurrentPlan
                        ? "Current Plan"
                        : hasActiveSubscription
                          ? "Switch Plan"
                          : "Get Started"}
                  </Button>

                  <div className="space-y-3 flex-1">
                    {features.included.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {features.notIncluded.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <X className="h-5 w-5 shrink-0 mt-0.5" />
                        <span className="text-sm line-through">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Credits badge */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span>{plan.credits.toLocaleString()} credits/month</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Money-back guarantee */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5" />
            <span>
              All plans include a{" "}
              <span className="font-semibold text-foreground">
                30-day money-back guarantee
              </span>
              . No questions asked.
            </span>
          </div>
        </div>

        {/* FAQ or additional info */}
        <div className="max-w-2xl mx-auto mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Questions?</h2>
          <p className="text-muted-foreground">
            Need help choosing the right plan? Contact us at{" "}
            <a
              href="mailto:support@paralleluniverse.ai"
              className="text-primary hover:underline"
            >
              support@paralleluniverse.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
