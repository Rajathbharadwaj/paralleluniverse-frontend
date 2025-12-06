import useSWR from "swr";
import { getApiUrl } from "@/lib/config";

const API_BASE_URL = typeof window !== 'undefined'
  ? getApiUrl('backend')
  : (process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || "http://localhost:8002");

export interface CronJob {
  id: number;
  name: string;
  schedule: string;
  workflow_id: string | null;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
}

export interface CronJobRun {
  id: number;
  started_at: string;
  completed_at: string | null;
  status: "running" | "completed" | "failed";
  thread_id: string | null;
  error_message: string | null;
}

export function useCrons() {
  return useSWR<{ cron_jobs: CronJob[] }>(
    `${API_BASE_URL}/api/cron-jobs`,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch cron jobs");
      }
      return response.json();
    },
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    }
  );
}

export function useCronRuns(cronJobId: number | null) {
  return useSWR<{ runs: CronJobRun[] }>(
    cronJobId ? `${API_BASE_URL}/api/cron-jobs/${cronJobId}/runs` : null,
    async (url: string) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch cron job runs");
      }
      return response.json();
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: true,
    }
  );
}

export async function createCronJob(
  data: {
    name: string;
    schedule: string;
    workflow_id?: string;
    custom_prompt?: string;
    input_config?: Record<string, any>;
  },
  token: string
) {
  const response = await fetch(`${API_BASE_URL}/api/cron-jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create cron job");
  }

  return response.json();
}

export async function deleteCronJob(cronJobId: number, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/cron-jobs/${cronJobId}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete cron job");
  }

  return response.json();
}
