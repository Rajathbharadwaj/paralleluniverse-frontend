"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import { CardDeck } from "@/components/learning-engine/CardDeck";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  RefreshCw,
  Brain,
  TrendingUp,
  Target,
  Info,
  Loader2,
  Monitor,
  AlertCircle,
  Zap,
} from "lucide-react";
import {
  usePreferenceSummary,
  useTrainingStats,
  getRecommendations,
  getTimelinePosts,
  getContextualReasons,
  recordFeedback,
  triggerTraining,
  Recommendation,
  CandidatePost,
  ContextualReason,
} from "@/hooks/useRecommendations";

// LocalStorage key for tracking swiped posts
const SWIPED_POSTS_KEY = "learning_engine_swiped_posts";
const SWIPED_POSTS_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Get swiped post URLs from localStorage
function getSwipedPosts(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(SWIPED_POSTS_KEY);
    if (!stored) return new Set();
    const data = JSON.parse(stored);
    // Clean up old entries (older than 7 days)
    const now = Date.now();
    const validEntries = Object.entries(data).filter(
      ([_, timestamp]) => now - (timestamp as number) < SWIPED_POSTS_MAX_AGE
    );
    const cleaned = Object.fromEntries(validEntries);
    localStorage.setItem(SWIPED_POSTS_KEY, JSON.stringify(cleaned));
    return new Set(Object.keys(cleaned));
  } catch {
    return new Set();
  }
}

// Add swiped post URL to localStorage
function markPostAsSwiped(postUrl: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(SWIPED_POSTS_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data[postUrl] = Date.now();
    localStorage.setItem(SWIPED_POSTS_KEY, JSON.stringify(data));
  } catch {
    // Ignore localStorage errors
  }
}

export default function EngagePage() {
  const { getToken } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noSession, setNoSession] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [sessionTotal, setSessionTotal] = useState(0); // Track total for this session
  const swipedPostsRef = useRef<Set<string>>(new Set());

  // Background queue for pre-fetched posts
  const [queuedPosts, setQueuedPosts] = useState<Recommendation[]>([]);
  const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
  const backgroundFetchRef = useRef<boolean>(false);

  // Hooks for sidebar data
  const { data: prefData } = usePreferenceSummary();
  const { data: statsData, mutate: refreshStats } = useTrainingStats();

  // Load swiped posts from localStorage on mount
  useEffect(() => {
    swipedPostsRef.current = getSwipedPosts();
  }, []);

  // Load recommendations on mount
  useEffect(() => {
    loadRecommendations();
  }, []);

  // Background fetch when posts are getting low (3 or fewer remaining)
  useEffect(() => {
    const remainingPosts = recommendations.length - completedCount;
    if (
      remainingPosts <= 3 &&
      remainingPosts > 0 &&
      !isBackgroundFetching &&
      !backgroundFetchRef.current &&
      queuedPosts.length === 0
    ) {
      backgroundFetchRef.current = true;
      fetchMorePostsInBackground();
    }
  }, [completedCount, recommendations.length, isBackgroundFetching, queuedPosts.length]);

  // Background fetch function (silent, no loading states)
  const fetchMorePostsInBackground = async () => {
    setIsBackgroundFetching(true);
    try {
      const token = await getToken();
      if (!token) return;

      const alreadySwiped = getSwipedPosts();
      const timelineResult = await getTimelinePosts(token, 50, 10, 48);
      const candidates = timelineResult.posts;

      // Filter out already-swiped and currently displayed posts
      const currentUrls = new Set(recommendations.map(r => r.post.url));
      const freshCandidates = candidates.filter(
        (post) => !alreadySwiped.has(post.url) && !currentUrls.has(post.url)
      );

      if (freshCandidates.length > 0) {
        const result = await getRecommendations(freshCandidates, 10, token);
        setQueuedPosts(result.recommendations);
        console.log(`📦 Background fetched ${result.recommendations.length} posts`);
      }
    } catch (e) {
      console.error("Background fetch failed:", e);
    } finally {
      setIsBackgroundFetching(false);
      backgroundFetchRef.current = false;
    }
  };

  const loadRecommendations = async (useQueue = false) => {
    // If we have queued posts, use them immediately (no loading state)
    if (useQueue && queuedPosts.length > 0) {
      console.log(`📥 Using ${queuedPosts.length} queued posts`);
      setRecommendations(queuedPosts);
      setCompletedCount(0);
      setSessionTotal(queuedPosts.length);
      setQueuedPosts([]); // Clear queue
      setError(null);
      return;
    }

    setIsLoading(true);
    setIsScraping(true);
    setError(null);
    setNoSession(false);

    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // Load swiped posts from localStorage
      const alreadySwiped = getSwipedPosts();
      swipedPostsRef.current = alreadySwiped;

      // Step 1: Fetch real posts from Following timeline (fetch more to account for filtering)
      let candidates: CandidatePost[];
      try {
        const timelineResult = await getTimelinePosts(token, 50, 10, 48); // Fetch 50 to have buffer
        candidates = timelineResult.posts;
      } catch (e: any) {
        if (e.message?.includes("browser session") || e.message?.includes("VNC")) {
          setNoSession(true);
          setIsLoading(false);
          setIsScraping(false);
          return;
        }
        throw e;
      }

      setIsScraping(false);

      // Filter out already-swiped posts
      const freshCandidates = candidates.filter(
        (post) => !alreadySwiped.has(post.url)
      );

      if (freshCandidates.length === 0) {
        // All posts have been swiped - clear history and try again
        if (candidates.length > 0) {
          setError("You've seen all recent posts! Clear history or check back later for new content.");
        } else {
          setError("No posts found in your Following timeline. Try again later.");
        }
        setIsLoading(false);
        return;
      }

      // Step 2: Get recommendations (ranked by preference model)
      const result = await getRecommendations(freshCandidates, 15, token);
      setRecommendations(result.recommendations);
      setCompletedCount(0);
      setSessionTotal(result.recommendations.length); // Track session total
      setQueuedPosts([]); // Clear any stale queue
    } catch (e: any) {
      setError(e.message || "Failed to load recommendations");
    } finally {
      setIsLoading(false);
      setIsScraping(false);
    }
  };

  // Load more - prefer queued posts
  const loadMorePosts = () => {
    loadRecommendations(queuedPosts.length > 0);
  };

  const handleFeedback = useCallback(
    async (
      recommendationId: number,
      decision: "yes" | "no",
      selectedReasons: string[],
      otherReason?: string
    ) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      // Find the recommendation to get its URL
      const recommendation = recommendations.find((r) => r.id === recommendationId);
      if (recommendation?.post?.url) {
        // Mark this post as swiped in localStorage
        markPostAsSwiped(recommendation.post.url);
        swipedPostsRef.current.add(recommendation.post.url);
      }

      await recordFeedback(
        recommendationId,
        decision,
        selectedReasons,
        token,
        otherReason
      );

      setCompletedCount((prev) => prev + 1);
      refreshStats(); // Refresh stats after feedback
    },
    [getToken, refreshStats, recommendations]
  );

  const handleGetReasons = useCallback(
    async (
      recommendation: Recommendation,
      decision: "yes" | "no"
    ): Promise<ContextualReason[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return getContextualReasons(recommendation.post, decision, token);
    },
    [getToken]
  );

  const handleTrainModel = async () => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const result = await triggerTraining(token);
      if (result.success) {
        refreshStats();
      }
    } catch (e: any) {
      console.error("Training failed:", e);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-orange-500" />
              Learning Engine
            </h1>
            <p className="text-muted-foreground mt-2">
              Swipe to train your AI on posts you'd actually engage with
            </p>
          </div>
          <Button
            onClick={() => loadRecommendations()}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Info Alert */}
        <Alert className="mb-6 bg-gradient-to-r from-orange-500/10 via-pink-500/5 to-purple-500/10 border-orange-500/20">
          <Info className="h-4 w-4 text-orange-400" />
          <AlertTitle className="text-orange-200">Swipe to teach your AI</AlertTitle>
          <AlertDescription className="text-orange-200/70">
            <span className="text-green-400 font-medium">Swipe right</span> on posts you'd engage with,{" "}
            <span className="text-red-400 font-medium">swipe left</span> to pass.
            Tell us why and your AI learns your preferences.
          </AlertDescription>
        </Alert>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {error.includes("seen all") && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => {
                    localStorage.removeItem(SWIPED_POSTS_KEY);
                    swipedPostsRef.current = new Set();
                    setError(null);
                    loadRecommendations();
                  }}
                >
                  Clear History
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* No Browser Session State */}
        {noSession && (
          <Card className="mb-6 bg-amber-500/10 border-amber-500/20">
            <CardContent className="py-12 text-center">
              <Monitor className="w-20 h-20 mx-auto text-amber-400 mb-6" />
              <h3 className="text-2xl font-semibold text-amber-200 mb-3">
                Browser Session Required
              </h3>
              <p className="text-amber-200/70 mb-6 max-w-md mx-auto">
                The Learning Engine needs to scrape your X/Twitter Following timeline.
                Please start a browser session from the Dashboard first.
              </p>
              <Button
                onClick={() => (window.location.href = "/")}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {!noSession && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Card Deck */}
            <div className="lg:col-span-2">
              {/* Loading State */}
              {isLoading && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="py-20">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-16 h-16 text-orange-500 animate-spin mb-6" />
                      <p className="text-lg text-zinc-300">
                        {isScraping
                          ? "Scraping your Following timeline..."
                          : "Ranking posts by your preferences..."}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {isScraping
                          ? "This may take 20-30 seconds"
                          : "Almost there..."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Empty State */}
              {!isLoading && recommendations.length === 0 && !error && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardContent className="py-20">
                    <div className="flex flex-col items-center justify-center text-center">
                      <Sparkles className="w-16 h-16 text-zinc-600 mb-6" />
                      <p className="text-lg text-zinc-300 mb-2">
                        Ready to load posts
                      </p>
                      <p className="text-sm text-zinc-500 mb-6 max-w-sm">
                        We'll fetch real posts from your Following timeline
                        and rank them by engagement potential
                      </p>
                      <Button onClick={() => loadRecommendations()} size="lg">
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Load Timeline Posts
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Card Deck */}
              {!isLoading && recommendations.length > 0 && (
                <CardDeck
                  recommendations={recommendations}
                  onFeedback={handleFeedback}
                  onLoadMore={loadMorePosts}
                  onGetReasons={handleGetReasons}
                  completedCount={Math.min(completedCount, sessionTotal || recommendations.length)}
                  sessionTotal={sessionTotal || recommendations.length}
                  hasQueuedPosts={queuedPosts.length > 0}
                />
              )}
            </div>

            {/* Right: Stats Sidebar */}
            <div className="space-y-4">
              {/* Training Stats */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5 text-orange-400" />
                    Model Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {statsData?.training ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Training Samples</span>
                        <Badge variant="secondary">
                          {statsData.training.total_samples || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-400">Engagement Rate</span>
                        <Badge variant="secondary">
                          {((statsData.training.engagement_rate || 0) * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      {statsData.training.model?.version && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-zinc-400">Model Version</span>
                          <Badge
                            variant="outline"
                            className="border-orange-500/30 text-orange-300"
                          >
                            v{statsData.training.model.version}
                          </Badge>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-zinc-500">Loading stats...</p>
                  )}

                  <Button
                    onClick={handleTrainModel}
                    className="w-full mt-2"
                    variant="outline"
                    size="sm"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Update Model
                  </Button>
                </CardContent>
              </Card>

              {/* Progress Card */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-400" />
                    Session Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Reviewed</span>
                    <Badge variant="secondary">
                      {Math.min(completedCount, sessionTotal || recommendations.length)} / {sessionTotal || recommendations.length}
                    </Badge>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          (sessionTotal || recommendations.length) > 0
                            ? Math.min(100, (completedCount / (sessionTotal || recommendations.length)) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-zinc-500 hover:text-zinc-300"
                    onClick={() => {
                      localStorage.removeItem(SWIPED_POSTS_KEY);
                      swipedPostsRef.current = new Set();
                      loadRecommendations();
                    }}
                  >
                    Clear history & refresh
                  </Button>
                </CardContent>
              </Card>

              {/* Top Preferences */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                    Learned Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prefData?.signals?.author_preference?.slice(0, 5).map((signal) => (
                    <div
                      key={signal.value}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-300">@{signal.value}</span>
                      <Badge
                        variant={signal.score > 0.5 ? "default" : "secondary"}
                        className={
                          signal.score > 0.5 ? "bg-green-600" : "bg-zinc-700"
                        }
                      >
                        {(signal.score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-sm text-zinc-500">
                      Provide feedback to build preferences
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top Engagement Reasons */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    Top Reasons
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {statsData?.feedback?.top_reasons?.slice(0, 5).map(([reason, count]) => (
                    <div
                      key={reason}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-zinc-300 capitalize">
                        {reason.replace(/_/g, " ")}
                      </span>
                      <span className="text-zinc-500">{count}x</span>
                    </div>
                  )) || (
                    <p className="text-sm text-zinc-500">No feedback recorded yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
