/**
 * Analytics API Client
 *
 * Handles fetching analytics data for the dashboard.
 */

const API_BASE_URL =
  typeof window !== "undefined"
    ? "/api/backend"
    : process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || "http://localhost:8002";

export interface AnalyticsSummary {
  total_likes: number;
  total_retweets: number;
  total_replies: number;
  total_posts: number;
  total_engagement: number;
  engagement_rate: number;
  period: string;
}

export interface EngagementDataPoint {
  date: string;
  likes: number;
  retweets: number;
  replies: number;
  posts: number;
}

export interface EngagementTimeline {
  data: EngagementDataPoint[];
  period: string;
}

export interface TopPost {
  id: number;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  engagement_score: number;
  posted_at: string | null;
  post_url: string | null;
}

export interface TopPostsResponse {
  posts: TopPost[];
}

export interface AgentActivity {
  total_actions: number;
  successful_actions: number;
  success_rate: number;
  by_type: Record<string, number>;
  period: string;
}

export interface AutomationPerformance {
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  success_rate: number;
  avg_duration_seconds: number;
  runs_by_day: { date: string; total: number; completed: number }[];
  period: string;
}

/**
 * Get analytics summary metrics
 */
export async function fetchAnalyticsSummary(
  token: string,
  period: string = "7d"
): Promise<AnalyticsSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/summary?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch analytics summary");
  }
  return response.json();
}

/**
 * Get engagement timeline data for charts
 */
export async function fetchEngagementTimeline(
  token: string,
  period: string = "7d"
): Promise<EngagementTimeline> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/engagement-timeline?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch engagement timeline");
  }
  return response.json();
}

/**
 * Get top performing posts
 */
export async function fetchTopPosts(
  token: string,
  limit: number = 10,
  sortBy: string = "engagement"
): Promise<TopPostsResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/top-posts?limit=${limit}&sort_by=${sortBy}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch top posts");
  }
  return response.json();
}

/**
 * Get agent activity breakdown
 */
export async function fetchAgentActivity(
  token: string,
  period: string = "7d"
): Promise<AgentActivity> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/agent-activity?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch agent activity");
  }
  return response.json();
}

/**
 * Get automation performance metrics
 */
export async function fetchAutomationPerformance(
  token: string,
  period: string = "30d"
): Promise<AutomationPerformance> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/automation-performance?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch automation performance");
  }
  return response.json();
}

// =============================================================================
// Comment Analytics Types & API Functions
// =============================================================================

/**
 * Summary of comments WE made on others' posts
 */
export interface CommentsMadeSummary {
  total_comments: number;
  total_likes: number;
  total_replies: number;
  avg_likes: number;
  avg_replies: number;
  comments_with_engagement: number;
  engagement_rate: number;
  period: string;
}

/**
 * A comment we made on someone else's post
 */
export interface CommentMade {
  id: number;
  content: string;
  comment_url: string | null;
  target_author: string | null;
  target_preview: string | null;
  likes: number;
  replies: number;
  retweets: number;
  total_engagement: number;
  commented_at: string | null;
  scrape_status: string;
}

/**
 * Response for top comments we made
 */
export interface TopCommentsMadeResponse {
  comments: CommentMade[];
  period: string;
}

/**
 * Timeline data point for comments we made
 */
export interface CommentsMadeTimelinePoint {
  date: string;
  comments: number;
  likes: number;
  replies: number;
}

/**
 * Timeline response for comments we made
 */
export interface CommentsMadeTimeline {
  timeline: CommentsMadeTimelinePoint[];
  period: string;
}

/**
 * Summary of comments OTHERS left on our posts
 */
export interface CommentsReceivedSummary {
  total_comments: number;
  unique_commenters: number;
  total_likes_on_comments: number;
  we_replied_count: number;
  reply_rate: number;
  period: string;
}

/**
 * A comment someone else left on our post
 */
export interface CommentReceived {
  id: number;
  commenter_username: string;
  commenter_display_name: string | null;
  content: string | null;
  comment_url: string | null;
  likes: number;
  replies: number;
  we_replied: boolean;
  our_reply_url: string | null;
  commented_at: string | null;
  created_at: string | null;
}

/**
 * Response for comments received list
 */
export interface CommentsReceivedListResponse {
  comments: CommentReceived[];
  total: number;
  offset: number;
  limit: number;
  period: string;
}

/**
 * Get summary stats for comments we made
 */
export async function fetchCommentsMadeSummary(
  token: string,
  period: string = "30d"
): Promise<CommentsMadeSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/comments/made/summary?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch comments made summary");
  }
  return response.json();
}

/**
 * Get top performing comments we made
 */
export async function fetchTopCommentsMade(
  token: string,
  limit: number = 10,
  period: string = "30d"
): Promise<TopCommentsMadeResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/comments/made/top?limit=${limit}&period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch top comments made");
  }
  return response.json();
}

/**
 * Get daily engagement timeline for comments we made
 */
export async function fetchCommentsMadeTimeline(
  token: string,
  period: string = "30d"
): Promise<CommentsMadeTimeline> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/comments/made/timeline?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch comments made timeline");
  }
  return response.json();
}

/**
 * Get summary stats for comments received on our posts
 */
export async function fetchCommentsReceivedSummary(
  token: string,
  period: string = "30d"
): Promise<CommentsReceivedSummary> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/comments/received/summary?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch comments received summary");
  }
  return response.json();
}

/**
 * Get list of comments received on our posts
 */
export async function fetchCommentsReceivedList(
  token: string,
  limit: number = 20,
  offset: number = 0,
  period: string = "30d"
): Promise<CommentsReceivedListResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/comments/received/list?limit=${limit}&offset=${offset}&period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch comments received list");
  }
  return response.json();
}

// =============================================================================
// Source Comparison Analytics (Agent vs Manual/Imported)
// =============================================================================

/**
 * Stats for a single source type
 */
export interface SourceStats {
  total: number;
  likes: number;
  replies: number;
  avg_engagement: number;
  retweets?: number; // Only for posts
}

/**
 * Comments broken down by source
 */
export interface CommentsBySourceResponse {
  agent: SourceStats;
  imported: SourceStats;
  period: string;
}

/**
 * Posts broken down by source
 */
export interface PostsBySourceResponse {
  agent: SourceStats;
  imported: SourceStats;
  period: string;
}

/**
 * Get comment analytics broken down by source (agent vs imported)
 */
export async function fetchCommentsBySource(
  token: string,
  period: string = "30d"
): Promise<CommentsBySourceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/comments/by-source?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch comments by source");
  }
  return response.json();
}

/**
 * Get post analytics broken down by source (agent vs imported)
 */
export async function fetchPostsBySource(
  token: string,
  period: string = "30d"
): Promise<PostsBySourceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/posts/by-source?period=${period}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch posts by source");
  }
  return response.json();
}

// =============================================================================
// Historical Data Import
// =============================================================================

export interface HistoricalImportResult {
  status: "success" | "error";
  posts?: {
    found: number;
    imported: number;
    skipped: number;
    errors: string[];
  };
  comments?: {
    found: number;
    imported: number;
    skipped: number;
    errors: string[];
  };
  detail?: string;
}

/**
 * Import historical posts and comments from user's X profile.
 * Requires an active browser session with X logged in.
 */
export async function importHistoricalData(
  token: string,
  maxPosts: number = 50,
  maxComments: number = 50
): Promise<HistoricalImportResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/historical/import?max_posts=${maxPosts}&max_comments=${maxComments}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}), // Empty body required for proxy
    }
  );
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Import failed" }));
    throw new Error(error.detail || "Failed to import historical data");
  }
  return response.json();
}
