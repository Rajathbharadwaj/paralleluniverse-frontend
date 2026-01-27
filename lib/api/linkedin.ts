/**
 * LinkedIn API client functions
 */

import { fetchBackendAuth } from '../api-client';

// Types
export interface LinkedInAccount {
  id: number;
  username: string | null;
  display_name: string | null;
  headline: string | null;
  profile_url: string | null;
  profile_image_url: string | null;
  connections_count: number | null;
  is_connected: boolean;
  last_synced_at: string | null;
  created_at: string | null;
}

export interface LinkedInWorkflow {
  id: string;
  name: string;
  description: string;
  version?: string;
  steps?: Array<{
    id: string;
    name: string;
    action: string;
    description?: string;
  }>;
  daily_limits?: {
    reactions?: number;
    comments?: number;
    connection_requests?: number;
    posts?: number;
  };
}

export interface LinkedInAnalytics {
  total_posts: number;
  total_comments: number;
  total_reactions_received: number;
  avg_reactions_per_post: number;
  posts_by_day: Array<{ date: string; count: number }>;
  comments_by_day: Array<{ date: string; count: number }>;
}

export interface LinkedInDailyLimits {
  limits: {
    reactions: number;
    comments: number;
    connection_requests: number;
    posts: number;
  };
  used_today: {
    reactions: number;
    comments: number;
    connection_requests: number;
    posts: number;
  };
  remaining: {
    reactions_remaining: number;
    comments_remaining: number;
    connection_requests_remaining: number;
    posts_remaining: number;
  };
}

// API Functions

/**
 * Get all connected LinkedIn accounts for the current user
 */
export async function fetchLinkedInAccounts(token: string): Promise<LinkedInAccount[]> {
  const response = await fetchBackendAuth('/api/linkedin/accounts', token);
  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn accounts');
  }
  const data = await response.json();
  return data.accounts || [];
}

/**
 * Get a specific LinkedIn account
 */
export async function fetchLinkedInAccount(accountId: number, token: string): Promise<LinkedInAccount> {
  const response = await fetchBackendAuth(`/api/linkedin/accounts/${accountId}`, token);
  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn account');
  }
  const data = await response.json();
  return data.account;
}

/**
 * Disconnect a LinkedIn account
 */
export async function disconnectLinkedInAccount(accountId: number, token: string): Promise<void> {
  const response = await fetchBackendAuth(`/api/linkedin/accounts/${accountId}`, token, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to disconnect LinkedIn account');
  }
}

/**
 * Get available LinkedIn workflows
 */
export async function fetchLinkedInWorkflows(token: string): Promise<LinkedInWorkflow[]> {
  const response = await fetchBackendAuth('/api/linkedin/workflows', token);
  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn workflows');
  }
  const data = await response.json();
  return data.workflows || [];
}

/**
 * Get a specific LinkedIn workflow
 */
export async function fetchLinkedInWorkflow(workflowId: string, token: string): Promise<LinkedInWorkflow> {
  const response = await fetchBackendAuth(`/api/linkedin/workflows/${workflowId}`, token);
  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn workflow');
  }
  const data = await response.json();
  return data.workflow;
}

/**
 * Run a LinkedIn workflow
 */
export async function runLinkedInWorkflow(
  workflowId: string,
  params: Record<string, any>,
  token: string
): Promise<{ success: boolean; message: string }> {
  const response = await fetchBackendAuth('/api/linkedin/workflows/run', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflow_id: workflowId, params }),
  });
  if (!response.ok) {
    throw new Error('Failed to run LinkedIn workflow');
  }
  return response.json();
}

/**
 * Get LinkedIn analytics
 */
export async function fetchLinkedInAnalytics(
  token: string,
  days: number = 30
): Promise<LinkedInAnalytics> {
  const response = await fetchBackendAuth(`/api/linkedin/analytics?days=${days}`, token);
  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn analytics');
  }
  const data = await response.json();
  return data.analytics;
}

/**
 * Get LinkedIn daily limits and usage
 */
export async function fetchLinkedInDailyLimits(token: string): Promise<LinkedInDailyLimits> {
  const response = await fetchBackendAuth('/api/linkedin/daily-limits', token);
  if (!response.ok) {
    throw new Error('Failed to fetch LinkedIn daily limits');
  }
  return response.json();
}

/**
 * Check LinkedIn connection status from extension backend
 */
export async function checkLinkedInConnectionStatus(
  userId: string
): Promise<{ connected: boolean; username: string | null }> {
  try {
    const response = await fetch(`/api/extension/linkedin/status/${userId}`);
    if (!response.ok) {
      return { connected: false, username: null };
    }
    const data = await response.json();
    return {
      connected: data.connected || false,
      username: data.username || null,
    };
  } catch {
    return { connected: false, username: null };
  }
}
