/**
 * SWR hooks for Work Integrations API
 *
 * Provides data fetching and mutation for:
 * - Integrations (list, create, update, delete)
 * - Activities (list with filters)
 * - Drafts (list, approve, reject)
 * - Stats (overview and per-integration)
 */

import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://backend-websocket-server-644185288504.us-central1.run.app";

// =============================================================================
// Types
// =============================================================================

export type WorkPlatform = "github" | "slack" | "notion" | "linear" | "figma";
export type DraftStatus = "pending" | "approved" | "edited" | "rejected" | "expired" | "scheduled" | "posted";
export type ActivityCategory = "code_shipped" | "progress" | "collaboration";

export interface WorkIntegration {
  id: number;
  user_id: string;
  platform: WorkPlatform;
  external_account_id?: string;
  external_account_name?: string;
  is_connected: boolean;
  is_active: boolean;
  connection_error?: string;
  webhook_registered: boolean;
  github_repos: string[];
  github_org?: string;
  slack_channels: string[];
  notion_database_ids: string[];
  linear_team_id?: string;
  figma_project_ids: string[];
  capture_commits: boolean;
  capture_prs: boolean;
  capture_releases: boolean;
  capture_issues: boolean;
  capture_comments: boolean;
  created_at: string;
  last_synced_at?: string;
  last_activity_at?: string;
}

export interface WorkActivity {
  id: number;
  integration_id: number;
  platform: WorkPlatform;
  external_id?: string;
  activity_type: string;
  category: ActivityCategory;
  title: string;
  description?: string;
  url?: string;
  repo_or_project?: string;
  lines_added: number;
  lines_removed: number;
  files_changed: number;
  comments_count: number;
  reactions_count: number;
  significance_score: number;
  processed: boolean;
  draft_id?: number;
  activity_at: string;
  created_at: string;
}

export interface ActivityDraft {
  id: number;
  user_id: string;
  x_account_id: number;
  content: string;
  ai_rationale?: string;
  source_activity_ids: number[];
  activity_summary?: string;
  digest_date: string;
  digest_theme?: string;
  status: DraftStatus;
  user_edited_content?: string;
  scheduled_post_id?: number;
  scheduled_at?: string;
  posted_at?: string;
  expires_at?: string;
  feedback_rating?: number;
  feedback_text?: string;
  created_at: string;
  updated_at: string;
  reviewed_at?: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description?: string;
  html_url: string;
  default_branch: string;
}

export interface IntegrationStats {
  integration_id: number;
  platform: WorkPlatform;
  total_activities: number;
  activities_today: number;
  activities_this_week: number;
  last_activity_at?: string;
  drafts_generated: number;
  drafts_approved: number;
}

export interface WorkIntegrationsOverview {
  total_integrations: number;
  active_integrations: number;
  total_activities_captured: number;
  pending_drafts: number;
  drafts_approved_this_month: number;
  platforms_connected: WorkPlatform[];
}

// =============================================================================
// Fetcher
// =============================================================================

async function fetchWithAuth(url: string, token: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.detail || error.message || "Request failed");
  }

  return response.json();
}

// =============================================================================
// Hooks - Integrations
// =============================================================================

export function useWorkIntegrations() {
  const { getToken } = useAuth();

  return useSWR<{ integrations: WorkIntegration[]; total: number }>(
    "work-integrations",
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(`${API_URL}/api/work-integrations`, token);
    },
    {
      revalidateOnFocus: false,
    }
  );
}

export function useWorkIntegration(integrationId: number | null) {
  const { getToken } = useAuth();

  return useSWR<WorkIntegration>(
    integrationId ? `work-integration-${integrationId}` : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(`${API_URL}/api/work-integrations/${integrationId}`, token);
    }
  );
}

export function useConnectIntegration() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "connect-integration",
    async (_key: string, { arg }: { arg: { platform: WorkPlatform } }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const data = await fetchWithAuth(
        `${API_URL}/api/work-integrations/oauth/${arg.platform}/url`,
        token
      );

      // Redirect to OAuth URL
      window.location.href = data.url;
      return data;
    }
  );
}

export function useUpdateIntegrationSettings() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "update-integration-settings",
    async (
      _key: string,
      { arg }: { arg: { integrationId: number; settings: Partial<WorkIntegration> } }
    ) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${arg.integrationId}/settings`,
        token,
        {
          method: "PUT",
          body: JSON.stringify(arg.settings),
        }
      );
    }
  );
}

export function useDeleteIntegration() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "delete-integration",
    async (_key: string, { arg }: { arg: { integrationId: number } }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${arg.integrationId}`,
        token,
        { method: "DELETE" }
      );
    }
  );
}

export function usePauseIntegration() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "pause-integration",
    async (_key: string, { arg }: { arg: { integrationId: number } }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${arg.integrationId}/pause`,
        token,
        { method: "POST" }
      );
    }
  );
}

export function useResumeIntegration() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "resume-integration",
    async (_key: string, { arg }: { arg: { integrationId: number } }) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${arg.integrationId}/resume`,
        token,
        { method: "POST" }
      );
    }
  );
}

// =============================================================================
// Hooks - GitHub Specific
// =============================================================================

export function useGitHubRepos(integrationId: number | null) {
  const { getToken } = useAuth();

  return useSWR<{ repos: GitHubRepo[]; total: number }>(
    integrationId ? `github-repos-${integrationId}` : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${integrationId}/github/repos`,
        token
      );
    }
  );
}

export function useSetupGitHubWebhook() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "setup-github-webhook",
    async (
      _key: string,
      { arg }: { arg: { integrationId: number; repoFullName: string } }
    ) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${arg.integrationId}/github/webhook?repo_full_name=${encodeURIComponent(arg.repoFullName)}`,
        token,
        { method: "POST" }
      );
    }
  );
}

// =============================================================================
// Hooks - Slack Specific
// =============================================================================

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  num_members: number;
}

export function useSlackChannels(integrationId: number | null) {
  const { getToken } = useAuth();

  return useSWR<{ channels: SlackChannel[]; total: number }>(
    integrationId ? `slack-channels-${integrationId}` : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${integrationId}/slack/channels`,
        token
      );
    }
  );
}

// =============================================================================
// Hooks - Linear Specific
// =============================================================================

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
  description?: string;
}

export function useLinearTeams(integrationId: number | null) {
  const { getToken } = useAuth();

  return useSWR<{ teams: LinearTeam[]; total: number }>(
    integrationId ? `linear-teams-${integrationId}` : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${integrationId}/linear/teams`,
        token
      );
    }
  );
}

export function useSetupLinearWebhook() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "setup-linear-webhook",
    async (
      _key: string,
      { arg }: { arg: { integrationId: number; teamId?: string } }
    ) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const url = arg.teamId
        ? `${API_URL}/api/work-integrations/${arg.integrationId}/linear/webhook?team_id=${encodeURIComponent(arg.teamId)}`
        : `${API_URL}/api/work-integrations/${arg.integrationId}/linear/webhook`;

      return fetchWithAuth(url, token, { method: "POST" });
    }
  );
}

// =============================================================================
// Hooks - Notion Specific
// =============================================================================

export interface NotionDatabase {
  id: string;
  title: string;
  url?: string;
  icon?: string;
}

export function useNotionDatabases(integrationId: number | null) {
  const { getToken } = useAuth();

  return useSWR<{ databases: NotionDatabase[]; total: number }>(
    integrationId ? `notion-databases-${integrationId}` : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${integrationId}/notion/databases`,
        token
      );
    }
  );
}

// =============================================================================
// Hooks - Figma Specific
// =============================================================================

export interface FigmaProject {
  id: string;
  name: string;
}

export function useFigmaProjects(integrationId: number | null, teamId: string | null) {
  const { getToken } = useAuth();

  return useSWR<{ projects: FigmaProject[]; total: number }>(
    integrationId && teamId ? `figma-projects-${integrationId}-${teamId}` : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(
        `${API_URL}/api/work-integrations/${integrationId}/figma/projects?team_id=${encodeURIComponent(teamId!)}`,
        token
      );
    }
  );
}

// =============================================================================
// Hooks - Activities
// =============================================================================

export interface ActivityFilters {
  platform?: WorkPlatform;
  category?: ActivityCategory;
  processed?: boolean;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export function useWorkActivities(filters?: ActivityFilters) {
  const { getToken } = useAuth();

  const params = new URLSearchParams();
  if (filters?.platform) params.set("platform", filters.platform);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.processed !== undefined) params.set("processed", String(filters.processed));
  if (filters?.start_date) params.set("start_date", filters.start_date);
  if (filters?.end_date) params.set("end_date", filters.end_date);
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.page_size) params.set("page_size", String(filters.page_size));

  const queryString = params.toString();

  return useSWR<{ activities: WorkActivity[]; total: number; page: number; page_size: number }>(
    `work-activities-${queryString}`,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(
        `${API_URL}/api/work-integrations/activities${queryString ? `?${queryString}` : ""}`,
        token
      );
    },
    {
      revalidateOnFocus: false,
    }
  );
}

// =============================================================================
// Hooks - Drafts
// =============================================================================

export function useActivityDrafts(status?: DraftStatus) {
  const { getToken } = useAuth();

  return useSWR<{ drafts: ActivityDraft[]; total: number; pending_count: number }>(
    `activity-drafts-${status || "all"}`,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const url = status
        ? `${API_URL}/api/work-integrations/drafts?status=${status}`
        : `${API_URL}/api/work-integrations/drafts`;
      return fetchWithAuth(url, token);
    },
    {
      revalidateOnFocus: false,
    }
  );
}

export function useApproveDraft() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "approve-draft",
    async (
      _key: string,
      { arg }: { arg: { draftId: number; editedContent?: string; scheduleAt?: string } }
    ) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return fetchWithAuth(
        `${API_URL}/api/work-integrations/drafts/${arg.draftId}/approve`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            edited_content: arg.editedContent,
            schedule_at: arg.scheduleAt,
          }),
        }
      );
    }
  );
}

export function useRejectDraft() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "reject-draft",
    async (
      _key: string,
      { arg }: { arg: { draftId: number; reason?: string; rating?: number } }
    ) => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return fetchWithAuth(
        `${API_URL}/api/work-integrations/drafts/${arg.draftId}/reject`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            reason: arg.reason,
            feedback_rating: arg.rating,
          }),
        }
      );
    }
  );
}

// =============================================================================
// Hooks - Stats
// =============================================================================

export function useWorkIntegrationsOverview() {
  const { getToken } = useAuth();

  return useSWR<WorkIntegrationsOverview>(
    "work-integrations-overview",
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(`${API_URL}/api/work-integrations/stats`, token);
    },
    {
      revalidateOnFocus: false,
    }
  );
}

export function useIntegrationStats(integrationId: number | null) {
  const { getToken } = useAuth();

  return useSWR<IntegrationStats>(
    integrationId ? `integration-stats-${integrationId}` : null,
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return fetchWithAuth(
        `${API_URL}/api/work-integrations/stats/${integrationId}`,
        token
      );
    }
  );
}

// =============================================================================
// Hooks - Manual Digest Trigger
// =============================================================================

export function useTriggerDigest() {
  const { getToken } = useAuth();

  return useSWRMutation(
    "trigger-digest",
    async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      return fetchWithAuth(
        `${API_URL}/api/work-integrations/digest/trigger`,
        token,
        { method: "POST" }
      );
    }
  );
}
