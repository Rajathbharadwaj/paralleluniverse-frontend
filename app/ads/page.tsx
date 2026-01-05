"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { DeepAgentChat } from "@/components/deep-agent-chat";
import { AssetGallery } from "@/components/ads/AssetGallery";
import { CampaignList } from "@/components/ads/CampaignList";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Sparkles, ImageIcon, Target, Loader2, Link2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { useUser, useAuth } from "@clerk/nextjs";
import { fetchPlatforms, getOAuthUrl, disconnectPlatform, AdsPlatform } from "@/lib/api/ads";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Wrapper component that handles OAuth search params
function OAuthHandler({ onOAuthResult }: { onOAuthResult: (result: { type: "success" | "error"; message: string } | null) => void }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get("oauth_success");
    const error = searchParams.get("oauth_error");
    const platform = searchParams.get("platform");

    if (success === "true" && platform) {
      onOAuthResult({
        type: "success",
        message: `Successfully connected ${platform === "meta" ? "Meta Ads" : "Google Ads"}!`,
      });
      // Clear URL params after showing message
      window.history.replaceState({}, "", "/ads");
    } else if (error) {
      onOAuthResult({
        type: "error",
        message: decodeURIComponent(error),
      });
      window.history.replaceState({}, "", "/ads");
    }
  }, [searchParams, onOAuthResult]);

  return null;
}

export default function AdsPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("assistant");
  const [platforms, setPlatforms] = useState<AdsPlatform[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
  const [oauthMessage, setOauthMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [metaConfigured, setMetaConfigured] = useState(false);

  // Auto-dismiss OAuth message after 5 seconds
  useEffect(() => {
    if (oauthMessage) {
      const timer = setTimeout(() => setOauthMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [oauthMessage]);

  // Load connected platforms
  useEffect(() => {
    if (!user) return;

    const loadPlatforms = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const data = await fetchPlatforms(token);
        setPlatforms(data.platforms);
        setMetaConfigured(data.meta_configured);
      } catch (error) {
        console.error("Failed to load platforms:", error);
      } finally {
        setPlatformsLoading(false);
      }
    };

    loadPlatforms();
  }, [user, getToken]);

  // Connect to a platform via OAuth
  const handleConnectPlatform = async (platform: "meta" | "google") => {
    try {
      setConnectingPlatform(platform);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const { url } = await getOAuthUrl(platform, token);
      // Redirect to OAuth URL
      window.location.href = url;
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      setOauthMessage({
        type: "error",
        message: `Failed to connect ${platform === "meta" ? "Meta Ads" : "Google Ads"}: ${error instanceof Error ? error.message : "Unknown error"}`,
      });
      setConnectingPlatform(null);
    }
  };

  // Disconnect a platform
  const handleDisconnectPlatform = async (platformId: number) => {
    try {
      setDisconnectingId(platformId);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      await disconnectPlatform(platformId, token);
      setPlatforms((prev) => prev.filter((p) => p.id !== platformId));
      setOauthMessage({
        type: "success",
        message: "Platform disconnected successfully",
      });
    } catch (error) {
      console.error("Failed to disconnect platform:", error);
      setOauthMessage({
        type: "error",
        message: "Failed to disconnect platform",
      });
    } finally {
      setDisconnectingId(null);
    }
  };

  const connectedPlatforms = platforms.filter((p) => p.is_connected);

  // Callback for OAuth handler - needs to be stable reference
  const handleOAuthResult = (result: { type: "success" | "error"; message: string } | null) => {
    if (result) {
      setOauthMessage(result);
      // Reload platforms on successful connection
      if (result.type === "success" && user) {
        getToken().then(token => {
          if (token) {
            fetchPlatforms(token).then(data => {
              setPlatforms(data.platforms);
              setMetaConfigured(data.meta_configured);
            }).catch(console.error);
          }
        });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* OAuth callback handler */}
        <Suspense fallback={null}>
          <OAuthHandler onOAuthResult={handleOAuthResult} />
        </Suspense>

      {/* Page Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Megaphone className="h-8 w-8 text-primary" />
                Ads Manager
              </h1>
              <p className="text-muted-foreground mt-1">
                Create AI-powered ad campaigns with generated images
              </p>
            </div>

            {/* Connected Platforms & Connect Buttons */}
            <div className="flex items-center gap-2">
              {platformsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {/* Show connected platforms */}
                  {connectedPlatforms.map((p) => (
                    <Badge
                      key={p.id}
                      variant="secondary"
                      className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          p.platform === "meta" ? "bg-blue-500" : "bg-red-500"
                        }`}
                      />
                      {p.platform === "meta" ? "Meta" : "Google"} Connected
                      <button
                        onClick={() => handleDisconnectPlatform(p.id)}
                        disabled={disconnectingId === p.id}
                        className="ml-1 p-0.5 rounded hover:bg-destructive/20"
                        title="Disconnect"
                      >
                        {disconnectingId === p.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </button>
                    </Badge>
                  ))}

                  {/* Connect Meta button if not connected and configured */}
                  {metaConfigured && !connectedPlatforms.some((p) => p.platform === "meta") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConnectPlatform("meta")}
                      disabled={connectingPlatform === "meta"}
                      className="gap-1"
                    >
                      {connectingPlatform === "meta" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                      Connect Meta
                    </Button>
                  )}

                  {/* Show "No platforms" only if nothing is connected and nothing is configured */}
                  {connectedPlatforms.length === 0 && !metaConfigured && (
                    <Badge variant="outline" className="text-muted-foreground">
                      No platforms configured
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OAuth Message Alert */}
      {oauthMessage && (
        <div className="container mx-auto px-6 pt-4">
          <Alert variant={oauthMessage.type === "error" ? "destructive" : "default"}>
            {oauthMessage.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertDescription className="flex items-center justify-between">
              {oauthMessage.message}
              <button
                onClick={() => setOauthMessage(null)}
                className="ml-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-lg grid-cols-3 mb-8">
            <TabsTrigger value="assistant" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="assets" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              Brand Assets
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              <Target className="h-4 w-4" />
              Campaigns
            </TabsTrigger>
          </TabsList>

          {/* AI Assistant Tab */}
          <TabsContent value="assistant" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Tips Card */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Tips</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Create an Ad</p>
                    <p className="text-muted-foreground">
                      "Create a BOGO pizza ad for this weekend"
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Generate Images</p>
                    <p className="text-muted-foreground">
                      "Create an ad image for our holiday sale"
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Check Campaigns</p>
                    <p className="text-muted-foreground">
                      "Show me my active campaigns"
                    </p>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Upload Assets First</p>
                    <p className="text-muted-foreground">
                      Upload your logo and product photos in the Brand Assets tab for better AI
                      images.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="lg:col-span-3 h-[600px] overflow-hidden">
                <DeepAgentChat assistantId="ads_deep_agent" />
              </Card>
            </div>
          </TabsContent>

          {/* Brand Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Brand Assets</CardTitle>
                <CardDescription>
                  Upload your logo, product photos, and other brand assets. These will be used by
                  the AI to generate cohesive, branded ad images.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AssetGallery />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaigns</CardTitle>
                <CardDescription>
                  View and manage your ad campaigns across Meta and Google.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignList />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
