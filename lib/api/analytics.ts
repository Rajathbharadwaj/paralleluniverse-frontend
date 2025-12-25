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
