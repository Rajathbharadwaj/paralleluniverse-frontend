import useSWR from "swr";
import { useAuth } from "@clerk/nextjs";
import { getApiUrl } from "@/lib/config";

const API_BASE_URL = typeof window !== 'undefined'
  ? getApiUrl('backend')
  : (process.env.NEXT_PUBLIC_MAIN_BACKEND_URL || "http://localhost:8002");

export interface UserPreferences {
  user_id: string;
  auto_post_enabled: boolean;
  aggression_level: "conservative" | "moderate" | "aggressive";
  niche: string[];
  target_audience: string;
  growth_goal: string;
  engagement_style: string;
  tone: string;
  daily_limits: Record<string, number>;
  optimal_times: string[];
  avoid_topics: string[];
  thread_topics: string[] | null;
  // Onboarding tracking
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
}

export function usePreferences() {
  const { getToken } = useAuth();

  return useSWR<{ success: boolean; preferences: UserPreferences }>(
    `${API_BASE_URL}/api/preferences`,
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
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );
}

export async function updatePreferences(
  data: Partial<UserPreferences>,
  token: string
): Promise<{ success: boolean; preferences: UserPreferences }> {
  const response = await fetch(`${API_BASE_URL}/api/preferences`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update preferences");
  }

  return response.json();
}
