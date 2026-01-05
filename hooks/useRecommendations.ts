import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { getApiUrl } from "@/lib/config";

const API_BASE_URL = typeof window !== 'undefined'
  ? getApiUrl('backend')
  : (process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || "http://localhost:8002");

// =============================================================================
// Types
// =============================================================================

export interface CandidatePost {
  url: string;
  author: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  hours_ago: number;
  author_followers?: number;
}

export interface Recommendation {
  id: number;  // PostRecommendation.id for tracking
  post: CandidatePost;
  score: number;
  reason: string;
  position: number;
}

export interface ReasonOption {
  id: string;
  label: string;
  category: "positive" | "negative";
}

export interface PreferenceSignal {
  value: string;
  score: number;
  confidence: number;
  positive: number;
  negative: number;
  success_rate: number | null;
}

export interface PreferenceProfile {
  text: string | null;
  version: number | null;
  training_samples: number;
  last_trained: string | null;
}

export interface FeedbackStats {
  total_feedbacks: number;
  yes_count: number;
  no_count: number;
  engagement_rate: number;
  top_reasons: [string, number][];
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Get reason options for the feedback UI.
 * Call this when user makes a yes/no decision.
 */
export function useReasonOptions(decision: "yes" | "no" | null) {
  const { getToken } = useAuth();

  return useSWR<{ options: ReasonOption[] }>(
    decision ? `${API_BASE_URL}/api/recommendations/reasons?decision=${decision}` : null,
    async (url: string) => {
      const token = await getToken();
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch reason options");
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
    }
  );
}

/**
 * Get user's learned preferences summary.
 */
export function usePreferenceSummary() {
  const { getToken } = useAuth();

  return useSWR<{
    signals: Record<string, PreferenceSignal[]>;
    profile: PreferenceProfile;
  }>(
    `${API_BASE_URL}/api/recommendations/preferences`,
    async (url: string) => {
      const token = await getToken();
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch preferences");
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
      refreshInterval: 60000,  // Refresh every minute
    }
  );
}

/**
 * Get training statistics.
 */
export function useTrainingStats() {
  const { getToken } = useAuth();

  return useSWR<{
    training: any;
    feedback: FeedbackStats;
  }>(
    `${API_BASE_URL}/api/recommendations/stats`,
    async (url: string) => {
      const token = await getToken();
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      return response.json();
    },
    {
      revalidateOnFocus: false,
    }
  );
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Get recommendations for a batch of candidate posts.
 */
export async function getRecommendations(
  candidates: CandidatePost[],
  limit: number,
  token: string,
  xAccountId?: number
): Promise<{ batch_id: string; recommendations: Recommendation[] }> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      candidates,
      limit,
      x_account_id: xAccountId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get recommendations");
  }

  return response.json();
}

/**
 * Record user's structured feedback (decision + reasons).
 */
export async function recordFeedback(
  recommendationId: number,
  decision: "yes" | "no",
  selectedReasons: string[],
  token: string,
  otherReason?: string,
  timeToDecideMs?: number
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      recommendation_id: recommendationId,
      decision,
      selected_reasons: selectedReasons,
      other_reason: otherReason,
      time_to_decide_ms: timeToDecideMs || 0,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to record feedback");
  }

  return response.json();
}

/**
 * Record that user engaged with a post.
 */
export async function recordEngagement(
  recommendationId: number,
  engagementType: "liked" | "commented" | "quoted" | "retweeted",
  token: string,
  commentUrl?: string,
  engagementContent?: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/engage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      recommendation_id: recommendationId,
      engagement_type: engagementType,
      comment_url: commentUrl,
      engagement_content: engagementContent,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to record engagement");
  }

  return response.json();
}

/**
 * Record engagement outcome (likes/replies on our comment).
 */
export async function recordOutcome(
  recommendationId: number,
  outcomeLikes: number,
  outcomeReplies: number,
  outcomeRetweets: number,
  token: string
): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/outcome`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      recommendation_id: recommendationId,
      outcome_likes: outcomeLikes,
      outcome_replies: outcomeReplies,
      outcome_retweets: outcomeRetweets,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to record outcome");
  }

  return response.json();
}

/**
 * Trigger manual model training.
 */
export async function triggerTraining(token: string): Promise<{
  success: boolean;
  profile?: string;
  message?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/recommendations/train`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to trigger training");
  }

  return response.json();
}

/**
 * Fetch real posts from the Following timeline.
 * Requires an active VNC browser session.
 */
export async function getTimelinePosts(
  token: string,
  maxPosts: number = 30,
  minEngagement: number = 10,
  maxHoursAgo: number = 48
): Promise<{
  success: boolean;
  posts: CandidatePost[];
  count: number;
  source: string;
}> {
  const params = new URLSearchParams({
    max_posts: maxPosts.toString(),
    min_engagement: minEngagement.toString(),
    max_hours_ago: maxHoursAgo.toString(),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/recommendations/timeline?${params}`,
    {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to fetch timeline" }));
    throw new Error(error.detail || "Failed to fetch timeline posts");
  }

  return response.json();
}

/**
 * Contextual reason from LLM.
 */
export interface ContextualReason {
  id: string;
  label: string;
  isContextual: boolean;
}

/**
 * Get LLM-generated contextual reasons for a specific post + decision.
 * Returns both contextual (post-specific) and general (static) reasons.
 */
export async function getContextualReasons(
  post: CandidatePost,
  decision: "yes" | "no",
  token: string
): Promise<ContextualReason[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/recommendations/reasons/contextual`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ post, decision }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to get contextual reasons");
  }

  const data = await response.json();
  return data.reasons || [];
}
