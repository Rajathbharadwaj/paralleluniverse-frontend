"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { DashboardHeader } from "@/components/dashboard-header";
import { SocialGraphVisualization } from "@/components/social-graph-visualization";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, RefreshCw, Users, TrendingUp, AlertCircle, ChevronDown, MessageSquare, XCircle, RotateCcw, Search, BarChart3, Table2, ArrowUpDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchExtension, fetchBackend } from "@/lib/api-client";

export default function CompetitorsPage() {
  const { user } = useUser();
  const [graphData, setGraphData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [scrapingPosts, setScrapingPosts] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [analyzingInsights, setAnalyzingInsights] = useState(false);
  const [calculatingRelevancy, setCalculatingRelevancy] = useState(false);
  const [relevancyProgress, setRelevancyProgress] = useState<any>(null);
  const [resettingAnalysis, setResettingAnalysis] = useState(false);

  // Competitor view/filter state
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [searchText, setSearchText] = useState('');
  const [qualityThreshold, setQualityThreshold] = useState(0);
  const [sortBy, setSortBy] = useState<'quality' | 'relevancy' | 'overlap' | 'common'>('quality');
  const [scrapingFiltered, setScrapingFiltered] = useState(false);
  const [scrapingStartTime, setScrapingStartTime] = useState<number | null>(null);

  // Get username from localStorage or backend
  useEffect(() => {
    if (!user?.id) return;

    // Try localStorage first
    const cachedUsername = localStorage.getItem(`x_username_${user.id}`);
    if (cachedUsername) {
      setUsername(cachedUsername);
      return;
    }

    // Fallback to backend
    fetchExtension(`/get-username/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.username) {
          setUsername(data.username);
          localStorage.setItem(`x_username_${user.id}`, data.username);
        }
      })
      .catch((err) => console.error("Failed to get username:", err));
  }, [user?.id]);

  const fetchGraphData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/${user.id}`
      );
      const data = await res.json();

      if (data.success && data.graph) {
        setGraphData(data.graph);
        // Load relevancy progress if available
        if (data.graph.relevancy_analysis) {
          setRelevancyProgress(data.graph.relevancy_analysis);
        }
      }
    } catch (err) {
      console.error("Failed to load graph data:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Poll for progress while discovering OR scraping posts OR scraping filtered
  useEffect(() => {
    if ((!discovering && !scrapingPosts && !scrapingFiltered) || !user?.id) {
      setProgress(null);
      return;
    }

    const pollProgress = async () => {
      try {
        const res = await fetchBackend(`/api/social-graph/progress/${user.id}`);
        const data = await res.json();
        if (data.success && data.progress) {
          setProgress(data.progress);
        }
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      }
    };

    // Poll every 500ms
    const interval = setInterval(pollProgress, 500);
    return () => clearInterval(interval);
  }, [discovering, scrapingPosts, scrapingFiltered, user?.id]);

  const discoverCompetitors = async () => {
    if (!user?.id) return;

    setDiscovering(true);
    setError(null);

    try {
      // Smart discovery with auto-validation and fallback
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/smart-discover/${user.id}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        setGraphData(data.graph);

        // Show helpful message based on method used
        if (data.cached) {
          console.log(`Using cached data from ${data.age_days} days ago`);
        } else if (data.method === "optimized") {
          console.log("Used optimized discovery method");
        } else {
          console.log("Used standard discovery method");
        }
      } else {
        // Show actionable error based on action field
        if (data.action === "connect_extension") {
          setError("❌ " + data.error + "\n\n👉 Open x.com in your browser where the extension is installed.");
        } else if (data.action === "restart_services") {
          setError("❌ " + data.error + "\n\n👉 Run 'make restart' in terminal.");
        } else {
          setError(data.error || "Failed to discover competitors");
        }
      }
    } catch (err) {
      console.error("Discovery failed:", err);
      setError("Failed to discover competitors. Please check that all services are running.");
    } finally {
      setDiscovering(false);
    }
  };

  const discoverFromFollowers = async () => {
    if (!user?.id || !username) return;

    setDiscovering(true);
    setError(null);

    try {
      // Follower-based discovery - analyzes YOUR followers
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/discover-followers/${user.id}?user_handle=${username}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        setGraphData(data.graph);
        console.log(`Follower-based discovery complete: ${data.message}`);
      } else {
        if (data.action === "wait") {
          setError("⚠️ Another discovery is already running. Please wait for it to complete.");
        } else {
          setError(data.error || "Failed to discover competitors from followers");
        }
      }
    } catch (err) {
      console.error("Follower-based discovery failed:", err);
      setError("Failed to discover competitors. Please check that all services are running.");
    } finally {
      setDiscovering(false);
    }
  };

  const discoverNative = async () => {
    if (!user?.id || !username) return;

    setDiscovering(true);
    setError(null);

    try {
      // X Native discovery - uses X's "Followed by" feature (FASTEST!)
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/discover-native/${user.id}?user_handle=${username}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        setGraphData(data.graph);
        console.log(`X Native discovery complete: ${data.message}`);
      } else {
        if (data.action === "wait") {
          setError("⚠️ Another discovery is already running. Please wait for it to complete.");
        } else {
          setError(data.error || "Failed to run X Native discovery");
        }
      }
    } catch (err) {
      console.error("X Native discovery failed:", err);
      setError("Failed to discover competitors. Please check that all services are running.");
    } finally {
      setDiscovering(false);
    }
  };

  const refreshGraph = () => {
    fetchGraphData();
  };

  const scrapeAllPosts = async () => {
    if (!user?.id) return;

    setScrapingPosts(true);
    setError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8002';
      const res = await fetch(
        `${backendUrl}/api/social-graph/scrape-posts/${user.id}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        setGraphData(data.graph);
      } else {
        setError(data.error || "Failed to scrape posts");
      }
    } catch (err) {
      console.error("Post scraping failed:", err);
      setError("Failed to scrape posts. Please try again.");
    } finally {
      setScrapingPosts(false);
    }
  };

  const generateInsights = async () => {
    if (!user?.id) return;

    setAnalyzingInsights(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/insights/${user.id}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        setInsights(data.insights);
      } else {
        setError(data.error || "Failed to generate insights");
      }
    } catch (err) {
      console.error("Insights generation failed:", err);
      setError("Failed to generate insights. Please try again.");
    } finally {
      setAnalyzingInsights(false);
    }
  };

  const calculateRelevancy = async () => {
    if (!user?.id || !username) return;

    setCalculatingRelevancy(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/calculate-relevancy/${user.id}?user_handle=${username}&batch_size=20`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        setGraphData(data.graph);
        setRelevancyProgress(data.progress);
      } else {
        setError(data.error || "Failed to calculate relevancy scores");
      }
    } catch (err) {
      console.error("Relevancy calculation failed:", err);
      setError("Failed to calculate relevancy. Please try again.");
    } finally {
      setCalculatingRelevancy(false);
    }
  };

  const resetRelevancy = async () => {
    if (!user?.id) return;

    setResettingAnalysis(true);
    setError(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/reset-relevancy/${user.id}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        // Clear progress state
        setRelevancyProgress(null);
        // Optionally trigger immediate re-analysis
        await calculateRelevancy();
      } else {
        setError(data.error || "Failed to reset relevancy analysis");
      }
    } catch (err) {
      console.error("Reset failed:", err);
      setError("Failed to reset relevancy. Please try again.");
    } finally {
      setResettingAnalysis(false);
    }
  };

  const scrapeFilteredCompetitors = async (filteredUsernames: string[]) => {
    console.log("🔍 scrapeFilteredCompetitors called with:", {
      userId: user?.id,
      usernamesCount: filteredUsernames.length,
      usernames: filteredUsernames.slice(0, 5)
    });

    if (!user?.id) {
      console.error("❌ No user ID");
      return;
    }

    if (filteredUsernames.length === 0) {
      console.error("❌ No usernames to scrape");
      return;
    }

    console.log("✅ Starting scraping for", filteredUsernames.length, "users");
    setScrapingFiltered(true);
    setScrapingStartTime(Date.now());
    setError(null);

    try {
      // Create a minimal graph data with only the filtered competitors
      const filteredGraphData = {
        ...graphData,
        top_competitors: graphData.all_competitors_raw.filter((c: any) =>
          filteredUsernames.includes(c.username)
        )
      };

      const backendUrl = process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || 'http://localhost:8002';
      console.log("📡 Sending fetch request to:", `${backendUrl}/api/social-graph/scrape-posts/${user.id}`);
      console.log("📦 Request body:", { filtered_usernames: filteredUsernames });

      const res = await fetch(
        `${backendUrl}/api/social-graph/scrape-posts/${user.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filtered_usernames: filteredUsernames })
        }
      );

      console.log("✅ Response status:", res.status);
      const data = await res.json();
      console.log("📊 Response data:", data);

      if (data.success) {
        console.log("✅ Scraping successful, updating graph");
        setGraphData(data.graph);
        // Refresh to show updated posts
        setTimeout(() => {
          fetchGraphData();
        }, 1000);
      } else {
        console.error("❌ Scraping failed:", data.error);
        setError(data.error || "Failed to scrape filtered competitors");
      }
    } catch (err) {
      console.error("Filtered scraping failed:", err);
      setError("Failed to scrape competitors. Please try again.");
    } finally {
      setScrapingFiltered(false);
      setScrapingStartTime(null);
      setProgress(null);
    }
  };

  // Fetch cached insights on mount
  useEffect(() => {
    if (!user?.id) return;

    const fetchCachedInsights = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/insights/${user.id}`
        );
        const data = await res.json();

        if (data.success && data.insights) {
          setInsights(data.insights);
        }
      } catch (err) {
        console.error("Failed to fetch cached insights:", err);
      }
    };

    fetchCachedInsights();
  }, [user?.id]);

  const cancelDiscovery = async () => {
    if (!user?.id) return;

    setCancelling(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MAIN_BACKEND_URL}/api/social-graph/cancel/${user.id}`,
        { method: "POST" }
      );

      const data = await res.json();

      if (data.success) {
        // Wait a moment then refresh data to get partial results
        setTimeout(() => {
          fetchGraphData();
          setCancelling(false);
        }, 2000);
      }
    } catch (err) {
      console.error("Cancel failed:", err);
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Competitor Analysis</h1>
              <p className="text-muted-foreground mt-2">
                Discover and analyze competitors in your niche using social graph analysis
              </p>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              {/* Primary Action - Standard Discovery */}
              <Button
                onClick={discoverCompetitors}
                disabled={discovering}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {discovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <Network className="h-4 w-4 mr-2" />
                    Standard Discovery
                  </>
                )}
              </Button>

              {/* NEW: X Native Discovery - FASTEST METHOD */}
              <Button
                onClick={discoverNative}
                disabled={discovering || !username}
                size="lg"
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white font-semibold"
                title="FASTEST - Uses X's own 'Followed by' feature!"
              >
                {discovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    X Native Discovery ⚡⚡
                  </>
                )}
              </Button>

              {/* Follower-Based Discovery - BETTER METHOD */}
              <Button
                onClick={discoverFromFollowers}
                disabled={discovering || !username}
                size="lg"
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                title="Better quality - analyzes YOUR followers"
              >
                {discovering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Follower Discovery ⚡
                  </>
                )}
              </Button>

              {/* Stop Button - only show during discovery */}
              {discovering && (
                <Button
                  onClick={cancelDiscovery}
                  disabled={cancelling}
                  variant="destructive"
                >
                  {cancelling ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Stopping...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  )}
                </Button>
              )}

              {/* Secondary Actions - only show when we have data */}
              {graphData && (
                <>
                  <div className="h-6 w-px bg-border mx-2" />

                  <Button
                    onClick={refreshGraph}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>

                  <Button
                    onClick={scrapeAllPosts}
                    disabled={scrapingPosts}
                    variant="outline"
                    size="sm"
                  >
                    {scrapingPosts ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Scraping Posts...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Scrape Posts
                      </>
                    )}
                  </Button>

                  <div className="flex gap-2 items-center">
                    <Button
                      onClick={calculateRelevancy}
                      disabled={calculatingRelevancy || !username || resettingAnalysis}
                      variant="outline"
                      size="sm"
                      className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                    >
                      {calculatingRelevancy ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Calculating...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-4 w-4 mr-2" />
                          {relevancyProgress?.analyzed_count > 0 ? "Analyze More" : "Calculate Relevancy"}
                        </>
                      )}
                    </Button>

                    {relevancyProgress?.analyzed_count > 0 && (
                      <Button
                        onClick={resetRelevancy}
                        disabled={resettingAnalysis || calculatingRelevancy}
                        variant="outline"
                        size="sm"
                        className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                        title="Clear analysis state and re-analyze all competitors"
                      >
                        {resettingAnalysis ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reset & Re-analyze
                          </>
                        )}
                      </Button>
                    )}

                    {relevancyProgress && (
                      <span className="text-xs text-muted-foreground">
                        {relevancyProgress.analyzed_count}/{relevancyProgress.total_count} analyzed
                        {relevancyProgress.high_quality_count > 0 &&
                          ` · ${relevancyProgress.high_quality_count} high-quality`
                        }
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Helper Text */}
          {!graphData && !discovering && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">
                <strong>How it works:</strong> We analyze your X following to find accounts in your niche.
                The system automatically checks for cached data and uses the fastest method available.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                First run takes 3-5 minutes. Subsequent runs use cached data (updated weekly).
              </p>
            </div>
          )}

          {/* Discovery Progress */}
          {discovering && !scrapingPosts && (
            <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  <RefreshCw className="h-4 w-4 inline mr-2 animate-spin" />
                  {progress?.stage === "analyzing_accounts" && "Analyzing competitor accounts..."}
                  {progress?.stage === "analyzing_followers" && "Analyzing your followers..."}
                  {progress?.stage === "checking_profiles" && "Checking profiles for mutual connections..."}
                  {!progress && "Starting discovery..."}
                </p>
                {progress && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {progress.current}/{progress.total}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {progress && (
                <>
                  <div className="w-full bg-blue-500/20 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
                    {progress.stage === "analyzing_accounts" && `Analyzing @${progress.current_account}'s followers...`}
                    {progress.stage === "analyzing_followers" && `Checking @${progress.current_account}'s following overlap...`}
                    {progress.stage === "checking_profiles" && `Checking @${progress.current_account} for mutual connections...`}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Post Scraping Progress - Enhanced UI */}
          {scrapingPosts && (
            <div className="mt-4 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border-2 border-purple-500/30 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400 animate-pulse" />
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-purple-500 rounded-full animate-ping" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                      🚀 Scraping Competitor Posts
                    </p>
                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                      Extracting engagement data...
                    </p>
                  </div>
                </div>
                {progress && (
                  <div className="text-right">
                    <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                      {progress.current}/{progress.total}
                    </span>
                    <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                      {progress.posts_scraped || 0} posts scraped
                    </p>
                  </div>
                )}
              </div>

              {/* Animated Progress Bar */}
              {progress && (
                <>
                  <div className="w-full bg-purple-500/20 rounded-full h-3 mb-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                    </div>
                  </div>

                  {/* Current Account Being Scraped */}
                  <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-purple-300/30">
                    <RefreshCw className="h-4 w-4 text-purple-600 dark:text-purple-400 animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Scraping @{progress.current_account}
                      </p>
                      {progress.last_scraped_count > 0 && (
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                          ✅ Found {progress.last_scraped_count} posts with full engagement metrics
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-destructive">Error</p>
                <p className="text-sm text-destructive/90 whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {graphData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Discovery Method</CardDescription>
                <CardTitle className="text-lg">
                  {graphData.user_following_count > 0 ? "Standard Discovery" : "X Native Discovery"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {graphData.user_following_count > 0
                    ? `Analyzed ${graphData.user_following_count} accounts you follow`
                    : "Direct competitor analysis without following list"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>High Quality</CardDescription>
                <CardTitle className="text-3xl">
                  {graphData.high_quality_competitors || graphData.top_competitors?.length || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {graphData.config?.min_overlap_threshold || 40}%+ overlap matches
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Top Match</CardDescription>
                <CardTitle className="text-2xl">
                  {graphData.top_competitors?.[0]?.overlap_percentage}%
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  @{graphData.top_competitors?.[0]?.username}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Discovered</CardDescription>
                <CardTitle className="text-3xl">
                  {graphData.all_competitors_raw?.length || graphData.discovered_accounts || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Potential competitors</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Graph Visualization */}
        {graphData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Social Graph</CardTitle>
              <CardDescription>
                Visual representation of your competitor network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg overflow-hidden">
                <SocialGraphVisualization
                  graphData={graphData}
                  clusterData={insights?.clusters}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Competitors - NEW SICK UI */}
        {(graphData?.all_competitors_raw || graphData?.top_competitors) && (graphData.all_competitors_raw?.length > 0 || graphData.top_competitors?.length > 0) && (() => {
          // Get all competitors
          const allCompetitors = graphData.all_competitors_raw || graphData.top_competitors || [];

          // Filter competitors
          const filteredCompetitors = allCompetitors.filter((comp: any) => {
            // Search filter
            if (searchText && !comp.username.toLowerCase().includes(searchText.toLowerCase())) {
              return false;
            }
            // Quality threshold filter (only if quality_score exists)
            if (comp.quality_score !== undefined && comp.quality_score < qualityThreshold) {
              return false;
            }
            return true;
          });

          // Sort competitors
          const sortedCompetitors = [...filteredCompetitors].sort((a: any, b: any) => {
            switch (sortBy) {
              case 'quality':
                return (b.quality_score || 0) - (a.quality_score || 0);
              case 'relevancy':
                return (b.relevancy_score || 0) - (a.relevancy_score || 0);
              case 'overlap':
                return b.overlap_percentage - a.overlap_percentage;
              case 'common':
                return b.overlap_count - a.overlap_count;
              default:
                return 0;
            }
          });

          // Prepare chart data
          const chartData = sortedCompetitors.map((comp: any) => ({
            username: comp.username,
            overlap: comp.overlap_percentage,
            relevancy: comp.relevancy_score || 0,
            quality: comp.quality_score || 0,
            commonFollows: comp.overlap_count || 0,
          }));

          // Quality tier color function
          const getQualityColor = (quality: number) => {
            if (quality >= 60) return '#10b981'; // emerald-500
            if (quality >= 40) return '#eab308'; // yellow-500
            return '#94a3b8'; // slate-400
          };

          // Count competitors with/without posts
          const withPosts = sortedCompetitors.filter((c: any) => c.posts && c.posts.length > 0).length;
          const withoutPosts = sortedCompetitors.length - withPosts;

          return (
            <Card className="mt-8 bg-gradient-to-br from-slate-50/50 to-blue-50/50 dark:from-slate-900/50 dark:to-blue-900/20 border-2">
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="text-2xl">Competitors</CardTitle>
                    <CardDescription className="mt-2">
                      {sortedCompetitors.length} accounts in your niche
                      {withPosts > 0 && ` · ${withPosts} with posts`}
                      {withoutPosts > 0 && ` · ${withoutPosts} without posts`}
                    </CardDescription>
                  </div>
                  {withoutPosts > 0 && (
                    <Button
                      onClick={() => scrapeFilteredCompetitors(
                        sortedCompetitors
                          .filter((c: any) => !c.posts || c.posts.length === 0)
                          .map((c: any) => c.username)
                      )}
                      disabled={scrapingFiltered}
                      variant="outline"
                      className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                    >
                      {scrapingFiltered ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Scraping {withoutPosts}...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Scrape {withoutPosts} Missing Posts
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtered Scraping Progress */}
                {scrapingFiltered && progress && progress.stage === "scraping_posts" && (() => {
                  // Calculate ETA (like tqdm)
                  let etaText = "Calculating...";
                  let elapsedText = "0s";
                  let speedText = "0 it/s";

                  if (scrapingStartTime && progress.current > 0) {
                    const elapsedMs = Date.now() - scrapingStartTime;
                    const elapsedSec = elapsedMs / 1000;
                    const avgTimePerAccount = elapsedSec / progress.current;
                    const remaining = progress.total - progress.current;
                    const etaSeconds = remaining * avgTimePerAccount;
                    const speed = progress.current / elapsedSec;

                    // Format elapsed time
                    if (elapsedSec < 60) {
                      elapsedText = `${Math.floor(elapsedSec)}s`;
                    } else {
                      const mins = Math.floor(elapsedSec / 60);
                      const secs = Math.floor(elapsedSec % 60);
                      elapsedText = `${mins}m ${secs}s`;
                    }

                    // Format ETA
                    if (etaSeconds < 60) {
                      etaText = `${Math.ceil(etaSeconds)}s`;
                    } else {
                      const mins = Math.floor(etaSeconds / 60);
                      const secs = Math.ceil(etaSeconds % 60);
                      etaText = `${mins}m ${secs}s`;
                    }

                    // Format speed
                    speedText = `${speed.toFixed(2)} it/s`;
                  }

                  return (
                    <div className="mb-6 p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border-2 border-orange-500/30 shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400 animate-pulse" />
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-orange-500 rounded-full animate-ping" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-orange-700 dark:text-orange-300">
                              🚀 Scraping Filtered Competitors
                            </p>
                            <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                              {progress.posts_scraped || 0} completed · {speedText} · {elapsedText} elapsed
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {progress.current}/{progress.total}
                          </span>
                          <p className="text-xs text-orange-600/70 dark:text-orange-400/70 font-semibold">
                            ETA: {etaText}
                          </p>
                        </div>
                      </div>

                    {/* Animated Progress Bar */}
                    <div className="w-full bg-orange-500/20 rounded-full h-3 mb-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                      </div>
                    </div>

                    {/* Current Account Being Scraped */}
                    <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-black/20 rounded-lg border border-orange-300/30">
                      <RefreshCw className="h-4 w-4 text-orange-600 dark:text-orange-400 animate-spin" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          Scraping @{progress.current_account}
                        </p>
                        {progress.last_scraped_count > 0 && (
                          <p className="text-xs text-orange-600/70 dark:text-orange-400/70">
                            ✅ Found {progress.last_scraped_count} posts
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <div className="h-2 w-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="h-2 w-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="h-2 w-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Filter Controls */}
                <div className="mb-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg border space-y-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    {/* Search */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium mb-2 block">Search Username</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search @username..."
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                    </div>

                    {/* Quality Threshold Slider */}
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium mb-2 block">
                        Quality Threshold: {qualityThreshold}%+
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={qualityThreshold}
                        onChange={(e) => setQualityThreshold(Number(e.target.value))}
                        className="w-full h-2 bg-gradient-to-r from-slate-300 via-yellow-400 to-emerald-500 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    {/* Sort By */}
                    <div className="min-w-[150px]">
                      <label className="text-sm font-medium mb-2 block">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full px-3 py-2 bg-background border rounded-lg text-sm"
                      >
                        <option value="quality">Quality Score</option>
                        <option value="relevancy">Relevancy</option>
                        <option value="overlap">Overlap %</option>
                        <option value="common">Common Follows</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Tabs for Table/Chart View */}
                <Tabs defaultValue="table" className="w-full">
                  <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
                    <TabsTrigger value="table" className="flex items-center gap-2">
                      <Table2 className="h-4 w-4" />
                      Table View
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Chart View
                    </TabsTrigger>
                  </TabsList>

                  {/* TABLE VIEW */}
                  <TabsContent value="table" className="space-y-3">
                    {sortedCompetitors.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No competitors match your filters</p>
                      </div>
                    ) : (
                      sortedCompetitors.map((comp: any, i: number) => (
                        <details
                          key={comp.username}
                          className={`group p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                            comp.quality_score >= 60 ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' :
                            comp.quality_score >= 40 ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800' :
                            'bg-white/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <summary className="flex items-center justify-between cursor-pointer list-none">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold text-muted-foreground w-8">
                                #{i + 1}
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <a
                                    href={`https://x.com/${comp.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold hover:underline text-lg"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    @{comp.username}
                                  </a>
                                  {comp.posts && comp.posts.length > 0 ? (
                                    <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-700 dark:text-green-300">
                                      {comp.posts.length} posts
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-700 dark:text-red-300">
                                      No posts
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {comp.overlap_count} common follows
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {comp.quality_score !== undefined ? (
                                <>
                                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                                    comp.quality_score >= 70 ? 'bg-emerald-600 text-white' :
                                    comp.quality_score >= 60 ? 'bg-emerald-500 text-white' :
                                    comp.quality_score >= 50 ? 'bg-yellow-500 text-white' :
                                    comp.quality_score >= 40 ? 'bg-yellow-600 text-white' :
                                    'bg-slate-400 text-white'
                                  }`}>
                                    Quality {comp.quality_score}%
                                  </span>
                                  <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                    Relevancy {comp.relevancy_score}%
                                  </span>
                                  <span className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-500/20 text-purple-700 dark:text-purple-300">
                                    Overlap {comp.overlap_percentage}%
                                  </span>
                                </>
                              ) : (
                                <span className="px-3 py-1.5 rounded-lg text-sm font-bold bg-orange-500 text-white">
                                  {comp.overlap_percentage}% overlap
                                </span>
                              )}
                              <ChevronDown className="h-5 w-5 transition-transform group-open:rotate-180" />
                            </div>
                          </summary>

                          {/* Expanded Content - Recent Posts */}
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3">Recent Posts</h4>
                            {comp.posts && comp.posts.length > 0 ? (
                              <div className="space-y-3">
                                {comp.posts.slice(0, 10).map((post: any, idx: number) => (
                                  <div key={idx} className="p-3 bg-white/70 dark:bg-black/30 rounded-lg text-sm border">
                                    <p className="text-foreground mb-2">{post.text}</p>
                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                      <span>❤️ {post.likes || 0}</span>
                                      <span>🔁 {post.retweets || 0}</span>
                                      <span>💬 {post.replies || 0}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No posts scraped yet. Click "Scrape Posts" above to collect posts.
                              </p>
                            )}
                          </div>
                        </details>
                      ))
                    )}
                  </TabsContent>

                  {/* CHART VIEW */}
                  <TabsContent value="chart">
                    {sortedCompetitors.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-muted-foreground">No competitors match your filters</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Scatter Plot */}
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border">
                          <h3 className="text-lg font-semibold mb-4">Quality vs Relevancy Distribution</h3>
                          <ResponsiveContainer width="100%" height={500}>
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                              <XAxis
                                type="number"
                                dataKey="overlap"
                                name="Overlap %"
                                label={{ value: 'Overlap %', position: 'bottom', offset: 40 }}
                                domain={[0, 100]}
                              />
                              <YAxis
                                type="number"
                                dataKey="relevancy"
                                name="Relevancy %"
                                label={{ value: 'Relevancy %', angle: -90, position: 'left', offset: 40 }}
                                domain={[0, 100]}
                              />
                              <ZAxis type="number" dataKey="commonFollows" range={[50, 400]} name="Common Follows" />
                              <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border shadow-lg">
                                        <p className="font-bold text-lg mb-2">@{data.username}</p>
                                        <div className="space-y-1 text-sm">
                                          <p className="text-emerald-600 dark:text-emerald-400">Quality: {data.quality}%</p>
                                          <p className="text-blue-600 dark:text-blue-400">Relevancy: {data.relevancy}%</p>
                                          <p className="text-purple-600 dark:text-purple-400">Overlap: {data.overlap}%</p>
                                          <p className="text-slate-600 dark:text-slate-400">Common: {data.commonFollows}</p>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Scatter name="Competitors" data={chartData}>
                                {chartData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={getQualityColor(entry.quality)} />
                                ))}
                              </Scatter>
                            </ScatterChart>
                          </ResponsiveContainer>

                          {/* Legend */}
                          <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                              <span>High Quality (60%+)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                              <span>Medium Quality (40-60%)</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full bg-slate-400"></div>
                              <span>Low Quality (&lt;40%)</span>
                            </div>
                          </div>
                        </div>

                        {/* Chart Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">High Quality</p>
                            <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                              {sortedCompetitors.filter((c: any) => c.quality_score >= 60).length}
                            </p>
                          </div>
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Medium Quality</p>
                            <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-300">
                              {sortedCompetitors.filter((c: any) => c.quality_score >= 40 && c.quality_score < 60).length}
                            </p>
                          </div>
                          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Avg Relevancy</p>
                            <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                              {Math.round(sortedCompetitors.reduce((sum: number, c: any) => sum + (c.relevancy_score || 0), 0) / sortedCompetitors.length)}%
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Avg Overlap</p>
                            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                              {Math.round(sortedCompetitors.reduce((sum: number, c: any) => sum + c.overlap_percentage, 0) / sortedCompetitors.length)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          );
        })()}

        {/* Competitor Clusters Section */}
        {insights?.clusters && (
          <Card className="mt-8 border-2 border-gradient-to-r from-emerald-500/20 to-teal-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Competitor Landscape
              </CardTitle>
              <CardDescription>
                Competitors clustered by {(Object.values(insights.clusters.tiers)[0] as any)?.tier_type === 'followers' ? 'follower count' : 'engagement level'} and account type
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200/50">
                    <p className="text-sm text-muted-foreground">Total Competitors</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {insights.clusters.total_competitors}
                    </p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200/50">
                    <p className="text-sm text-muted-foreground">Tiers Found</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                      {Object.keys(insights.clusters.tiers).length}
                    </p>
                  </div>
                  {Object.values(insights.clusters.summary)[0] ? (
                    <>
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200/50">
                        <p className="text-sm text-muted-foreground">Largest Tier</p>
                        <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                          {Object.keys(insights.clusters.tiers)[0] || 'N/A'}
                        </p>
                      </div>
                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg border border-emerald-200/50">
                        <p className="text-sm text-muted-foreground">In Largest Tier</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                          {(Object.values(insights.clusters.summary)[0] as any)?.count || 0}
                        </p>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Tier Breakdown */}
                <div className="space-y-4">
                  {Object.entries(insights.clusters.tiers).map(([tier, data]: [string, any]) => (
                    <details key={tier} className="group p-4 bg-white dark:bg-black/20 rounded-lg border border-emerald-200/50 dark:border-emerald-800/30">
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{tier}</span>
                              <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium">
                                {data.count} accounts
                              </span>
                            </div>
                            <div className="mt-2 flex gap-6 text-sm text-muted-foreground">
                              <span>Avg: {data.avg_followers.toLocaleString()} followers</span>
                              <span>Avg engagement: {data.avg_engagement.toLocaleString()}</span>
                            </div>
                          </div>
                          <ChevronDown className="h-5 w-5 text-emerald-600 group-open:rotate-180 transition-transform" />
                        </div>
                      </summary>

                      <div className="mt-4 pt-4 border-t border-emerald-200/30 dark:border-emerald-800/30">
                        {/* Account Types */}
                        {data.account_types && Object.keys(data.account_types).length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Account Types:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(data.account_types)
                                .sort((a: any, b: any) => b[1] - a[1])
                                .map(([type, count]: [string, any]) => (
                                  <span key={type} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">
                                    {type} ({count})
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}

                        {/* Top Accounts */}
                        <div>
                          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Top Accounts:</p>
                          <div className="space-y-2">
                            {data.accounts.slice(0, 5).map((account: any) => (
                              <div key={account.username} className="flex items-center justify-between p-2 bg-emerald-50/50 dark:bg-emerald-950/10 rounded">
                                <div className="flex-1">
                                  <a
                                    href={`https://x.com/${account.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium hover:underline text-emerald-700 dark:text-emerald-300"
                                  >
                                    @{account.username}
                                  </a>
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    {account.account_type}
                                  </span>
                                </div>
                                <div className="text-right text-sm">
                                  {account.followers !== null && account.followers > 0 ? (
                                    <>
                                      <p className="font-medium">{account.followers.toLocaleString()} followers</p>
                                      <p className="text-xs text-muted-foreground">
                                        Avg: {account.avg_engagement.toLocaleString()} engagement
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="font-medium">{account.avg_engagement.toLocaleString()} avg engagement</p>
                                      <p className="text-xs text-muted-foreground">
                                        {account.post_count} posts analyzed
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Insights Section */}
        {graphData && (
          <Card className="mt-8 border-2 border-gradient-to-r from-cyan-500/20 to-blue-500/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-600" />
                    Content Insights & AI Suggestions
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis of competitor content to generate personalized post suggestions
                  </CardDescription>
                </div>
                <Button
                  onClick={generateInsights}
                  disabled={analyzingInsights}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  {analyzingInsights ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Analyze Content
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {analyzingInsights ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-12 w-12 mx-auto text-cyan-600 animate-spin mb-4" />
                  <p className="text-lg font-medium text-cyan-700 dark:text-cyan-300">
                    Analyzing competitor content...
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Extracting patterns, topics, and engagement strategies
                  </p>
                </div>
              ) : insights ? (
                <div className="space-y-6">
                  {/* Engagement Benchmarks */}
                  {insights.benchmarks && (
                    <div className="p-6 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 rounded-lg border border-cyan-200/50 dark:border-cyan-800/50">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-cyan-600" />
                        Engagement Benchmarks
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-3 bg-white/70 dark:bg-black/20 rounded border border-cyan-200/30">
                          <p className="text-sm text-muted-foreground">Posts Analyzed</p>
                          <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                            {insights.benchmarks.total_posts_analyzed}
                          </p>
                        </div>
                        <div className="p-3 bg-white/70 dark:bg-black/20 rounded border border-cyan-200/30">
                          <p className="text-sm text-muted-foreground">Avg Likes</p>
                          <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                            {Math.round(insights.benchmarks.average_likes)}
                          </p>
                        </div>
                        <div className="p-3 bg-white/70 dark:bg-black/20 rounded border border-cyan-200/30">
                          <p className="text-sm text-muted-foreground">Avg Views</p>
                          <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                            {(insights.benchmarks.average_views || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
                          </p>
                        </div>
                        <div className="p-3 bg-white/70 dark:bg-black/20 rounded border border-cyan-200/30">
                          <p className="text-sm text-muted-foreground">Top 10% Likes</p>
                          <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                            {Math.round(insights.benchmarks.top_10_percent_likes)}
                          </p>
                        </div>
                      </div>

                      {/* Engagement Goals */}
                      {insights.benchmarks.engagement_goal && (
                        <div className="mt-4 p-4 bg-white/70 dark:bg-black/20 rounded border border-cyan-200/30">
                          <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300 mb-2">Engagement Goals</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Beginner</p>
                              <p className="font-bold">{Math.round(insights.benchmarks.engagement_goal.beginner)} likes</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Intermediate</p>
                              <p className="font-bold">{Math.round(insights.benchmarks.engagement_goal.intermediate)} likes</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Advanced</p>
                              <p className="font-bold">{Math.round(insights.benchmarks.engagement_goal.advanced)} likes</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Expert</p>
                              <p className="font-bold">{Math.round(insights.benchmarks.engagement_goal.expert)} likes</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content Patterns */}
                  {insights.patterns && (
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600" />
                        Content Patterns
                      </h3>

                      {/* Topics */}
                      {insights.patterns.topics && insights.patterns.topics.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Top Topics</p>
                          <div className="flex flex-wrap gap-2">
                            {insights.patterns.topics.map((topic: string, i: number) => (
                              <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Insights */}
                      {insights.patterns.key_insights && insights.patterns.key_insights.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">Key Insights</p>
                          <ul className="space-y-2">
                            {insights.patterns.key_insights.map((insight: any, i: number) => {
                              const insightText = typeof insight === 'string'
                                ? insight
                                : insight?.insight || insight?.explanation || JSON.stringify(insight);
                              return (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <span className="text-blue-600 mt-0.5">•</span>
                                  <span>{insightText}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Content Suggestions */}
                  {insights.suggestions && insights.suggestions.length > 0 && (
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-lg border border-indigo-200/50 dark:border-indigo-800/50">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        AI-Generated Post Suggestions
                      </h3>

                      <div className="space-y-4">
                        {insights.suggestions.map((suggestion: any, i: number) => (
                          <div key={i} className="p-4 bg-white dark:bg-black/30 rounded-lg border border-indigo-200/50 dark:border-indigo-800/30">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <p className="font-medium text-indigo-700 dark:text-indigo-300 mb-2">
                                  Suggestion #{i + 1}
                                </p>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {suggestion.post_text}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">
                                {suggestion.engagement_type}
                              </span>
                            </div>
                            <div className="pt-3 border-t border-indigo-200/30 dark:border-indigo-800/30">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold">Why it works:</span> {suggestion.reasoning}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  {insights.analyzed_at && (
                    <p className="text-xs text-muted-foreground text-center">
                      Last analyzed: {new Date(insights.analyzed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">
                    No insights generated yet
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click "Analyze Content" above to generate AI-powered insights from competitor posts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
