/**
 * Workflow definitions - now fetched from API
 */
import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { getApiUrl } from "@/lib/config";

const API_BASE_URL = typeof window !== 'undefined'
  ? getApiUrl('backend')
  : (process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || "http://localhost:8002");

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty?: string;
  estimatedTime?: string;
  estimated_time_minutes?: number;
  expected_roi?: string;
  recommendedSchedule?: string;
}

/**
 * Hook to fetch workflows from the API
 */
export function useWorkflows() {
  const { getToken } = useAuth();

  return useSWR<{ workflows: WorkflowDefinition[] }>(
    `${API_BASE_URL}/api/workflows`,
    async (url: string) => {
      const token = await getToken();
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch workflows");
      }
      const data = await response.json();
      // Transform the API response to match our interface
      return {
        workflows: data.workflows.map((w: any) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          category: w.category,
          difficulty: w.difficulty,
          estimatedTime: w.estimated_time_minutes ? `${w.estimated_time_minutes} min` : undefined,
          estimated_time_minutes: w.estimated_time_minutes,
          expected_roi: w.expected_roi,
        }))
      };
    },
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );
}

/**
 * Get workflow by ID from a list of workflows
 */
export function getWorkflowById(workflows: WorkflowDefinition[], id: string): WorkflowDefinition | undefined {
  return workflows.find((w) => w.id === id);
}

/**
 * Get workflows by category from a list of workflows
 */
export function getWorkflowsByCategory(workflows: WorkflowDefinition[], category: string): WorkflowDefinition[] {
  return workflows.filter((w) => w.category === category);
}
