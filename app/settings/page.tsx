"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePreferences, updatePreferences } from "@/hooks/usePreferences";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Settings, Zap, Bot, Shield, Loader2, CheckCircle, Info, CreditCard } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { data, error, mutate, isLoading } = usePreferences();
  const preferences = data?.preferences;

  const [autoPostEnabled, setAutoPostEnabled] = useState(false);
  const [aggressionLevel, setAggressionLevel] = useState<"conservative" | "moderate" | "aggressive">("moderate");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync local state with fetched data
  useEffect(() => {
    if (preferences) {
      setAutoPostEnabled(preferences.auto_post_enabled);
      setAggressionLevel(preferences.aggression_level);
    }
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await updatePreferences(
        {
          auto_post_enabled: autoPostEnabled,
          aggression_level: aggressionLevel,
        },
        token
      );

      // Refresh preferences
      await mutate();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
      alert("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const getAggressionDescription = (level: string) => {
    switch (level) {
      case "conservative":
        return "50 likes, 20 comments, 5 posts per day. Safe for new accounts.";
      case "moderate":
        return "100 likes, 50 comments, 10 posts per day. Balanced growth.";
      case "aggressive":
        return "150 likes, 100 comments, 15 posts per day. Maximum growth.";
      default:
        return "";
    }
  };

  const hasChanges =
    preferences &&
    (autoPostEnabled !== preferences.auto_post_enabled ||
      aggressionLevel !== preferences.aggression_level);

  return (
    <>
      <DashboardHeader />
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Configure your agent behavior and automation preferences
            </p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load preferences. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Billing Link */}
        <Link href="/settings/billing">
          <Card className="mb-6 hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <CardTitle>Billing & Subscription</CardTitle>
                </div>
                <span className="text-muted-foreground">→</span>
              </div>
              <CardDescription>
                Manage your subscription, view usage, and update payment methods
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Settings Cards */}
        {preferences && (
          <div className="space-y-6">
            {/* Auto-Post Setting */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle>Auto-Post Content</CardTitle>
                </div>
                <CardDescription>
                  Control whether AI-generated content is posted automatically or
                  queued for your approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="auto-post" className="text-base">
                      Enable Auto-Posting
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {autoPostEnabled
                        ? "Content will be posted automatically when scheduled"
                        : "Content will be queued for your review before posting"}
                    </p>
                  </div>
                  <Switch
                    id="auto-post"
                    checked={autoPostEnabled}
                    onCheckedChange={setAutoPostEnabled}
                  />
                </div>
                {autoPostEnabled && (
                  <Alert className="mt-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      With auto-posting enabled, the agent will publish content
                      directly to your X account without requiring approval.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Engagement Level Setting */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle>Engagement Level</CardTitle>
                </div>
                <CardDescription>
                  Adjust how aggressively the agent engages on your behalf. Higher
                  levels mean more actions per day.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aggression">Engagement Level</Label>
                  <Select
                    value={aggressionLevel}
                    onValueChange={(value) =>
                      setAggressionLevel(value as "conservative" | "moderate" | "aggressive")
                    }
                  >
                    <SelectTrigger id="aggression" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          <span>Conservative</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="moderate">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span>Moderate</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="aggressive">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-red-500" />
                          <span>Aggressive</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {getAggressionDescription(aggressionLevel)}
                  </p>
                </div>

                {aggressionLevel === "aggressive" && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Aggressive mode increases account activity significantly. The
                      agent uses randomized delays and session breaks to avoid
                      detection, but monitor your account health closely.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Settings saved!</span>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
