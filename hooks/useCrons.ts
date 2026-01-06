import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
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
  input_config?: {
    schedule_type?: string;
    model_name?: string;
    model_provider?: string;
  };
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
  const { getToken } = useAuth();

  return useSWR<{ cron_jobs: CronJob[] }>(
    `${API_BASE_URL}/api/cron-jobs`,
    async (url: string) => {
      const token = await getToken();
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
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
  const { getToken } = useAuth();

  return useSWR<{ runs: CronJobRun[] }>(
    cronJobId ? `${API_BASE_URL}/api/cron-jobs/${cronJobId}/runs` : null,
    async (url: string) => {
      const token = await getToken();
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
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

export async function toggleCronJob(cronJobId: number, token: string): Promise<{ is_active: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/api/cron-jobs/${cronJobId}/toggle`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to toggle cron job");
  }

  return response.json();
}

export async function runCronJobNow(cronJobId: number, token: string): Promise<{
  message: string;
  run_id: number | null;
  status: string;
  thread_id: string | null;
}> {
  const response = await fetch(`${API_BASE_URL}/api/cron-jobs/${cronJobId}/run`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to run automation" }));
    throw new Error(error.detail || "Failed to run automation");
  }

  return response.json();
}

export async function updateCronJob(
  cronJobId: number,
  data: {
    name?: string;
    schedule?: string;
    workflow_id?: string;
    custom_prompt?: string;
    input_config?: Record<string, any>;
  },
  token: string
): Promise<{ message: string; cron_job_id: number; input_config: Record<string, any> }> {
  const response = await fetch(`${API_BASE_URL}/api/cron-jobs/${cronJobId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to update automation" }));
    throw new Error(error.detail || "Failed to update automation");
  }

  return response.json();
}
